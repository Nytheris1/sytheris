"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useLibrary } from "@/lib/user-data";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES_IN_CONTEXT = 10;

const STARTERS = [
  "Bana psikolojik gerilim anime öner",
  "Kitaplığıma benzer ne izleyebilirim?",
  "Frieren ne hakkında?",
  "Bu sezon öne çıkanlar neler?",
];

export function AiChat() {
  const reduced = useReducedMotion();
  const library = useLibrary();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const libraryContext = useMemo(() => {
    if (library.length === 0) return "";
    const lines = library.slice(0, 40).map((item) => {
      const status =
        item.status === "watching"
          ? "izliyor"
          : item.status === "planned"
            ? "izleyecek"
            : item.status === "completed"
              ? "bitirdi"
              : "bıraktı";
      const score = item.rating ? ` · puanı ${item.rating}/10` : "";
      const year = item.seasonYear ? ` (${item.seasonYear})` : "";
      const genres =
        item.genres && item.genres.length > 0
          ? ` · türler: ${item.genres.slice(0, 3).join(", ")}`
          : "";
      return `- ${item.title}${year} · ${status}${score}${genres}`;
    });
    return lines.join("\n");
  }, [library]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
    });
  }, [messages, streaming, reduced]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !streaming) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, streaming]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);
      setError(null);

      const assistantIndex = nextMessages.length;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.slice(-MAX_MESSAGES_IN_CONTEXT),
            libraryContext,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const json = await res.json();
            if (json.error) msg = json.error;
          } catch {
            /* yoksay */
          }
          throw new Error(msg);
        }

        if (!res.body) throw new Error("Boş yanıt.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            copy[assistantIndex] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          /* iptal */
        } else {
          setError((err as Error).message);
          setMessages((prev) => {
            const copy = [...prev];
            if (copy[assistantIndex]?.content === "") {
              copy.splice(assistantIndex, 1);
            }
            return copy;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, libraryContext],
  );

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            onClick={() => setOpen(true)}
            aria-label="Hikari'yi aç"
            className="group fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-500 text-night-950 shadow-2xl shadow-accent-400/40 transition-transform hover:scale-105 md:bottom-6 md:right-6"
          >
            {/* Anime kızı avatar — basit silüet */}
            <span className="text-2xl" aria-hidden>
              🌸
            </span>
            {/* Yeşil durum noktası */}
            <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-ink-950 bg-accent-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="fixed inset-0 z-[80] bg-night-950/40 backdrop-blur-sm md:hidden"
              onClick={() => !streaming && setOpen(false)}
              aria-hidden
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: reduced ? 0 : 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed inset-y-0 right-0 z-[85] flex w-full flex-col border-l border-ink-800 bg-ink-950 shadow-2xl sm:w-[420px]"
              role="dialog"
              aria-label="Hikari — anime asistanı"
            >
              {/* Başlık */}
              <header className="flex items-center justify-between border-b border-ink-800 bg-gradient-to-r from-ink-950 to-ink-900/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-500 text-xl shadow-lg shadow-accent-400/30">
                    🌸
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-accent-400" />
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-cream-50">
                      Hikari
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent-700">
                      光 · anime asistanı
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={reset}
                      disabled={streaming}
                      className="rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400 transition-colors hover:text-cream-50 disabled:opacity-40"
                    >
                      temizle
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    disabled={streaming}
                    aria-label="Kapat"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-400 transition-colors hover:text-cream-50 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              </header>

              {/* Mesajlar */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {messages.length === 0 ? (
                  <EmptyChat onPick={send} />
                ) : (
                  <div className="space-y-4">
                    {messages.map((m, i) => (
                      <MessageBubble key={i} message={m} />
                    ))}
                    {error && (
                      <div className="rounded-xl border border-crimson-500/40 bg-crimson-500/10 px-4 py-3 text-xs text-crimson-500">
                        {error}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-ink-800 p-4">
                <div className="relative flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    disabled={streaming}
                    placeholder="Hikari'ye bir şey sor…"
                    rows={1}
                    className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none disabled:opacity-50"
                  />
                  {streaming ? (
                    <button
                      onClick={stop}
                      aria-label="Yanıtı durdur"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-crimson-500/50 text-crimson-500 transition-colors hover:bg-crimson-500/10"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => send(input)}
                      disabled={!input.trim()}
                      aria-label="Gönder"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-400 text-night-950 transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-500">
                  Enter gönder · Shift+Enter yeni satır
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyChat({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-400/30 to-accent-500/20 text-4xl shadow-lg shadow-accent-400/20">
          🌸
        </div>
        <p className="font-display text-xl font-semibold tracking-[-0.02em] text-cream-50">
          Merhaba senpai~ (◕‿◕)
        </p>
        <p className="mt-2 text-sm text-muted-400">
          Ben <span className="text-accent-700">Hikari</span>. Anime hakkında
          ne istersen sorabilirsin!
        </p>
      </div>

      <div className="space-y-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="w-full rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-3 text-left text-sm text-cream-200 transition-colors hover:border-accent-400/60 hover:bg-ink-900/70 hover:text-cream-50"
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-muted-500">
        ♪ 光 ile anime keşfetmeye hazır mısın? ♪
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-accent-400 px-4 py-3 text-sm leading-relaxed text-night-950">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-500 text-sm shadow-md">
        🌸
      </div>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-ink-800 bg-ink-900/60 px-4 py-3 text-sm leading-relaxed text-cream-100">
        {message.content === "" ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400 [animation-delay:200ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400 [animation-delay:400ms]" />
          </span>
        ) : (
          renderInline(message.content)
        )}
      </div>
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}