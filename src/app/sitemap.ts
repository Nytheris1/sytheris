import type { MetadataRoute } from "next";
import { anilistRequest } from "@/lib/anilist/client";
import { TRENDING_ANIME, POPULAR_THIS_SEASON } from "@/lib/anilist/queries";
import type { Anime, Page } from "@/lib/anilist/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

export const revalidate = 3600; // 1 saat önbellek

function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const m = now.getMonth();
  const year = now.getFullYear();
  const season = m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  return { season, year };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { season, year } = getCurrentSeason();

  /* Statik sayfalar */
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/calendar`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/random`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/settings`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  /* Dinamik anime sayfaları — trend + sezon */
  let trending: Anime[] = [];
  let seasonal: Anime[] = [];

  try {
    const [tRes, sRes] = await Promise.allSettled([
      anilistRequest<{ Page: Page<Anime> }>(TRENDING_ANIME, {
        page: 1,
        perPage: 50,
      }),
      anilistRequest<{ Page: Page<Anime> }>(POPULAR_THIS_SEASON, {
        page: 1,
        perPage: 50,
        season,
        seasonYear: year,
      }),
    ]);

    if (tRes.status === "fulfilled") {
      trending = tRes.value.Page.media ?? [];
    }
    if (sRes.status === "fulfilled") {
      seasonal = sRes.value.Page.media ?? [];
    }
  } catch {
    /* sessiz geç */
  }

  /* Birleştir + tekilleştir */
  const animeIds = new Set<number>();
  const animeRoutes: MetadataRoute.Sitemap = [];

  for (const anime of [...trending, ...seasonal]) {
    if (animeIds.has(anime.id)) continue;
    animeIds.add(anime.id);
    animeRoutes.push({
      url: `${SITE_URL}/anime/${anime.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return [...staticRoutes, ...animeRoutes];
}