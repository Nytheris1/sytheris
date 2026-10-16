"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { StreamingEpisode } from "@/lib/anilist/types";
import {
  useWatchedEpisodes,
  useEpisodeRatings,
  useEpisodeNotes,
  toggleEpisodeWatched,
  setEpisodeRating,
  setEpisodeNote,
  markAllEpisodes,
  resetEpisodes,
  resetEpisodeRatings,
} from "@/lib/user-data";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

interface EpisodeListProps {
  animeId: number;
  streamingEpisodes: StreamingEpisode[];
  totalEpisodes: number | null;
}

interface DisplayEpisode {
  number: number;
  title: string;
  url: string | null;
  site: string | null;
  thumbnail: string | null;
}

export function EpisodeList({
  animeId,
  streamingEpisodes,
  totalEpisodes,
}: EpisodeListProps) {
  const watched = useWatchedEpisodes(animeId);
  const ratings = useEpisodeRatings(animeId);
  const notes = useEpisodeNotes(animeId);
  const watchedSet = new Set(watched);
  const [expanded, setExpanded] = useState(false);

  const displayEpisodes: DisplayEpisode[] =
    streamingEpisodes.length > 0
      ? streamingEpisodes.map((ep, i) => ({
          number: i + 1,
          title: ep.title || `${i + 1}. Bölüm`,
          url: ep.url || null,
          site: ep.site || null,
          thumbnail: ep.thumbnail ?? null,
        }))
      : totalEpisodes && totalEpisodes > 0
        ? Array.from({ length: totalEpisodes }, (_, i) => ({
            number: i + 1,
            title: `${i + 1}. Bölüm`,
            url: null,
            site: null,
            thumbnail: null,
          }))
        : [];

  const total = totalEpisodes ?? displayEpisodes.length;
  const watchedCount = watched.length;
  const progress = total > 0 ? Math.min(100, (watchedCount / total) * 100) : 0;

  const ratingValues = Object.values(ratings);
  const avgEpisodeRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length
      : null;

  const notesCount = Object.keys(notes).length;

  const INITIAL_VISIBLE = 24;
  const visible = expanded
    ? displayEpisodes
    : displayEpisodes.slice(0, INITIAL_VISIBLE);
  const hiddenCount = displayEpisodes.length - INITIAL_VISIBLE;

  if (displayEpisodes.length === 0) {
    return (
      <section>
        <SectionHeading>Bölümler</SectionHeading>
        <div className="mt-6 rounded-xl border border-ink-800 bg-ink-900/40 p-6 text-sm text-muted-400">
          Bu anime için bölüm bilgisi bulunamadı.
        </div>
      </section>
    );
  }

  const isRealList = streamingEpisodes.length > 0;
  const hasThumbnails = displayEpisodes.some((e) => e.thumbnail);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading>Bölümler</SectionHeading>
        <div className="flex items-center gap-2">
          {avgEpisodeRating != null && (
            <span className="flex items-center gap-1 rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-accent-700">
              <span aria-hidden>★</span>
              {avgEpisodeRating.toFixed(1)}
              <span className="text-muted-400">({ratingValues.length})</span>
            </span>
          )}
          {notesCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-ink-700 bg-ink-900/60 px-2.5 py-1 font-mono text-[10px] font-semibold text-cream-200">
              <span aria-hidden>✎</span>
              {notesCount}
            </span>
          )}
          <span className="font-mono text-[11px] tabular-nums text-muted-400">
            {watchedCount} / {total} izlendi
          </span>
        </div>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full bg-accent-400 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400">
        {isRealList
          ? hasThumbnails
            ? "Kaynak: AniList · resmi yayın bölümleri"
            : "Kaynak: AniList resmi yayın bölümleri"
          : "Kaynak: toplam bölüm sayısı (resmi bölüm listesi yok)"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => markAllEpisodes(animeId, total)}
          className="text-xs text-muted-400 transition-colors hover:text-accent-700"
        >
          Tümünü izlendi işaretle
        </button>
        <span className="text-muted-500">·</span>
        <button
          onClick={() => resetEpisodes(animeId)}
          disabled={watchedCount === 0}
          className="text-xs text-muted-400 transition-colors hover:text-crimson-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-400"
        >
          İzlemeyi sıfırla
        </button>
        {ratingValues.length > 0 && (
          <>
            <span className="text-muted-500">·</span>
            <button
              onClick={() => {
                if (confirm("Tüm bölüm puanları silinsin mi?")) {
                  resetEpisodeRatings(animeId);
                }
              }}
              className="text-xs text-muted-400 transition-colors hover:text-crimson-500"
            >
              Puanları sıfırla
            </button>
          </>
        )}
      </div>

      <ul className="mt-4 space-y-1.5">
        <AnimatePresence initial={false}>
          {visible.map((ep) => (
            <EpisodeRow
              key={ep.number}
              animeId={animeId}
              episode={ep}
              watched={watchedSet.has(ep.number)}
              rating={ratings[String(ep.number)] ?? null}
              note={notes[String(ep.number)] ?? ""}
              onToggle={() => toggleEpisodeWatched(animeId, ep.number)}
              onRate={(r) => setEpisodeRating(animeId, ep.number, r)}
              onNoteChange={(n) => setEpisodeNote(animeId, ep.number, n)}
              showThumbnail={hasThumbnails}
            />
          ))}
        </AnimatePresence>
      </ul>

      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 w-full rounded-xl border border-ink-800 bg-ink-900/40 py-3 text-sm font-medium text-cream-200 transition-colors hover:border-ink-600 hover:bg-ink-900/60"
        >
          {hiddenCount} bölüm daha göster
        </button>
      )}

      {expanded && displayEpisodes.length > INITIAL_VISIBLE && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-4 w-full rounded-xl border border-ink-800 bg-ink-900/40 py-3 text-sm font-medium text-muted-400 transition-colors hover:border-ink-600 hover:text-cream-200"
        >
          Daha az göster
        </button>
      )}
    </section>
  );
}

