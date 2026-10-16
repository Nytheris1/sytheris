import { NextRequest } from "next/server";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { RECENT_EPISODES } from "@/lib/anilist/queries";
import type {
  AiringScheduleEntry,
  AiringSchedulePage,
} from "@/lib/anilist/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";
const FEED_TITLE = "SYTHERIS — Yeni Bölümler";
const FEED_DESC = "Takip ettiğin animelerde son bölümler";
const WINDOW_DAYS = 30;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const idsParam = params.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 100);

  if (ids.length === 0) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>En az bir anime id gerekli: ?ids=21,16498</error>`,
      {
        status: 400,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      },
    );
  }

  const now = Date.now();
  const from = Math.floor((now - WINDOW_DAYS * 24 * 60 * 60 * 1000) / 1000);
  const to = Math.floor(now / 1000);

  let episodes: AiringScheduleEntry[] = [];
  try {
    const data = await anilistRequest<{ Page: AiringSchedulePage }>(
      RECENT_EPISODES,
      { from, to, mediaIds: ids, perPage: 100 },
    );
    episodes = data.Page.airingSchedules ?? [];
  } catch {
    episodes = [];
  }

  const items = episodes
    .map((ep) => {
      const title = pickTitle(ep.media.title);
      const epTitle = `${title} · ${ep.episode}. Bölüm`;
      const link = `${SITE_URL}/anime/${ep.media.id}`;
      const pubDate = new Date(ep.airingAt * 1000).toUTCString();
      const desc = `${ep.media.format ?? "?"} · ${
        ep.media.seasonYear ?? "—"
      } · ${ep.episode}. bölüm yayınlandı`;
      return `    <item>
      <title>${escapeXml(epTitle)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${ep.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuild = new Date().toUTCString();
  const selfUrl = `${SITE_URL}/feed.xml?ids=${ids.join(",")}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESC)}</description>
    <language>tr-TR</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <ttl>30</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}