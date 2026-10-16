"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { SEARCH_ANIME } from "@/lib/anilist/queries";
import type { Anime, Page } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

interface PageLink {
  href: string;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
}

const PAGE_LINKS: PageLink[] = [
  {
    href: "/",
    label: "Ana Sayfa",
    description: "Keşfet",
    icon: "◆",
    keywords: ["home", "ana", "keşfet"],
  },
  {
    href: "/calendar",
    label: "Yayın Takvimi",
    description: "Bu hafta çıkacaklar",
    icon: "▦",
    keywords: ["calendar", "takvim", "yayın", "schedule"],
  },
  {
    href: "/compare",
    label: "Karşılaştır",
    description: "İki animeyi yan yana",
    icon: "⇄",
    keywords: ["compare", "karşılaştır", "vs", "yan yana"],
  },
  {
    href: "/wrapped",
    label: "Yıl Özeti",
    description: "Bu yıl ne izledim?",
    icon: "✦",
    keywords: ["wrapped", "yıl", "özet", "istatistik", "year", "review"],
  },
  {
    href: "/random",
    label: "Rastgele Keşif",
    description: "Şansını dene",
    icon: "🎲",
    keywords: ["random", "rastgele", "keşif"],
  },
  {
    href: "/search",
    label: "Katalogda Ara",
    description: "Filtrele, sırala",
    icon: "⌕",
    keywords: ["search", "ara", "katalog"],
  },
  {
    href: "/settings",
    label: "Ayarlar",
    description: "Kitaplık, müzik, tema",
    icon: "⚙",
    keywords: ["settings", "ayar", "kitaplık", "müzik", "tema"],
  },
  {
    href: "/settings#library",
    label: "Kitaplığım",
    description: "İzleme durumların",
    icon: "◐",
    keywords: ["library", "kitaplık", "izliyorum", "izledim"],
  },
  {
    href: "/settings#favorites",
    label: "Favorilerim",
    description: "Beğendiklerin",
    icon: "★",
    keywords: ["favorites", "favori", "beğendiklerim"],
  },
  {
    href: "/settings#stats",
    label: "İstatistik",
    description: "İzleme alışkanlıkların",
    icon: "▦",
    keywords: ["stats", "istatistik", "grafik"],
  },
  {
    href: "/settings#music",
    label: "Müzik Ayarları",
    description: "Ses ve ekolayzer",
    icon: "♪",
    keywords: ["music", "müzik", "ses", "ekolayzer"],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const trimmed = query.trim();

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    if (!trimmed) {
      setDebounced("");
      return;
    }
    const t = setTimeout(() => setDebounced(trimmed), 250);
    return () => clearTimeout(t);
  }, [trimmed]);

  const { data, isFetching } = useQuery({
    queryKey: ["command-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(
        SEARCH_ANIME,
        {
          page: 1,
          perPage: 6,
          search: debounced,
          sort: ["POPULARITY_DESC"],
        },
        { signal },
      ),
    staleTime: 60_000,
  });

  const animeResults = data?.Page.media ?? [];

  const pageResults = trimmed
    ? PAGE_LINKS.filter((p) => {
        const q = trimmed.toLowerCase();
        return (
          p.label.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.includes(q))
        );
      })
    : PAGE_LINKS;

  type Item =
    | { kind: "page"; page: PageLink }
    | { kind: "anime"; anime: Anime };

  const items: Item[] = [
    ...pageResults.map((p): Item => ({ kind: "page", page: p })),
    ...animeResults.map((a): Item => ({ kind: "anime", anime: a })),
  ];

  useEffect(() => {
    if (selected >= items.length) setSelected(Math.max(0, items.length - 1));
  }, [items.length, selected]);

  const go = useCallback(
    (item: Item) => {
      setOpen(false);
      if (item.kind === "page") {
        router.push(item.page.href);
      } else {
        router.push(`/anime/${item.anime.id}`);
      }
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[selected];
      if (item) go(item);
    }
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[selected] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-night-950/70 p-4 pt-[12vh] backdrop-blur-sm sm:pt-[15vh]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Komut paleti"
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-3.5">
              <span aria-hidden className="text-muted-400">
                ⌕
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Ara veya bir sayfaya git…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cream-50 placeholder:text-muted-500 focus:outline-none"
                aria-label="Komut ara"
              />
              {isFetching && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-400">
                  aranıyor
                </span>
              )}
              <kbd className="hidden rounded border border-ink-700 px-1.5 py-0.5 font-mono text-[10px] text-muted-400 sm:inline">
                esc
              </kbd>
            </div>

            <ul
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto py-2"
              role="listbox"
            >
              {items.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-muted-400">
                  {trimmed.length >= 2 && !isFetching
                    ? "Sonuç bulunamadı."
                    : "Yazmaya başla…"}
                </li>
              ) : (
                items.map((item, i) => (
                  <li key={i} role="option" aria-selected={i === selected}>
                    <button
                      onClick={() => go(item)}
                      onMouseEnter={() => setSelected(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        i === selected ? "bg-ink-900" : "hover:bg-ink-900/60",
                      )}
                    >
                      {item.kind === "page" ? (
                        <>
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition-colors",
                              i === selected
                                ? "bg-accent-400 text-night-950"
                                : "bg-ink-800 text-muted-400",
                            )}
                            aria-hidden
                          >
                            {item.page.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-cream-50">
                              {item.page.label}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-400">
                              {item.page.description}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-400">
                            sayfa
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-ink-800 ring-1 ring-ink-700">
                            {item.anime.coverImage.large && (
                              <Image
                                src={
                                  item.anime.coverImage.large ??
                                  item.anime.coverImage.extraLarge!
                                }
                                alt=""
                                fill
                                quality={80}
                                sizes="36px"
                                className="object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-cream-50">
                              {pickTitle(item.anime.title)}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-muted-400">
                              {item.anime.seasonYear ?? "—"} ·{" "}
                              {item.anime.format ?? "—"}
                              {item.anime.averageScore
                                ? ` · ★ ${item.anime.averageScore}`
                                : ""}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-400">
                            anime
                          </span>
                        </>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center justify-between gap-4 border-t border-ink-800 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-ink-700 px-1.5 py-0.5">
                    ↑↓
                  </kbd>
                  gez
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-ink-700 px-1.5 py-0.5">
                    ↵
                  </kbd>
                  aç
                </span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-ink-700 px-1.5 py-0.5">
                  ⌘K
                </kbd>
                kapat
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}