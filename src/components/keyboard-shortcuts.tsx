"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string[];
  label: string;
  group: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], label: "Komut paletini aç", group: "Global" },
  { keys: ["/"], label: "Arama sayfasına git", group: "Global" },
  { keys: ["?"], label: "Bu yardımı aç/kapat", group: "Global" },
  { keys: ["Esc"], label: "Modal / palet kapat", group: "Global" },

  { keys: ["G", "H"], label: "Ana sayfa", group: "Git" },
  { keys: ["G", "C"], label: "Takvim", group: "Git" },
  { keys: ["G", "A"], label: "Ara", group: "Git" },
  { keys: ["G", "S"], label: "Ayarlar", group: "Git" },
  { keys: ["G", "R"], label: "Rastgele", group: "Git" },
  { keys: ["G", "V"], label: "Karşılaştır", group: "Git" },

  { keys: ["R"], label: "Yenile (arama sayfasında)", group: "Bağlam" },
];

const GOTO_MAP: Record<string, string> = {
  h: "/",
  c: "/calendar",
  a: "/search",
  s: "/settings",
  r: "/random",
  v: "/compare",
  f: "/settings",
  l: "/settings",
};

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const gPressed = useRef(false);
  const gTimer = useRef<number | null>(null);

  const isTyping = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      target.isContentEditable
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      /* G kombinasyonu */
      if (gPressed.current) {
        const path = GOTO_MAP[key];
        if (path) {
          e.preventDefault();
          router.push(path);
        }
        gPressed.current = false;
        if (gTimer.current) {
          clearTimeout(gTimer.current);
          gTimer.current = null;
        }
        return;
      }

      if (key === "g") {
        gPressed.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = window.setTimeout(() => {
          gPressed.current = false;
          gTimer.current = null;
        }, 1200);
        return;
      }

      /* Yardım */
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      /* Arama */
      if (e.key === "/") {
        e.preventDefault();
        router.push("/search");
        return;
      }

      /* Escape — modal kapat */
      if (e.key === "Escape" && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, [router, helpOpen, isTyping]);

  /* Help açıkken scroll kilidi */
  useEffect(() => {
    if (!helpOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [helpOpen]);

  return (
    <>
      <ShortcutHelpButton onClick={() => setHelpOpen(true)} />
      <AnimatePresence>
        {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   Header için küçük buton
   ============================================================ */
function ShortcutHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden h-8 w-8 items-center justify-center rounded-full border border-ink-700 bg-ink-900/60 text-xs text-muted-400 transition-colors hover:border-ink-600 hover:text-cream-200 lg:flex"
      aria-label="Klavye kısayolları"
      title="Klavye kısayolları (?)"
    >
      ?
    </button>
  );
}

/* ============================================================
   Yardım modalı
   ============================================================ */
function HelpModal({ onClose }: { onClose: () => void }) {
  /* Grupları sırayla */
  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[90] flex items-start justify-center bg-night-950/75 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Klavye kısayolları"
    >
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-700">
              Klavye
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-cream-50 sm:text-xl">
              Kısayollar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-700 text-xs text-muted-400 transition-colors hover:border-ink-600 hover:text-cream-50"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* İçerik */}
        <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group}>
                <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                  <span className="inline-block h-3 w-0.5 rounded-full bg-accent-400" />
                  {group}
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                    <li
                      key={s.keys.join("-")}
                      className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 bg-ink-900/30 px-3 py-2.5"
                    >
                      <span className="text-xs text-cream-200 sm:text-sm">
                        {s.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {s.keys.map((k, i) => (
                          <Kbd key={i}>{k}</Kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="flex items-center justify-between border-t border-ink-800 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-400">
          <span>SYTHERIS v0.1 · klavye navigasyonu</span>
          <span className="flex items-center gap-1">
            <Kbd>?</Kbd>
            <span>kapat</span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded border border-ink-700 bg-ink-900 px-1.5 font-mono text-[10px] font-medium text-cream-200 shadow-sm",
        className,
      )}
    >
      {children}
    </kbd>
  );
}