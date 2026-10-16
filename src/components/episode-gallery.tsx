"use client";

import Image from "next/image";
import Link from "next/link";
import { useWatchedEpisodes, toggleEpisodeWatched } from "@/lib/user-data";
import type { StreamingEpisode } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

interface EpisodeGalleryProps {
  animeId: number;
  streamingEpisodes: StreamingEpisode[];
}

export function EpisodeGallery({
  animeId,
  streamingEpisodes,
}: EpisodeGalleryProps) {
  const watched = useWatchedEpisodes(animeId);
  const watchedSet = new Set(watched);

  const items = streamingEpisodes
    .map((ep, i) => ({
      number: i + 1,
      title: ep.title,
      thumbnail: ep.thumbnail,
      url: ep.url,
      site: ep.site,
    }))
    .filter((e) => e.thumbnail);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
            Bölüm önizlemeleri
          </h2>
          <p className="mt-1 text-sm text-muted-400">
            {items.length} bölümden görsel önizleme
          </p>
        </div>
      </div>

      <div className="scrollbar-hide -mx-6 mt-6 flex gap-3 overflow-x-auto px-6 pb-3">
        {items.map((ep) => {
          const isWatched = watchedSet.has(ep.number);
          return (
            <div
              key={ep.number}
              className={cn(
                "group relative w-[180px] shrink-0 overflow-hidden rounded-xl border transition-all sm:w-[220px]",
                isWatched
                  ? "border-accent-500/50 bg-accent-400/[0.04]"
                  : "border-ink-800 bg-ink-900/30 hover:border-ink-700",
              )}
            >
              <button
                type="button"
                onClick={() => toggleEpisodeWatched(animeId, ep.number)}
                className="block w-full text-left"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-night-900">
                  <Image
                    src={ep.thumbnail!}
                    alt={ep.title || `${ep.number}. Bölüm`}
                    fill
                    quality={75}
                    sizes="220px"
                    className={cn(
                      "object-cover transition-transform duration-500 group-hover:scale-[1.05]",
                      isWatched && "opacity-60",
                    )}
                  />
                  {/* Bölüm numarası rozeti */}
                  <div className="absolute left-2 top-2 rounded-full bg-night-950/85 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-accent-400 backdrop-blur-sm">
                    {String(ep.number).padStart(2, "0")}
                  </div>

                  {/* İzlenme işareti */}
                  {isWatched && (
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-400 text-night-950">
                      ✓
                    </div>
                  )}

                  {/* Alt gradient + başlık */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night-950 via-night-950/60 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="line-clamp-2 text-[11px] font-medium leading-snug text-white">
                      {cleanTitle(ep.title, ep.number)}
                    </p>
                  </div>
                </div>
              </button>

              {ep.url && (
                <Link
                  href={ep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-night-950/70 text-[11px] text-white backdrop-blur-sm transition-colors hover:border-accent-400 hover:text-accent-400"
                  aria-label={`${ep.number}. bölümü ${ep.site ?? "kaynağında"} aç`}
                >
                  ↗
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
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