import { ImageResponse } from "next/og";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { ANIME_DETAIL } from "@/lib/anilist/queries";
import type { AnimeDetail } from "@/lib/anilist/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SYTHERIS anime kartı";

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "Kısa TV",
  MOVIE: "Film",
  SPECIAL: "Özel",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Müzik",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);

  let anime: AnimeDetail | null = null;
  try {
    const data = await anilistRequest<{ Media: AnimeDetail | null }>(
      ANIME_DETAIL,
      { id: numericId },
    );
    anime = data.Media;
  } catch {
    anime = null;
  }

  const title = anime ? pickTitle(anime.title) : "SYTHERIS";
  const cover = anime?.coverImage.extraLarge ?? anime?.coverImage.large ?? null;
  const banner = anime?.bannerImage ?? cover;
  const score = anime?.averageScore ?? null;
  const format = anime?.format
    ? (FORMAT_LABELS[anime.format] ?? anime.format)
    : null;
  const year = anime?.seasonYear;
  const episodes = anime?.episodes;
  const genres = anime?.genres.slice(0, 3) ?? [];

  const titleSize =
    title.length > 40 ? 44 : title.length > 28 ? 54 : title.length > 18 ? 64 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0B0B0F",
          color: "#F5F3EF",
          fontFamily: "sans-serif",
        }}
      >
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.32,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, #0B0B0F 0%, rgba(11,11,15,0.85) 45%, rgba(11,11,15,0.35) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(0deg, #0B0B0F 0%, rgba(11,11,15,0) 45%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#00E676",
          }}
        />

        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            style={{
              position: "absolute",
              left: 60,
              top: 120,
              width: 260,
              height: 390,
              objectFit: "cover",
              borderRadius: 16,
              boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
              border: "2px solid rgba(255,255,255,0.08)",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            left: 360,
            top: 120,
            right: 60,
            bottom: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: 4,
              color: "#00E676",
              textTransform: "uppercase",
              marginBottom: 18,
              fontFamily: "monospace",
            }}
          >
            SYTHERIS · ANIME
          </div>

          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              marginBottom: 22,
              color: "#F5F3EF",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: 22,
              color: "#D8D5CE",
              marginBottom: 22,
            }}
          >
            {year && <span>{year}</span>}
            {format && <span>· {format}</span>}
            {episodes && <span>· {episodes} bölüm</span>}
          </div>

          {score && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  fontSize: 68,
                  fontWeight: 700,
                  color: "#00E676",
                  lineHeight: 1,
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: 22, color: "#9A9AA5" }}>/ 100</span>
            </div>
          )}

          {genres.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 26 }}>
              {genres.map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: 16,
                    padding: "6px 14px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 999,
                    color: "#D8D5CE",
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 60,
            fontSize: 16,
            color: "#71717E",
            fontFamily: "monospace",
            letterSpacing: 2,
          }}
        >
          sytheris.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}