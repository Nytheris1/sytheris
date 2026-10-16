"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { fetchTrailer } from "@/lib/anilist/trailer";
import { pickTitle } from "@/lib/anilist/client";
import type { Anime } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";
import {
  useFavorites,
  useLibrary,
  toggleFavorite,
  markWatched,
  STATUS_ICONS,
} from "@/lib/user-data";
import type { SavedAnime } from "@/lib/user-data";
import { useToast } from "@/components/toast";
import { TrailerPlayer } from "@/components/trailer-player";

const HOVER_INTENT_MS = 800;
const CLOSE_DELAY_MS = 140;
const EXPAND_RATIO = 1.6;
const HEIGHT_SHRINK = 0.92;
const MIN_EXPANDED_WIDTH = 260;

interface AnimeCardProps {
  anime: Anime;
  index?: number;
  className?: string;
  disableTrailer?: boolean;
  expandOnHover?: boolean;
}

export function AnimeCard({
  anime,
  index = 0,
  className,
  disableTrailer = false,
  expandOnHover = true,
}: AnimeCardProps) {
  const reduced = useReducedMotion();
  const title = pickTitle(anime.title);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

  const favorites = useFavorites();
  const library = useLibrary();
  const toast = useToast();
  const fav = favorites.some((f) => f.id === anime.id);
  const entry = library.find((l) => l.id === anime.id);
  const status = entry?.status ?? null;

  const [expanded, setExpanded] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const expandedRef = useRef(false);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setSupportsHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSupportsHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (expanded) {
      document.body.classList.add("sytheris-hover-focus");
    } else {
      document.body.classList.remove("sytheris-hover-focus");
    }
    return () => {
      document.body.classList.remove("sytheris-hover-focus");
    };
  }, [expanded]);

  useEffect(() => {
    if (!expandOnHover) return;
    if (expanded) return;
    if (!cardRef.current) return;
    const el = cardRef.current;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBaseSize({ w: rect.width, h: rect.height });
      }
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, expandOnHover]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPreview = useCallback(() => {
    clearCloseTimer();
    if (expandedRef.current) return;
    clearOpenTimer();
    openTimerRef.current = window.setTimeout(() => {
      setExpanded(true);
    }, HOVER_INTENT_MS);
  }, [clearCloseTimer, clearOpenTimer]);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setExpanded(false);
    }, CLOSE_DELAY_MS);
  }, [clearOpenTimer, clearCloseTimer]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        clearOpenTimer();
        clearCloseTimer();
        setExpanded(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [clearOpenTimer, clearCloseTimer]);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearOpenTimer, clearCloseTimer]);

  const trailerQuery = useQuery({
    queryKey: ["trailer", anime.id],
    enabled: expanded && !disableTrailer && !reduced,
    queryFn: ({ signal }) => fetchTrailer(anime.id, { signal }),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 0,
  });

  const trailer = trailerQuery.data;

  const saved: SavedAnime = {
    id: anime.id,
    title,
    cover,
    format: anime.format,
    seasonYear: anime.seasonYear,
    averageScore: anime.averageScore,
    genres: anime.genres,
  };

  const href = `/anime/${anime.id}`;

  function handleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(saved);
    toast.success(fav ? "Favoriden çıkarıldı" : "Favoriye eklendi", title);
  }

  function handleWatched(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    markWatched(saved);
    toast.success(
      status === "completed" ? "İşaret kaldırıldı" : "İzlendi olarak işaretlendi",
      title,
    );
  }

  const canExpand = supportsHover && !disableTrailer && expandOnHover;

  const expandedWidth = baseSize
    ? Math.max(baseSize.w * EXPAND_RATIO, MIN_EXPANDED_WIDTH)
    : MIN_EXPANDED_WIDTH;
  const expandedHeight = baseSize ? baseSize.h * HEIGHT_SHRINK : undefined;

  const motionStyle =
    canExpand && expanded && baseSize
      ? {
          width: expandedWidth,
          minWidth: expandedWidth,
          height: expandedHeight,
        }
      : undefined;

  return (
    <motion.article
      ref={cardRef}
      layout={canExpand}
      transition={{
        layout: {
          duration: reduced ? 0 : 0.7,
          ease: [0.16, 1, 0.3, 1],
        },
        opacity: {
          duration: 0.45,
          delay: Math.min(index * 0.035, 0.5),
        },
        y: {
          duration: 0.45,
          delay: Math.min(index * 0.035, 0.5),
        },
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={motionStyle}
      className={cn(
        "anime-card group relative",
        expanded && "sytheris-card-open z-40",
        className,
      )}
      onMouseEnter={canExpand ? openPreview : undefined}
      onMouseLeave={canExpand ? scheduleClose : undefined}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] bg-ink-800",
          !expanded && "aspect-[2/3]",
          expanded && "h-full",
          "ring-1 ring-inset ring-ink-700/60",
          "transition-[box-shadow,ring-color] duration-500 ease-out",
          expanded
            ? "shadow-2xl shadow-black/80 ring-2 ring-accent-400/60"
            : "hover:ring-accent-400 hover:shadow-xl hover:shadow-night-950/20",
        )}
      >
        {cover && (
          <Image
            src={cover}
            alt={title}
            fill
            quality={85}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
            className={cn(
              "object-cover transition-opacity duration-500",
              (trailer || trailerQuery.isPending) && expanded && "opacity-0",
            )}
          />
        )}

        {expanded && trailerQuery.isPending && !reduced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 animate-pulse bg-gradient-to-br from-night-800 via-night-900 to-night-800"
          />
        )}

        {expanded && trailer && !reduced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 overflow-hidden bg-black"
          >
            <TrailerPlayer trailer={trailer} title={title} />
          </motion.div>
        )}

        {expanded && trailer && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/60 to-transparent" />
        )}

        {expanded && trailer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 p-3"
          >
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-md">
              {title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 font-mono text-[10px] uppercase tracking-wider text-cream-200/85">
              {anime.averageScore != null && (
                <>
                  <span className="text-accent-400">★ {anime.averageScore}</span>
                  <span>·</span>
                </>
              )}
              {anime.seasonYear && <span>{anime.seasonYear}</span>}
              {anime.format && (
                <>
                  <span>·</span>
                  <span>{anime.format}</span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {anime.averageScore != null && !expanded && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-night-950/85 px-2 py-1 text-[11px] font-semibold text-accent-400 backdrop-blur-sm">
            ★ {anime.averageScore}
          </div>
        )}

        {status && !expanded && (
          <div
            className={cn(
              "pointer-events-none absolute bottom-2 left-2 rounded-full px-2 py-1 text-[10px] font-medium backdrop-blur-md",
              status === "watching" && "bg-accent-400/90 text-night-950",
              status === "planned" && "bg-night-950/80 text-cream-50",
              status === "completed" && "bg-accent-400/90 text-night-950",
              status === "dropped" && "bg-night-950/80 text-crimson-500",
            )}
          >
            {STATUS_ICONS[status]}
          </div>
        )}

        <Link
          href={href}
          aria-label={title}
          className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500"
        />

        {!expanded && (
          <div
            className={cn(
              "absolute bottom-2 right-2 z-20 flex gap-1.5",
              "opacity-0 translate-y-1 transition-all duration-300",
              "group-hover:opacity-100 group-hover:translate-y-0",
              "group-focus-within:opacity-100 group-focus-within:translate-y-0",
            )}
          >
            <button
              type="button"
              onClick={handleFav}
              aria-label={fav ? "Favoriden çıkar" : "Favoriye ekle"}
              aria-pressed={fav}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-md backdrop-blur-md transition-colors",
                fav
                  ? "bg-accent-400 text-night-950 hover:bg-accent-500"
                  : "bg-night-950/80 text-white hover:bg-night-950",
              )}
            >
              {fav ? "★" : "☆"}
            </button>
            <button
              type="button"
              onClick={handleWatched}
              aria-label={
                status === "completed"
                  ? "İzlendi işaretini kaldır"
                  : "İzledim olarak işaretle"
              }
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-md backdrop-blur-md transition-colors",
                status === "completed"
                  ? "bg-accent-400 text-night-950 hover:bg-accent-500"
                  : "bg-night-950/80 text-white hover:bg-night-950",
              )}
            >
              ✓
            </button>
          </div>
        )}
      </div>

      <Link
        href={href}
        className={cn(
          "mt-3 block transition-opacity duration-300",
          expanded && "pointer-events-none opacity-0",
        )}
      >
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-cream-50 transition-colors group-hover:text-accent-700">
          {title}
        </h3>
        <p className="mt-1 text-xs text-muted-400">
          {anime.seasonYear ?? "—"} · {anime.format ?? "—"}
        </p>
      </Link>
    </motion.article>
  );
}