function EpisodeRow({
  animeId,
  episode,
  watched,
  rating,
  note,
  onToggle,
  onRate,
  onNoteChange,
  showThumbnail,
}: {
  animeId: number;
  episode: DisplayEpisode;
  watched: boolean;
  rating: number | null;
  note: string;
  onToggle: () => void;
  onRate: (r: number | null) => void;
  onNoteChange: (n: string) => void;
  showThumbnail: boolean;
}) {
  const reduced = useReducedMotion();
  const toast = useToast();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(note);
  const noteSaveRef = useRef<number | null>(null);
  const ratingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNoteValue(note);
  }, [note]);

  useEffect(() => {
    if (!ratingOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setRatingOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRatingOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ratingOpen]);

  function handleNoteChange(v: string) {
    setNoteValue(v);
    if (noteSaveRef.current) window.clearTimeout(noteSaveRef.current);
    noteSaveRef.current = window.setTimeout(() => {
      onNoteChange(v);
    }, 600);
  }

  const hasNote = note.trim().length > 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
      className="relative"
    >
      <div
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border p-2 pr-2 transition-all sm:gap-4 sm:p-2.5 sm:pr-3",
          watched
            ? "border-accent-500/50 bg-accent-400/[0.06]"
            : "border-ink-800 bg-ink-900/30 hover:border-ink-700 hover:bg-ink-900/60",
        )}
      >
        <button
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 sm:gap-4"
          aria-pressed={watched}
          aria-label={`${episode.number}. bölümü ${watched ? "izlenmedi" : "izlendi"} olarak işaretle`}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs transition-colors",
              watched
                ? "border-accent-500 bg-accent-400 text-night-950"
                : "border-ink-600 text-transparent group-hover:border-ink-500",
            )}
            aria-hidden
          >
            ✓
          </span>

          {showThumbnail && (
            <span
              className={cn(
                "relative hidden h-12 w-[86px] shrink-0 overflow-hidden rounded-md bg-ink-800 ring-1 ring-ink-700/60 transition-all sm:block",
                watched ? "opacity-60" : "opacity-100",
              )}
            >
              {episode.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={episode.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-muted-500">
                  {String(episode.number).padStart(2, "0")}
                </span>
              )}
            </span>
          )}

          <span
            className={cn(
              "shrink-0 font-mono text-sm tabular-nums transition-colors",
              watched ? "text-accent-700" : "text-muted-400",
            )}
          >
            {String(episode.number).padStart(2, "0")}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block line-clamp-1 text-sm transition-colors",
                watched ? "text-cream-200" : "text-cream-50",
              )}
            >
              {cleanTitle(episode.title, episode.number)}
            </span>
            {episode.site && !hasNote && (
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted-400">
                {episode.site}
              </span>
            )}
          </span>
        </button>

        {/* Not butonu */}
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
            hasNote
              ? "border-accent-500/50 bg-accent-400/10 text-accent-700 hover:bg-accent-400/20"
              : noteOpen
                ? "border-ink-600 bg-ink-900 text-cream-50"
                : "border-ink-700 text-muted-400 hover:border-ink-600 hover:text-cream-200",
          )}
          aria-label={`${episode.number}. bölüme not ${hasNote ? "düzenle" : "ekle"}`}
          aria-expanded={noteOpen}
          title={hasNote ? "Notu düzenle" : "Not ekle"}
        >
          ✎
        </button>

        {/* Puan butonu */}
        <div ref={ratingRef} className="relative shrink-0">
          <button
            onClick={() => setRatingOpen((v) => !v)}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border px-2 text-xs transition-colors",
              rating != null
                ? "border-accent-500 bg-accent-400/15 text-accent-700 hover:bg-accent-400/25"
                : "border-ink-700 text-muted-400 hover:border-ink-600 hover:text-cream-200",
            )}
            aria-label={
              rating != null
                ? `${episode.number}. bölüm puanı: ${rating}. Değiştir.`
                : `${episode.number}. bölümü puanla`
            }
            aria-expanded={ratingOpen}
          >
            <span aria-hidden className="text-[13px]">
              {rating != null ? "★" : "☆"}
            </span>
            {rating != null && (
              <span className="font-mono text-[10px] font-semibold tabular-nums">
                {rating}
              </span>
            )}
          </button>

          <AnimatePresence>
            {ratingOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 z-30 mb-2 w-max rounded-xl border border-ink-700 bg-ink-950 p-2 shadow-2xl"
                role="dialog"
                aria-label="Bölüm puanı"
              >
                <p className="mb-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400">
                  Puan ver
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const exact = rating === n;
                    return (
                      <button
                        key={n}
                        onClick={() => {
                          onRate(exact ? null : n);
                          setRatingOpen(false);
                        }}
                        aria-label={`${n} puan`}
                        aria-pressed={exact}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[11px] font-semibold tabular-nums transition-all",
                          exact
                            ? "border-accent-500 bg-accent-400 text-night-950"
                            : rating != null && n <= rating
                              ? "border-accent-500/60 bg-accent-400/20 text-accent-700 hover:bg-accent-400/35"
                              : "border-ink-700 text-cream-200 hover:border-ink-600 hover:bg-ink-900",
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {rating != null && (
                  <button
                    onClick={() => {
                      onRate(null);
                      setRatingOpen(false);
                    }}
                    className="mt-1.5 w-full text-[10px] text-muted-400 transition-colors hover:text-crimson-500"
                  >
                    Puanı kaldır
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {episode.url && (
          <a
            href={episode.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-700 text-xs text-muted-400 transition-colors hover:border-accent-500 hover:text-accent-700"
            aria-label={`${episode.number}. bölümü ${episode.site ?? "kaynağında"} aç`}
            title={episode.site ? `${episode.site}'da aç` : "Kaynağı aç"}
          >
            ↗
          </a>
        )}
      </div>

      {/* Not alanı */}
      <AnimatePresence initial={false}>
        {noteOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 rounded-xl border border-ink-800 bg-ink-900/40 p-2.5">
              <textarea
                value={noteValue}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Bu bölümle ilgili notun…"
                rows={3}
                className="w-full resize-none rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none"
                autoFocus
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-400">
                  {noteValue.length} karakter · otomatik kaydedilir
                </span>
                <button
                  onClick={() => setNoteOpen(false)}
                  className="text-[11px] text-muted-400 transition-colors hover:text-cream-50"
                >
                  Kapat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
      <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
      {children}
    </h2>
  );
}

function cleanTitle(title: string, number: number): string {
  const trimmed = title.trim();
  const patterns = [
    new RegExp(`^episode\\s*${number}\\s*[-–:]\\s*`, "i"),
    new RegExp(`^ep\\.?\\s*${number}\\s*[-–:]\\s*`, "i"),
    new RegExp(`^${number}\\s*[-–:]\\s*`),
  ];
  for (const p of patterns) {
    if (p.test(trimmed)) {
      return trimmed.replace(p, "").trim() || `${number}. Bölüm`;
    }
  }
  return trimmed || `${number}. Bölüm`;
}