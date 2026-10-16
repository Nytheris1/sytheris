"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { RECENT_EPISODES } from "@/lib/anilist/queries";
import { useLibrary } from "@/lib/user-data";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationsPermission,
} from "@/components/notifications-manager";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;

interface EpisodeEntry {
  id: number;
  episode: number;
  airingAt: number;
  media: {
    id: number;
    title: {
      romaji: string | null;
      english: string | null;
      native: string | null;
    };
    coverImage: {
      extraLarge: string | null;
      large: string | null;
      color: string | null;
    };
    format: string | null;
    seasonYear: number | null;
    averageScore: number | null;
    episodes: number | null;
  };
}

interface Page {
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
  airingSchedules: EpisodeEntry[];
}

export function NewEpisodesMenu() {
  const library = useLibrary();
  const [open, setOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const watchingIds = useMemo(
    () => library.filter((l) => l.status === "watching").map((l) => l.id),
    [library],
  );

  const { fromSec, toSec } = useMemo(() => {
    const now = Date.now();
    return {
      fromSec: Math.floor((now - WINDOW_DAYS * DAY_MS) / 1000),
      toSec: Math.floor(now / 1000),
    };
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["recent-episodes", watchingIds.sort().join(","), fromSec],
    enabled: watchingIds.length > 0,
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page }>(
        RECENT_EPISODES,
        {
          from: fromSec,
          to: toSec,
          mediaIds: watchingIds,
          perPage: 50,
        },
        { signal },
      ),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const episodes = data?.Page.airingSchedules ?? [];

  /* Bildirim durumunu oku */
  useEffect(() => {
    if (typeof window === "undefined") return;
    setNotifEnabled(getNotificationsEnabled());
    setNotifSupported("Notification" in window);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggleNotifications() {
    if (!notifSupported) return;

    if (notifEnabled) {
      setNotificationsEnabled(false);
      setNotifEnabled(false);
      return;
    }

    const perm = await requestNotificationsPermission();
    if (perm === "granted") {
      setNotificationsEnabled(true);
      setNotifEnabled(true);
    } else {
      setNotificationsEnabled(false);
      setNotifEnabled(false);
    }
  }

  if (watchingIds.length === 0) return null;

  const count = episodes.length;

  const rssUrl =
    typeof window !== "undefined" && watchingIds.length > 0
      ? `${window.location.origin}/feed.xml?ids=${watchingIds.join(",")}`
      : "";

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
          count > 0
            ? open
              ? "border-accent-400 bg-accent-400/15 text-accent-700"
              : "border-accent-400/60 bg-accent-400/10 text-accent-700 hover:border-accent-400"
            : "border-ink-700 bg-ink-900/60 text-cream-200 hover:border-ink-600",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Yeni bölümler"
      >
        <span aria-hidden className="text-sm">
          ✦
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] lg:inline">
          Yeni
        </span>
        {count > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 font-mono text-[9px] font-bold tabular-nums text-night-950">
            {count > 99 ? "99+" : count}
          </span>
        )}
        {count === 0 && isFetching && (
          <span
            aria-hidden
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400/60"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border border-ink-700 bg-ink-950 shadow-2xl"
            role="menu"
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                Son 7 gün · İzlediklerin
              </p>
              <span className="font-mono text-[10px] text-muted-400">
                {watchingIds.length} anime
              </span>
            </div>

            {count === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-cream-50">Yeni bölüm yok</p>
                <p className="mt-1 text-xs text-muted-400">
                  Takip ettiğin animelerde son 7 günde yeni bölüm çıkmadı.
                </p>
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-1">
                {episodes.map((ep) => (
                  <li key={ep.id}>
                    <EpisodeRow entry={ep} onNavigate={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            )}

            {/* Bildirim + RSS kontrolleri */}
            {notifSupported && (
              <div className="border-t border-ink-800 px-3 py-2.5">
                <button
                  onClick={toggleNotifications}
                  className="flex w-full items-center justify-between gap-3 text-left"
                  aria-pressed={notifEnabled}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="text-sm">
                      {notifEnabled ? "🔔" : "🔕"}
                    </span>
                    <span className="text-xs text-cream-200">
                      {notifEnabled
                        ? "Bildirimler açık"
                        : "Bildirimleri aç"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                      notifEnabled ? "bg-accent-400" : "bg-ink-700",
                    )}
                    aria-hidden
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform",
                        notifEnabled ? "translate-x-[18px]" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>

                {rssUrl && (
                  <button
                    onClick={() => {
                      navigator.clipboard
                        .writeText(rssUrl)
                        .then(() => {
                          setOpen(false);
                        })
                        .catch(() => {});
                    }}
                    className="mt-2 flex w-full items-center justify-between gap-2 rounded-md border border-ink-800 bg-ink-900/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-400 transition-colors hover:border-ink-700 hover:text-cream-200"
                    title="RSS linkini kopyala"
                  >
                    <span>RSS besleme linkini kopyala</span>
                    <span aria-hidden>⧉</span>
                  </button>
                )}
              </div>
            )}

            <Link
              href="/calendar"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-t border-ink-800 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400 transition-colors hover:bg-ink-900/60 hover:text-cream-50"
            >
              <span>Yayın takvimi</span>
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EpisodeRow({
  entry,
  onNavigate,
}: {
  entry: EpisodeEntry;
  onNavigate: () => void;
}) {
  const title = pickTitle(entry.media.title);
  const cover = entry.media.coverImage.large ?? entry.media.coverImage.extraLarge;
  const aired = new Date(entry.airingAt * 1000);

  return (
    <Link
      href={`/anime/${entry.media.id}`}
      onClick={onNavigate}
      className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-ink-900"
      role="menuitem"
    >
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-ink-800 ring-1 ring-ink-800">
        {cover && (
          <Image
            src={cover}
            alt={title}
            fill
            quality={85}
            sizes="40px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-xs font-medium text-cream-50 transition-colors group-hover:text-accent-700">
          {title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
          <span className="rounded bg-accent-400/15 px-1.5 py-0.5 font-semibold text-accent-700">
            {entry.episode}. BÖLÜM
          </span>
          <span className="text-muted-400">{formatRelative(aired)}</span>
        </p>
      </div>

      <span
        aria-hidden
        className="shrink-0 text-muted-400 transition-colors group-hover:text-accent-700"
      >
        →
      </span>
    </Link>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} dk önce`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "dün";
  return `${days} gün önce`;
}