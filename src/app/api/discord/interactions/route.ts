import { NextRequest, NextResponse } from "next/server";
import { verifyDiscordSignature } from "@/lib/discord/verify";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import {
  SEARCH_ANIME,
  RANDOM_ANIME,
  AIRING_SCHEDULE,
} from "@/lib/anilist/queries";
import type {
  Anime,
  Page,
  AiringScheduleEntry,
  AiringSchedulePage,
} from "@/lib/anilist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

const ACCENT = 0x00e676;
const DISCORD_API = "https://discord.com/api/v10";
const VERIFY_ROLE_NAME = "ᴜʏᴇ";
const VERIFY_CUSTOM_ID = "verify_button";

interface DiscordOption {
  name: string;
  value: string | number | boolean;
}

interface DiscordInteraction {
  type: number;
  id?: string;
  guild_id?: string;
  member?: {
    user?: { id: string; username?: string };
    roles?: string[];
  };
  user?: { id: string; username?: string };
  data?: {
    name?: string;
    custom_id?: string;
    component_type?: number;
    options?: DiscordOption[];
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  const body = await req.text();

  console.log("[discord] incoming", {
    signature: signature.slice(0, 12),
    timestamp,
    len: body.length,
  });

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("[discord] DISCORD_PUBLIC_KEY missing");
    return NextResponse.json({ error: "PUBLIC_KEY yok" }, { status: 500 });
  }

  if (!verifyDiscordSignature(publicKey, signature, timestamp, body)) {
    console.error("[discord] signature verification failed");
    return new NextResponse("invalid request signature", { status: 401 });
  }

  let payload: DiscordInteraction;
  try {
    payload = JSON.parse(body) as DiscordInteraction;
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  console.log("[discord] type:", payload.type, "data:", JSON.stringify(payload.data ?? {}));

  // === PING ===
  if (payload.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // === SLASH COMMAND ===
  if (payload.type === 2) {
    const name = payload.data?.name ?? "";
    const options = payload.data?.options ?? [];

    if (name === "anime") {
      const query = String(
        options.find((o) => o.name === "isim")?.value ?? "",
      ).trim();
      return handleAnime(query);
    }
    if (name === "random") return handleRandom();
    if (name === "calendar") return handleCalendar();
    if (name === "yardim" || name === "yardım" || name === "help") {
      return handleHelp();
    }

    return NextResponse.json({
      type: 4,
      data: { content: `Bilinmeyen komut: /${name}`, flags: 64 },
    });
  }

  // === BUTTON / MESSAGE COMPONENT ===
  if (payload.type === 3) {
    const customId = payload.data?.custom_id ?? "";
    console.log("[discord] button click, custom_id =", customId);

    if (customId === VERIFY_CUSTOM_ID) {
      return handleVerifyButton(payload);
    }

    return NextResponse.json({
      type: 4,
      data: { content: "Bilinmeyen buton.", flags: 64 },
    });
  }

  // === MODAL SUBMIT (type 5) ===
  if (payload.type === 5) {
    return NextResponse.json({
      type: 4,
      data: { content: "Form alındı.", flags: 64 },
    });
  }

  return NextResponse.json({
    type: 4,
    data: { content: `Bilinmeyen etkileşim tipi: ${payload.type}`, flags: 64 },
  });
}

/* ================================================================
   DOĞRULAMA BUTONU
   ================================================================ */
async function handleVerifyButton(
  payload: DiscordInteraction,
): Promise<NextResponse> {
  const userId = payload.member?.user?.id ?? payload.user?.id;
  const guildId = payload.guild_id;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  console.log("[verify] start", { userId, guildId, hasToken: !!botToken });

  if (!userId || !guildId) {
    return NextResponse.json({
      type: 4,
      data: { content: "Kullanıcı/sunucu bilgisi yok.", flags: 64 },
    });
  }

  if (!botToken) {
    return NextResponse.json({
      type: 4,
      data: { content: "Bot token yok.", flags: 64 },
    });
  }

  try {
    // Rolleri al
    const rolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!rolesRes.ok) {
      const t = await rolesRes.text().catch(() => "");
      console.error("[verify] roles fetch failed", rolesRes.status, t.slice(0, 200));
      return NextResponse.json({
        type: 4,
        data: {
          content: "Roller alınamadı. Bot yetkilerini kontrol et.",
          flags: 64,
        },
      });
    }

    const roles = (await rolesRes.json()) as {
      id: string;
      name: string;
      managed: boolean;
    }[];
    const memberRole = roles.find((r) => r.name === VERIFY_ROLE_NAME);

    console.log("[verify] role found:", !!memberRole, memberRole?.id);

    if (!memberRole) {
      return NextResponse.json({
        type: 4,
        data: {
          content: `"${VERIFY_ROLE_NAME}" adında rol bulunamadı.`,
          flags: 64,
        },
      });
    }

    // Rolü ekle
    const addRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${memberRole.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      },
    );

    console.log("[verify] add role status:", addRes.status);

    if (!addRes.ok) {
      const t = await addRes.text().catch(() => "");
      console.error("[verify] add role failed", addRes.status, t.slice(0, 200));
      return NextResponse.json({
        type: 4,
        data: {
          content:
            "Rol verilemedi. Botun rolü `ᴜʏᴇ` rolünün üstünde olmalı.",
          flags: 64,
        },
      });
    }

    return NextResponse.json({
      type: 4,
      data: {
        content:
          "🌸 **Hoş geldin!** Doğrulandın ve artık tüm kanalları görebilirsin. İyi yolculuklar!",
        flags: 64,
      },
    });
  } catch (err) {
    console.error("[verify] error", err);
    return NextResponse.json({
      type: 4,
      data: { content: "Beklenmeyen hata oluştu.", flags: 64 },
    });
  }
}

