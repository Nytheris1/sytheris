"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime-card";
import { Hero } from "@/components/hero";
import { Rail } from "@/components/rail";
import { Top10Rail } from "@/components/top10-rail";
import { GenreStrip } from "@/components/genre-strip";
import { EditorialSpotlight } from "@/components/editorial-spotlight";
import { HeroSkeleton } from "@/components/skeleton";
import { useFavorites, useLibrary } from "@/lib/user-data";
import { derivePreferences } from "@/lib/recommendations";
import {
  TRENDING_ANIME,
  POPULAR_THIS_SEASON,
  RANDOM_ANIME,
} from "@/lib/anilist/queries";
import { anilistRequest } from "@/lib/anilist/client";
import type { Anime, Page } from "@/lib/anilist/types";

const CARD_WIDTH =
  "w-[150px] shrink-0 sm:w-[170px] md:w-[190px] lg:w-[210px]";

function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const m = now.getMonth();
  const year = now.getFullYear();
  const season = m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  return { season, year };
}

export default function HomePage() {
  const library = useLibrary();
  const favorites = useFavorites();
  const { season, year } = getCurrentSeason();

  const prefs = useMemo(
    () => derivePreferences(favorites, library),
    [favorites, library],
  );

  const trending = useQuery({
    queryKey: ["trending-anime"],
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(
        TRENDING_ANIME,
        { page: 1, perPage: 20 },
        { signal },
      ),
  });

  const seasonal = useQuery({
    queryKey: ["popular-season", season, year],
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(
        POPULAR_THIS_SEASON,
        { page: 1, perPage: 20, season, seasonYear: year },
        { signal },
      ),
  });

  const personalized = useQuery({
    queryKey: [
      "personalized",
      prefs?.topGenres.join(",") ?? "",
      prefs?.minYear ?? null,
      prefs?.excludeIds.length ?? 0,
    ],
    enabled: prefs != null,
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(
        RANDOM_ANIME,
        {
          page: 1,
          perPage: 30,
          genre_in: prefs?.topGenres.length ? prefs.topGenres : undefined,
          startDate_greater:
            prefs?.minYear != null ? prefs.minYear * 10000 + 101 : undefined,
          averageScore_greater: 65,
        },
        { signal },
      ),
  });

  if (trending.isPending) {
    return (
      <main>
        <HeroSkeleton />
        <div className="mx-auto max-w-7xl space-y-16 px-6 py-16 md:py-20">
          <section>
            <div className="mb-5 animate-pulse">
              <div className="h-7 w-40 rounded bg-ink-800" />
              <div className="mt-2 h-4 w-56 rounded bg-ink-800/70" />
            </div>
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={CARD_WIDTH}>
                  <div className="aspect-[2/3] w-full animate-pulse rounded-[var(--radius-card)] bg-ink-800" />
                  <div className="mt-3 h-3.5 w-4/5 animate-pulse rounded bg-ink-800" />
                  <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-ink-800/70" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (trending.isError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-32">
        <h1 className="font-display text-3xl">Bir şeyler ters gitti</h1>
        <p className="mt-2 text-muted-400">{(trending.error as Error).message}</p>
        <button
          onClick={() => trending.refetch()}
          className="mt-6 rounded-full bg-accent-400 px-5 py-2 font-medium text-night-950 transition-colors hover:bg-accent-500"
        >
          Tekrar dene
        </button>
      </main>
    );
  }

  const trendingItems = trending.data?.Page.media ?? [];
  const seasonalItems = seasonal.data?.Page.media ?? [];
  const heroItems = trendingItems.slice(0, 5);
  /* Spotlight için sabit bir anime — hero'dan sonraki 3. sıra */
  const spotlightAnime = trendingItems[3] ?? trendingItems[0];

  const excludeSet = new Set(prefs?.excludeIds ?? []);
  const personalizedItems = (personalized.data?.Page.media ?? [])
    .filter((a) => !excludeSet.has(a.id))
    .slice(0, 12);

  const watching = library.filter((l) => l.status === "watching");
  const others = library.filter((l) => l.status !== "watching");
  const continueList = [...watching, ...others].slice(0, 12);

  const continueItems: Anime[] = continueList.map((h) => ({
    id: h.id,
    title: { romaji: h.title, english: null, native: null },
    coverImage: { extraLarge: h.cover, large: h.cover, color: null },
    bannerImage: null,
    description: null,
    averageScore: h.averageScore,
    episodes: null,
    status: null,
    seasonYear: h.seasonYear,
    genres: h.genres ?? [],
    format: h.format,
  }));

  const personalizedSubtitle = (() => {
    if (!prefs) return "Yüksek puanlı seçkiler";
    if (prefs.topGenres.length > 0) {
      return `${prefs.topGenres.slice(0, 2).join(", ")} türlerinde, yüksek puanlı seçkiler`;
    }
    if (prefs.minYear != null) {
      return `${prefs.minYear} sonrası, yüksek puanlı seçkiler`;
    }
    return "Yüksek puanlı seçkiler";
  })();

  return (
    <main>
      {heroItems.length > 0 && <Hero animeList={heroItems} />}

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 md:space-y-20 md:py-20">
        {/* Editoryal Spotlight */}
        {spotlightAnime && (
          <EditorialSpotlight anime={spotlightAnime} issueNumber="01" />
        )}

        {continueItems.length > 0 && (
          <Rail
            eyebrow="Kaldığın yer"
            title={
              watching.length > 0
                ? "İzlemeye <em>devam et</em>"
                : "Kitaplığından"
            }
            subtitle={
              watching.length > 0 ? "Şu an izlediklerin" : "Son işaretlediklerin"
            }
            moreHref="/settings"
            moreLabel="Kitaplığı gör"
          >
            {continueItems.map((anime, i) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                index={i}
                className={CARD_WIDTH}
              />
            ))}
          </Rail>
        )}

        {personalizedItems.length > 0 && (
          <Rail
            eyebrow="Sana özel"
            title="Beğenebileceğin <em>animeler</em>"
            subtitle={personalizedSubtitle}
            moreHref="/search"
          >
            {personalizedItems.map((anime, i) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                index={i}
                className={CARD_WIDTH}
              />
            ))}
          </Rail>
        )}

        <Top10Rail
          animeList={trendingItems}
          title="Bugün Türkiye'de <em>Top 10</em>"
          subtitle="AniList trendlerine göre"
          moreHref="/search"
        />

        <Rail
          eyebrow="Şu an"
          title="Herkesin konuştuğu <em>animeler</em>"
          subtitle="Trend listesinden daha fazlası"
          moreHref="/search"
        >
          {trendingItems.map((anime, i) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              index={i}
              className={CARD_WIDTH}
            />
          ))}
        </Rail>

        <GenreStrip />

        {seasonal.isPending ? (
          <section>
            <div className="mb-5 animate-pulse">
              <div className="h-7 w-56 rounded bg-ink-800" />
              <div className="mt-2 h-4 w-48 rounded bg-ink-800/70" />
            </div>
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={CARD_WIDTH}>
                  <div className="aspect-[2/3] w-full animate-pulse rounded-[var(--radius-card)] bg-ink-800" />
                  <div className="mt-3 h-3.5 w-4/5 animate-pulse rounded bg-ink-800" />
                  <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-ink-800/70" />
                </div>
              ))}
            </div>
          </section>
        ) : seasonalItems.length > 0 ? (
          <Rail
            eyebrow={seasonLabel(season)}
            title={`${year} sezonunun <em>en iyileri</em>`}
            subtitle="Bu sezon yayınlanan popüler animeler"
            moreHref="/search"
          >
            {seasonalItems.map((anime, i) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                index={i}
                className={CARD_WIDTH}
              />
            ))}
          </Rail>
        ) : null}
      </div>
    </main>
  );
}

function seasonLabel(s: string) {
  const map: Record<string, string> = {
    WINTER: "Kış sezonu",
    SPRING: "İlkbahar sezonu",
    SUMMER: "Yaz sezonu",
    FALL: "Sonbahar sezonu",
  };
  return map[s] ?? s;
}