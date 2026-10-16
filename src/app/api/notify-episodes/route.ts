import { NextRequest, NextResponse } from "next/server";
import { sendEmail, buildEpisodeEmail } from "@/lib/email/send";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { RECENT_EPISODES } from "@/lib/anilist/queries";
import type {
  AiringScheduleEntry,
  AiringSchedulePage,
} from "@/lib/anilist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_HOURS = 24;

/* Cloud'da sakladığımız kitaplık öğesi (minimal) */
interface LibraryItem {
  id: number;
  title: string;
  status: string;
  cover: string | null;
  format: string | null;
  seasonYear: number | null;
}

interface CloudUserData {
  user_id: string;
  library: LibraryItem[];
  last_notified_episodes: Record<string, number>;
}

export async function GET(req: NextRequest) {
  const test = req.nextUrl.searchParams.get("test");
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const authOk = Boolean(cronSecret) && auth === `Bearer ${cronSecret}`;

  if (!authOk) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }

  /* Test modu */
  if (test === "1") {
    const email = buildEpisodeEmail({
      animeTitle: "Solo Leveling",
      episodeNumber: 12,
      animeId: 151807,
      coverUrl:
        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-ILSRWZYMxR0v.jpg",
      format: "TV",
      seasonYear: 2024,
    });
    const result = await sendEmail({
      subject: `[TEST] ${email.subject}`,
      html: email.html,
      text: email.text,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      id: result.id,
      message: "Test e-postası gönderildi.",
    });
  }

  /* Normal çalıştırma — cron secret varsa izin kontrolü */
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET tanımlı değil." },
      { status: 500 },
    );
  }
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Supabase panelinden service_role anahtarı alıp .env.local ve Vercel'e ekle.",
      },
      { status: 500 },
    );
  }

  /* Kullanıcı verilerini çek */
  const { data: rows, error: fetchErr } = await supabase
    .from("user_data")
    .select("user_id, library, last_notified_episodes");

  if (fetchErr) {
    return NextResponse.json(
      { ok: false, error: fetchErr.message },
      { status: 500 },
    );
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "Kullanıcı kaydı bulunamadı.",
      notified: 0,
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const from = Math.floor((Date.now() - WINDOW_HOURS * 60 * 60 * 1000) / 1000);

  let totalNotified = 0;
  const summary: { user: string; emails: number }[] = [];

  for (const row of rows as CloudUserData[]) {
    const watching = (row.library ?? []).filter((l) => l.status === "watching");
    if (watching.length === 0) continue;

    const ids = watching.map((l) => l.id);
    const notified = row.last_notified_episodes ?? {};

    let episodes: AiringScheduleEntry[] = [];
    try {
      const res = await anilistRequest<{ Page: AiringSchedulePage }>(
        RECENT_EPISODES,
        { from, to: now, mediaIds: ids, perPage: 100 },
      );
      episodes = res.Page.airingSchedules ?? [];
    } catch {
      continue;
    }

    /* Yeni bölümleri filtrele */
    const fresh: AiringScheduleEntry[] = [];
    for (const ep of episodes) {
      const key = String(ep.media.id);
      const lastEp = notified[key] ?? 0;
      if (ep.episode > lastEp) {
        fresh.push(ep);
      }
    }

    if (fresh.length === 0) continue;

    /* Aynı anime için tek bölüm (en yenisini) al */
    const perAnime = new Map<number, AiringScheduleEntry>();
    for (const ep of fresh) {
      const existing = perAnime.get(ep.media.id);
      if (!existing || ep.episode > existing.episode) {
        perAnime.set(ep.media.id, ep);
      }
    }

    const updatedNotified: Record<string, number> = { ...notified };
    let emailsSent = 0;

    for (const ep of perAnime.values()) {
      const title = pickTitle(ep.media.title);
      const email = buildEpisodeEmail({
        animeTitle: title,
        episodeNumber: ep.episode,
        animeId: ep.media.id,
        coverUrl: ep.media.coverImage.extraLarge ?? ep.media.coverImage.large,
        format: ep.media.format,
        seasonYear: ep.media.seasonYear,
      });

      const result = await sendEmail({
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      if (result.ok) {
        updatedNotified[String(ep.media.id)] = ep.episode;
        emailsSent++;
      }
    }

    if (emailsSent > 0) {
      await supabase
        .from("user_data")
        .update({ last_notified_episodes: updatedNotified })
        .eq("user_id", row.user_id);

      totalNotified += emailsSent;
      summary.push({ user: row.user_id.slice(0, 8), emails: emailsSent });
    }
  }

  return NextResponse.json({
    ok: true,
    totalNotified,
    summary,
    window: `${WINDOW_HOURS} saat`,
  });
}