/* ================================================================
   ANILIST KOMUTLARI
   ================================================================ */
async function handleAnime(query: string): Promise<NextResponse> {
  if (!query) {
    return NextResponse.json({
      type: 4,
      data: { content: "Bir anime adı yazmalısın. Örnek: `/anime frieren`" },
    });
  }

  try {
    const res = await anilistRequest<{ Page: Page<Anime> }>(SEARCH_ANIME, {
      page: 1,
      perPage: 1,
      search: query,
      sort: ["POPULARITY_DESC"],
    });

    const anime = res.Page.media[0];
    if (!anime) {
      return NextResponse.json({
        type: 4,
        data: { content: `\`${query}\` için sonuç bulunamadı.` },
      });
    }

    const title = pickTitle(anime.title);
    const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
    const link = `${SITE_URL}/anime/${anime.id}`;

    const embed: Record<string, unknown> = {
      title,
      url: link,
      color: ACCENT,
      footer: { text: "SYTHERIS · AniList" },
    };

    if (anime.description) {
      embed.description = stripHtml(anime.description).slice(0, 380) + "…";
    }
    if (cover) embed.thumbnail = { url: cover };

    const fields: { name: string; value: string; inline: boolean }[] = [];
    if (anime.averageScore != null) {
      fields.push({
        name: "Puan",
        value: `${anime.averageScore} / 100`,
        inline: true,
      });
    }
    if (anime.seasonYear) {
      fields.push({ name: "Yıl", value: String(anime.seasonYear), inline: true });
    }
    if (anime.format) {
      fields.push({ name: "Format", value: anime.format, inline: true });
    }
    if (anime.episodes) {
      fields.push({ name: "Bölüm", value: String(anime.episodes), inline: true });
    }
    if (fields.length > 0) embed.fields = fields;

    return NextResponse.json({ type: 4, data: { embeds: [embed] } });
  } catch {
    return NextResponse.json({
      type: 4,
      data: { content: "AniList'e ulaşılamadı, sonra tekrar dene." },
    });
  }
}

async function handleRandom(): Promise<NextResponse> {
  try {
    const res = await anilistRequest<{ Page: Page<Anime> }>(RANDOM_ANIME, {
      page: 1,
      perPage: 50,
      averageScore_greater: 65,
    });

    const items = res.Page.media ?? [];
    if (items.length === 0) {
      return NextResponse.json({
        type: 4,
        data: { content: "Şu an rastgele öneri bulunamadı." },
      });
    }

    const anime = items[Math.floor(Math.random() * items.length)];
    const title = pickTitle(anime.title);
    const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

    const embed: Record<string, unknown> = {
      title,
      url: `${SITE_URL}/anime/${anime.id}`,
      color: ACCENT,
      footer: { text: "SYTHERIS · Rastgele" },
    };
    if (anime.description) {
      embed.description = stripHtml(anime.description).slice(0, 380) + "…";
    }
    if (cover) embed.thumbnail = { url: cover };
    if (anime.averageScore != null) {
      embed.fields = [
        { name: "Puan", value: `${anime.averageScore} / 100`, inline: true },
        { name: "Yıl", value: String(anime.seasonYear ?? "—"), inline: true },
      ];
    }

    return NextResponse.json({ type: 4, data: { embeds: [embed] } });
  } catch {
    return NextResponse.json({
      type: 4,
      data: { content: "Rastgele öneri alınamadı." },
    });
  }
}

async function handleCalendar(): Promise<NextResponse> {
  try {
    const now = new Date();
    const from = Math.floor(now.getTime() / 1000);
    const to = from + 24 * 60 * 60;

    const res = await anilistRequest<{ Page: AiringSchedulePage }>(
      AIRING_SCHEDULE,
      { from, to, page: 1, perPage: 10 },
    );

    const entries = res.Page.airingSchedules ?? [];
    if (entries.length === 0) {
      return NextResponse.json({
        type: 4,
        data: { content: "Bugün yayınlanacak bölüm yok." },
      });
    }

    const lines = entries.map((e: AiringScheduleEntry) => {
      const t = pickTitle(e.media.title);
      const time = new Date(e.airingAt * 1000).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `\`${time}\` · **${t}** · ${e.episode}. bölüm`;
    });

    return NextResponse.json({
      type: 4,
      data: {
        embeds: [
          {
            title: "Bugün yayınlanacak bölümler",
            description: lines.join("\n"),
            color: ACCENT,
            footer: { text: "SYTHERIS · Takvim" },
          },
        ],
      },
    });
  } catch {
    return NextResponse.json({
      type: 4,
      data: { content: "Takvim alınamadı." },
    });
  }
}

function handleHelp(): NextResponse {
  return NextResponse.json({
    type: 4,
    data: {
      embeds: [
        {
          title: "SYTHERIS Komutları",
          color: ACCENT,
          description: [
            "`/anime <isim>` — Anime ara ve bilgi al",
            "`/random` — Rastgele bir anime öner",
            "`/calendar` — Bugün yayınlanacak bölümler",
            "`/yardim` — Bu listeyi göster",
          ].join("\n"),
          footer: { text: `Web: ${SITE_URL}` },
        },
      ],
    },
  });
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").trim();
}