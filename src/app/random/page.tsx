"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { RANDOM_ANIME, GENRE_COLLECTION } from "@/lib/anilist/queries";
import type { Anime, Page } from "@/lib/anilist/types";
import { useFavorites, toggleFavorite } from "@/lib/user-data";
import type { SavedAnime } from "@/lib/user-data";
import { cn } from "@/lib/utils";

const FORMATS = [
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Film" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
];

const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => YEAR_NOW - i);

/* AniList ~5000 sonuçla sınırlı. perPage 30 × max 100 sayfa = 3000 güvenli. */
const PER_PAGE = 30;
const MAX_PAGE = 100;

export default function RandomPage() {
  const reduced = useReducedMotion();
  const [seed, setSeed] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [genres, setGenres] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState<number | "">("");
  const [yearMax, setYearMax] = useState<number | "">("");
  const [format, setFormat] = useState<string>("");
  const [minScore, setMinScore] = useState<number | "">("");

  const genreList = useQuery({
    queryKey: ["genre-collection"],
    queryFn: ({ signal }) =>
      anilistRequest<{ GenreCollection: string[] }>(GENRE_COLLECTION, {}, { signal }),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["random-anime", seed, genres, yearMin, yearMax, format, minScore],
    queryFn: async ({ signal }) => {
      // startDate_greater/lesser: YYYYMMDD formatında (FuzzyDateInt)
      const variables = {
        perPage: PER_PAGE,
        genre_in: genres.length ? genres : undefined,
        startDate_greater:
          yearMin === "" ? undefined : yearMin * 10000 + 101, // 1 Ocak
        startDate_lesser:
          yearMax === "" ? undefined : yearMax * 10000 + 1231, // 31 Aralık
        format_in: format ? [format] : undefined,
        averageScore_greater: minScore === "" ? undefined : minScore,
      };

      // Önce toplam sayfa bilgisini al (page 1)
      const first = await anilistRequest<{ Page: Page<Anime> }>(
        RANDOM_ANIME,
        { ...variables, page: 1 },
        { signal },
      );

      const lastPage = Math.max(
        1,
        Math.min(first.Page.pageInfo.lastPage || 1, MAX_PAGE),
      );

      // Eğer sadece 1 sayfa varsa direkt oradan seç
      if (lastPage === 1) {
        const media = first.Page.media;
        if (media.length === 0) {
          throw new Error(
            "Bu filtrelerle sonuç bulunamadı. Filtreleri gevşetmeyi dene.",
          );
        }
        return media[Math.floor(Math.random() * media.length)];
      }

      // Rastgele bir sayfa seç
      const randomPage = Math.floor(Math.random() * lastPage) + 1;

      let media = first.Page.media;

      if (randomPage !== 1) {
        const res = await anilistRequest<{ Page: Page<Anime> }>(
          RANDOM_ANIME,
          { ...variables, page: randomPage },
          { signal },
        );
        media = res.Page.media;
      }

      if (media.length === 0) {
        // son çare: ilk sayfadan seç
        if (first.Page.media.length > 0) {
          return first.Page.media[
            Math.floor(Math.random() * first.Page.media.length)
          ];
        }
        throw new Error(
          "Bu filtrelerle sonuç bulunamadı. Filtreleri gevşetmeyi dene.",
        );
      }

      return media[Math.floor(Math.random() * media.length)];
    },
  });

  const roll = useCallback(() => setSeed((s) => s + 1), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLSelectElement) return;
      if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        roll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [roll]);

  const activeFilterCount =
    (genres.length ? 1 : 0) +
    (yearMin !== "" ? 1 : 0) +
    (yearMax !== "" ? 1 : 0) +
    (format ? 1 : 0) +
    (minScore !== "" ? 1 : 0);

  function clearFilters() {
    setGenres([]);
    setYearMin("");
    setYearMax("");
    setFormat("");
    setMinScore("");
  }

  const favorites = useFavorites();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <PageHeader
        eyebrow="Şansını dene"
        title="Rastgele keşif"
        description="Filtreleri ayarla, butona bas; katalogdan rastgele bir anime seçilsin."
        actions={
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              filtersOpen
                ? "border-accent-400 text-accent-700"
                : "border-ink-600 text-cream-50 hover:border-cream-50",
            )}
            aria-expanded={filtersOpen}
          >
            Filtreler
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-accent-400/15 px-2 py-0.5 text-xs text-accent-700">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mb-10 space-y-6 rounded-2xl border border-ink-800 bg-ink-900/50 p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                  Türler
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(genreList.data?.GenreCollection ?? []).map((g) => {
                    const active = genres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() =>
                          setGenres((prev) =>
                            prev.includes(g)
                              ? prev.filter((x) => x !== g)
                              : [...prev, g],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          active
                            ? "border-accent-400 bg-accent-400/10 text-accent-700"
                            : "border-ink-700 text-cream-200 hover:border-ink-600",
                        )}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                    En eski yıl
                  </h3>
                  <select
                    value={yearMin}
                    onChange={(e) =>
                      setYearMin(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-3 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-cream-50 focus:border-accent-400 focus:outline-none"
                  >
                    <option value="">Hepsi</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                    En yeni yıl
                  </h3>
                  <select
                    value={yearMax}
                    onChange={(e) =>
                      setYearMax(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-3 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-cream-50 focus:border-accent-400 focus:outline-none"
                  >
                    <option value="">Hepsi</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                    Format
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FORMATS.map((f) => {
                      const active = format === f.value;
                      return (
                        <button
                          key={f.value}
                          onClick={() => setFormat(active ? "" : f.value)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            active
                              ? "border-accent-400 bg-accent-400/10 text-accent-700"
                              : "border-ink-700 text-cream-200 hover:border-ink-600",
                          )}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                      Min puan
                    </h3>
                    <span className="font-mono text-[10px] text-muted-400">
                      {minScore === "" ? "hepsi" : `${minScore}+`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={minScore === "" ? 0 : minScore}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMinScore(v === 0 ? "" : v);
                    }}
                    className="mt-4 w-full accent-accent-400"
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-400 transition-colors hover:text-cream-50"
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6">
        {isPending ? (
          <RandomSkeleton />
        ) : isError ? (
          <EmptyState
            icon="!"
            title="Sonuç bulunamadı"
            description={(error as Error).message}
            action={{ onClick: () => refetch(), label: "Tekrar dene" }}
          />
        ) : data ? (
          <RandomCard
            anime={data}
            rolling={isFetching}
            onRoll={roll}
            fav={favorites.some((f) => f.id === data.id)}
          />
        ) : null}
      </div>
    </main>
  );
}

function RandomCard({
  anime,
  rolling,
  onRoll,
  fav,
}: {
  anime: Anime;
  rolling: boolean;
  onRoll: () => void;
  fav: boolean;
}) {
  const reduced = useReducedMotion();
  const title = pickTitle(anime.title);
  const banner = anime.bannerImage ?? anime.coverImage.extraLarge;
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

  const saved: SavedAnime = {
    id: anime.id,
    title,
    cover,
    format: anime.format,
    seasonYear: anime.seasonYear,
    averageScore: anime.averageScore,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={anime.id}
        initial={{ opacity: 0, y: 24, scale: reduced ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: reduced ? 1 : 0.98 }}
        transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] border border-ink-800 bg-ink-900/40",
          rolling && "opacity-60",
        )}
      >
        <div className="relative h-[36vh] min-h-[260px] w-full overflow-hidden bg-night-950">
          {banner && (
            <Image
              src={banner}
              alt={title}
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/60 to-night-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-night-950/85 via-night-950/30 to-transparent" />

          <div className="absolute left-6 top-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-400">
            <span className="inline-block h-px w-6 bg-accent-400" />
            <span>Rastgele seçim</span>
          </div>
        </div>

        <div className="relative -mt-32 grid gap-8 px-6 pb-8 md:-mt-40 md:grid-cols-[200px_1fr] md:px-8">
          <div className="relative aspect-[2/3] w-32 overflow-hidden rounded-[var(--radius-card)] bg-ink-800 shadow-2xl ring-1 ring-ink-700/60 md:w-full">
            {cover && (
              <Image
                src={cover}
                alt={title}
                fill
                quality={90}
                sizes="(max-width: 768px) 128px, 200px"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-col justify-end pt-4 md:pt-20">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {title}
            </h2>
            {anime.title.native && anime.title.native !== title && (
              <p className="mt-2 text-sm text-muted-400">{anime.title.native}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-cream-200 md:text-sm">
              {anime.seasonYear && <span>{anime.seasonYear}</span>}
              {anime.format && (
                <>
                  <span className="text-muted-500">·</span>
                  <span>{anime.format}</span>
                </>
              )}
              {anime.episodes && (
                <>
                  <span className="text-muted-500">·</span>
                  <span>{anime.episodes} bölüm</span>
                </>
              )}
              {anime.averageScore != null && (
                <>
                  <span className="text-muted-500">·</span>
                  <span className="font-semibold text-accent-700">
                    ★ {anime.averageScore}
                  </span>
                </>
              )}
            </div>

            {anime.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {anime.genres.slice(0, 5).map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-ink-700 bg-ink-950/50 px-3 py-0.5 text-xs text-cream-200"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {anime.description && (
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-cream-200/85">
                {stripHtml(anime.description)}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={`/anime/${anime.id}`}
                className="group inline-flex items-center gap-2 rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-night-950 transition-colors hover:bg-accent-500"
              >
                Detayları gör
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>

              <button
                onClick={() => toggleFavorite(saved)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors",
                  fav
                    ? "border-accent-500 bg-accent-400/15 text-accent-700"
                    : "border-ink-600 text-cream-50 hover:border-cream-50",
                )}
                aria-pressed={fav}
              >
                <span aria-hidden>{fav ? "★" : "☆"}</span>
                {fav ? "Favoride" : "Favoriye ekle"}
              </button>

              <button
                onClick={onRoll}
                disabled={rolling}
                className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-5 py-3 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden>🎲</span>
                Başka dene
                <kbd className="ml-1 hidden rounded border border-ink-700 px-1.5 py-0.5 font-mono text-[10px] text-muted-400 sm:inline">
                  R
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    </AnimatePresence>
  );
}

function RandomSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[var(--radius-card)] border border-ink-800 bg-ink-900/40">
      <div className="h-[36vh] min-h-[260px] w-full bg-ink-800" />
      <div className="grid gap-8 px-6 pb-8 -mt-32 md:-mt-40 md:grid-cols-[200px_1fr] md:px-8">
        <div className="aspect-[2/3] w-32 rounded-[var(--radius-card)] bg-ink-800 md:w-full" />
        <div className="space-y-4 pt-4 md:pt-20">
          <div className="h-8 w-3/5 rounded bg-ink-800" />
          <div className="h-4 w-1/3 rounded bg-ink-800/70" />
          <div className="h-4 w-full rounded bg-ink-800/70" />
          <div className="h-4 w-5/6 rounded bg-ink-800/70" />
          <div className="flex gap-3 pt-4">
            <div className="h-11 w-32 rounded-full bg-ink-800" />
            <div className="h-11 w-36 rounded-full bg-ink-800/70" />
            <div className="h-11 w-32 rounded-full bg-ink-800/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "");
}