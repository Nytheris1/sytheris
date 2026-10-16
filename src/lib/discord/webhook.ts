import type { AiringScheduleEntry } from "@/lib/anilist/types";
import { pickTitle } from "@/lib/anilist/client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

/**
 * Discord webhook URL tanımlı mı?
 */
export function isDiscordConfigured(): boolean {
  return Boolean(process.env.DISCORD_WEBHOOK_URL);
}

/**
 * Basit metin mesajı gönderir (test, duyuru vs.)
 */
export async function sendDiscordMessage(
  content: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "DISCORD_WEBHOOK_URL tanımlı değil" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "SYTHERIS",
        content,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Discord HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Yeni bölüm için zengin embed gönderir.
 */
export async function sendEpisodeEmbed(
  entry: AiringScheduleEntry,
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "DISCORD_WEBHOOK_URL tanımlı değil" };
  }

  const title = pickTitle(entry.media.title);
  const link = `${SITE_URL}/anime/${entry.media.id}`;
  const cover =
    entry.media.coverImage.extraLarge ?? entry.media.coverImage.large;

  const embed: Record<string, unknown> = {
    title: `${title} · ${entry.episode}. Bölüm`,
    url: link,
    description: `Yeni bölüm yayında!`,
    color: 0x00e676,
    timestamp: new Date(entry.airingAt * 1000).toISOString(),
    footer: {
      text: "SYTHERIS · Yeni Bölüm",
    },
  };

  if (cover) {
    embed.thumbnail = { url: cover };
  }

  if (entry.media.format || entry.media.seasonYear) {
    embed.fields = [
      {
        name: "Format",
        value: entry.media.format ?? "—",
        inline: true,
      },
      {
        name: "Yıl",
        value: entry.media.seasonYear ? String(entry.media.seasonYear) : "—",
        inline: true,
      },
      {
        name: "Puan",
        value:
          entry.media.averageScore != null
            ? `${entry.media.averageScore} / 100`
            : "—",
        inline: true,
      },
    ];
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "SYTHERIS",
        embeds: [embed],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Discord HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}