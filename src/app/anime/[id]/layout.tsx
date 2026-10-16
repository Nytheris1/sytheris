import type { Metadata } from "next";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { ANIME_DETAIL } from "@/lib/anilist/queries";
import type { AnimeDetail } from "@/lib/anilist/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return { title: "Bulunamadı — SYTHERIS" };
  }

  try {
    const data = await anilistRequest<{ Media: AnimeDetail | null }>(
      ANIME_DETAIL,
      { id: numericId },
    );
    const anime = data.Media;
    if (!anime) {
      return { title: "Bulunamadı — SYTHERIS" };
    }

    const title = pickTitle(anime.title);
    const cleanDesc = anime.description
      ? anime.description.replace(/<[^>]+>/g, "").trim().slice(0, 160)
      : `${title} hakkında özet, karakterler, bölümler ve puan.`;
    const description = cleanDesc
      ? cleanDesc.length === 160
        ? `${cleanDesc}…`
        : cleanDesc
      : "SYTHERIS — anime keşif ve araştırma";

    const ogImage = `${SITE_URL}/anime/${numericId}/opengraph-image`;

    return {
      title: `${title} — SYTHERIS`,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/anime/${numericId}`,
        siteName: "SYTHERIS",
        type: "video.tv_show",
        locale: "tr_TR",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: `${SITE_URL}/anime/${numericId}`,
      },
    };
  } catch {
    return { title: "SYTHERIS" };
  }
}

export default async function AnimeLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const numericId = Number(id);

  let jsonLd: Record<string, unknown> | null = null;

  if (Number.isFinite(numericId)) {
    try {
      const data = await anilistRequest<{ Media: AnimeDetail | null }>(
        ANIME_DETAIL,
        { id: numericId },
      );
      if (data.Media) {
        jsonLd = buildAnimeJsonLd(data.Media);
      }
    } catch {
      /* sessizce geç */
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {children}
    </>
  );
}

function buildAnimeJsonLd(anime: AnimeDetail): Record<string, unknown> {
  const title = pickTitle(anime.title);

  const cleanDescription = anime.description
    ? anime.description.replace(/<[^>]+>/g, "").trim().slice(0, 500)
    : undefined;

  const image =
    anime.coverImage.extraLarge ??
    anime.coverImage.large ??
    undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: title,
    url: `${SITE_URL}/anime/${anime.id}`,
    inLanguage: "ja",
  };

  if (anime.title.native && anime.title.native !== title) {
    jsonLd.alternateName = anime.title.native;
  }
  if (cleanDescription) {
    jsonLd.description = cleanDescription;
  }
  if (image) {
    jsonLd.image = image;
  }
  if (anime.episodes) {
    jsonLd.numberOfEpisodes = anime.episodes;
  }
  if (anime.seasonYear) {
    jsonLd.datePublished = String(anime.seasonYear);
  }
  if (anime.genres && anime.genres.length > 0) {
    jsonLd.genre = anime.genres;
  }
  if (anime.studios?.nodes?.[0]?.name) {
    jsonLd.productionCompany = {
      "@type": "Organization",
      name: anime.studios.nodes[0].name,
    };
  }
  if (anime.averageScore != null && anime.averageScore > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: anime.averageScore,
      bestRating: 100,
      worstRating: 0,
      ratingCount: Math.max(1, anime.popularity ?? 1),
    };
  }

  /* Karakterler — ilk 5 */
  if (anime.characters?.edges?.length) {
    jsonLd.actor = anime.characters.edges.slice(0, 5).map((edge) => ({
      "@type": "Person",
      name: edge.node.name.full,
    }));
  }

  return jsonLd;
}