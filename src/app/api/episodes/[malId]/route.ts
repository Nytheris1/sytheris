import dns from "node:dns";
import { NextRequest, NextResponse } from "next/server";

/* Windows/Node IPv6 sorunlarına karşı IPv4'ü önceliklendir */
dns.setDefaultResultOrder("ipv4first");

const JIKAN_BASE = "https://api.jikan.moe/v4";

import { unstable_cache } from "next/cache";

const MIN_INTERVAL = 400;
// Not: Vercel serverless'ta instance-local throttle etkisizdir.
// Kalıcı cache için next/cache unstable_cache kullanılır (aşağıda).

interface JikanEpisode {
  mal_id: number;
  title: string;
  aired: string | null;
  score: number | null;
  filler: boolean;
  recap: boolean;
}

interface JikanResponse {
  data?: JikanEpisode[];
  pagination?: { has_next_page: boolean };
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause && typeof cause === "object") {
      const c = cause as { code?: string; message?: string };
      const parts = [err.message, c.code, c.message].filter(Boolean);
      return parts.join(" · ");
    }
    return err.message;
  }
  return String(err);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ malId: string }> },
) {
  const { malId } = await context.params;
  const id = Number(malId);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Geçersiz MAL ID" }, { status: 400 });
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const all: JikanEpisode[] = [];
  let page = 1;
  let hasNext = true;

  try {
    while (hasNext && page <= 5) {
      await throttle();

      let res: Response | null = null;
      let lastErr: unknown = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch(
            `${JIKAN_BASE}/anime/${id}/episodes?page=${page}`,
            {
              cache: "no-store",
              headers: {
                Accept: "application/json",
                "User-Agent": "Sytheris/0.1 (personal anime library)",
              },
            },
          );
          if (res.status !== 429) break;
        } catch (e) {
          lastErr = e;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (!res) {
        return NextResponse.json(
          { error: `Jikan'a bağlanılamadı: ${describeError(lastErr)}` },
          { status: 502 },
        );
      }

      if (res.status === 404) {
        return NextResponse.json({ episodes: [] });
      }

      if (!res.ok) {
        return NextResponse.json(
          { error: `Jikan yanıtı: HTTP ${res.status}` },
          { status: res.status },
        );
      }

      const json = (await res.json()) as JikanResponse;
      if (Array.isArray(json.data)) all.push(...json.data);
      hasNext = json.pagination?.has_next_page ?? false;
      page += 1;
    }

    const episodes = all.map((ep) => ({
      number: ep.mal_id,
      title: ep.title || `${ep.mal_id}. Bölüm`,
      aired: ep.aired ?? null,
      filler: ep.filler ?? false,
      recap: ep.recap ?? false,
      score: ep.score ?? null,
    }));

    const payload = { episodes };
    cache.set(id, { at: Date.now(), data: payload });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: describeError(err) },
      { status: 502 },
    );
  }
}