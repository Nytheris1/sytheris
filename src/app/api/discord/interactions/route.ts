import { NextRequest, NextResponse } from "next/server";
import { verifyDiscordSignature } from "@/lib/discord/verify";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import {
  SEARCH_ANIME,
  SEARCH_CHARACTER,
  SEARCH_STUDIO,
  RANDOM_ANIME,
  AIRING_SCHEDULE,
  TOP_ANIME,
  CURRENT_SEASON,
} from "@/lib/anilist/queries";
import type { Anime, Page } from "@/lib/anilist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

const DISCORD_API = "https://discord.com/api/v10";
const VERIFY_CUSTOM_ID = "verify_button";

const C = {
  green: 0x00e676,
  amber: 0xf59e0b,
  red: 0xe02556,
  purple: 0x8b5cf6,
  blue: 0x00b4ff,
  teal: 0x14b8a6,
  dark: 0x1a1a1f,
};

function scoreColor(score: number | null): number {
  if (score == null) return C.dark;
  if (score >= 85) return C.green;
  if (score >= 70) return C.amber;
  if (score >= 50) return C.red;
  return C.dark;
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}

interface DiscordOption {
  name: string;
  value: string | number | boolean;
}

interface DiscordInteraction {
  type: number;
  id?: string;
  guild_id?: string;
  member?: { user?: { id: string; username?: string }; roles?: string[] };
  user?: { id: string; username?: string };
  data?: {
    name?: string;
    custom_id?: string;
    options?: DiscordOption[];
  };
}

function ephemeral(content: string, emoji = "⚠️") {
  return NextResponse.json({
    type: 4,
    data: { content: `${emoji} ${content}`, flags: 64 },
  });
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").trim();
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  const body = await req.text();

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "PUBLIC_KEY yok" }, { status: 500 });
  }

  if (!verifyDiscordSignature(publicKey, signature, timestamp, body)) {
    return new NextResponse("invalid request signature", { status: 401 });
  }

  let payload: DiscordInteraction;
  try {
    payload = JSON.parse(body) as DiscordInteraction;
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  // PING
  if (payload.type === 1) return NextResponse.json({ type: 1 });

  // SLASH COMMANDS
  if (payload.type === 2) {
    const name = payload.data?.name ?? "";
    const options = payload.data?.options ?? [];
    const get = (n: string) =>
      String(options.find((o) => o.name === n)?.value ?? "").trim();

    switch (name) {
      case "anime":
        return handleAnime(get("isim"));
      case "karakter":
        return handleCharacter(get("isim"));
      case "studyo":
        return handleStudio(get("isim"));
      case "random":
        return handleRandom();
      case "sezon":
        return handleSeason();
      case "top":
        return handleTop();
      case "takvim":
        return handleCalendar();
      case "yardim":
        return handleHelp();
      default:
        return ephemeral(`Bilinmeyen komut: /${name}`, "❓");
    }
  }

  // BUTONLAR
  if (payload.type === 3) {
    const customId = payload.data?.custom_id ?? "";

    if (customId === VERIFY_CUSTOM_ID) return handleVerifyButton(payload);
    if (customId.startsWith("hobby_")) return handleHobbyButton(payload, customId);

    return ephemeral("Bilinmeyen buton.", "❓");
  }

  return ephemeral(`Bilinmeyen etkileşim: ${payload.type}`, "❓");
}

/* ================================================================
   /anime
   ================================================================ */
async function handleAnime(query: string): Promise<NextResponse> {
  if (!query) return ephemeral("Bir anime adı yaz. Örnek: `/anime frieren`", "🔍");

  try {
    const res = await anilistRequest<{ Page: Page<Anime> }>(SEARCH_ANIME, {
      page: 1,
      perPage: 1,
      search: query,
      sort: ["POPULARITY_DESC"],
    });

    const anime = res.Page.media[0];
    if (!anime) return ephemeral(`\`${query}\` için sonuç bulunamadı.`, "🔍");

    const title = pickTitle(anime.title);
    const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

    const embed: Record<string, unknown> = {
      author: {
        name: "SYTHERIS · Anime",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title,
      url: `${SITE_URL}/anime/${anime.id}`,
      color: scoreColor(anime.averageScore),
      footer: {
        text: "AniList verisi · sytheris.vercel.app",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      timestamp: new Date().toISOString(),
    };

    if (anime.description) {
      embed.description = "> " + stripHtml(anime.description).slice(0, 350) + "…";
    }
    if (cover) embed.thumbnail = { url: cover };

    const fields: { name: string; value: string; inline: boolean }[] = [];

    if (anime.averageScore != null) {
      fields.push({
        name: "⭐ Puan",
        value: `\`${anime.averageScore}\` / 100\n${scoreBar(anime.averageScore)}`,
        inline: true,
      });
    }
    if (anime.seasonYear) {
      fields.push({ name: "📅 Yıl", value: `\`${anime.seasonYear}\``, inline: true });
    }
    if (anime.format) {
      fields.push({ name: "🎬 Format", value: `\`${anime.format}\``, inline: true });
    }
    if (anime.episodes) {
      fields.push({ name: "📺 Bölüm", value: `\`${anime.episodes}\``, inline: true });
    }
    if (anime.status) {
      const statusMap: Record<string, string> = {
        FINISHED: "✅ Tamamlandı",
        RELEASING: "▶️ Yayında",
        NOT_YET_RELEASED: "⏳ Yakında",
        CANCELLED: "❌ İptal",
        HIATUS: "⏸️ Arada",
      };
      fields.push({
        name: "📌 Durum",
        value: statusMap[anime.status] ?? anime.status,
        inline: true,
      });
    }
    if (anime.genres && anime.genres.length > 0) {
      fields.push({
        name: "🏷️ Türler",
        value: anime.genres.slice(0, 5).map((g) => `\`${g}\``).join(" "),
        inline: false,
      });
    }

    if (fields.length > 0) embed.fields = fields;

    return NextResponse.json({
      type: 4,
      data: {
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "Site'de Aç",
                url: `${SITE_URL}/anime/${anime.id}`,
                emoji: { name: "🔗" },
              },
            ],
          },
        ],
      },
    });
  } catch {
    return ephemeral("AniList'e ulaşılamadı.", "❌");
  }
}

/* ================================================================
   /karakter
   ================================================================ */
async function handleCharacter(query: string): Promise<NextResponse> {
  if (!query) return ephemeral("Bir karakter adı yaz.", "🔍");

  try {
    const res = await anilistRequest<{
      Page: {
        characters: {
          id: number;
          name: { full: string; native: string | null };
          image: { large: string | null };
          description: string | null;
          favourites: number | null;
          media: {
            nodes: {
              id: number;
              title: { romaji: string | null; english: string | null; native: string | null };
              coverImage: { large: string | null; extraLarge: string | null };
            }[];
          };
        }[];
      };
    }>(SEARCH_CHARACTER, { search: query });

    const char = res.Page.characters[0];
    if (!char) return ephemeral(`\`${query}\` adında karakter bulunamadı.`, "🔍");

    const embed: Record<string, unknown> = {
      author: {
        name: "SYTHERIS · Karakter",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title: char.name.full,
      url: `https://anilist.co/character/${char.id}`,
      color: C.purple,
      footer: { text: "AniList · sytheris.vercel.app" },
      timestamp: new Date().toISOString(),
    };

    if (char.name.native) {
      embed.description = `**${char.name.native}**\n\n`;
    }
    if (char.description) {
      const clean = stripHtml(char.description).slice(0, 300);
      embed.description = (embed.description ?? "") + `> ${clean}…`;
    }
    if (char.image.large) embed.thumbnail = { url: char.image.large };

    const fields: { name: string; value: string; inline: boolean }[] = [];

    if (char.favourites != null) {
      fields.push({
        name: "💜 Favori",
        value: `\`${char.favourites.toLocaleString("tr-TR")}\``,
        inline: true,
      });
    }

    if (char.media.nodes.length > 0) {
      const appears = char.media.nodes
        .slice(0, 3)
        .map((m) => `• **${pickTitle(m.title)}**`)
        .join("\n");
      fields.push({
        name: "🎬 Göründüğü Yapımlar",
        value: appears,
        inline: false,
      });
    }

    if (fields.length > 0) embed.fields = fields;

    return NextResponse.json({
      type: 4,
      data: {
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "AniList'te Aç",
                url: `https://anilist.co/character/${char.id}`,
                emoji: { name: "🔗" },
              },
            ],
          },
        ],
      },
    });
  } catch {
    return ephemeral("AniList'e ulaşılamadı.", "❌");
  }
}

/* ================================================================
   /studyo
   ================================================================ */
async function handleStudio(query: string): Promise<NextResponse> {
  if (!query) return ephemeral("Bir stüdyo adı yaz.", "🔍");

  try {
    const res = await anilistRequest<{
      Page: {
        studios: {
          id: number;
          name: string;
          isAnimationStudio: boolean;
          favourites: number | null;
          media: {
            nodes: {
              id: number;
              title: { romaji: string | null; english: string | null; native: string | null };
              coverImage: { large: string | null; extraLarge: string | null };
              averageScore: number | null;
              seasonYear: number | null;
              format: string | null;
            }[];
          };
        }[];
      };
    }>(SEARCH_STUDIO, { search: query });

    const studio = res.Page.studios[0];
    if (!studio) return ephemeral(`\`${query}\` adında stüdyo bulunamadı.`, "🔍");

    const embed: Record<string, unknown> = {
      author: {
        name: "SYTHERIS · Stüdyo",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title: studio.name,
      url: `https://anilist.co/studio/${studio.id}`,
      color: C.blue,
      footer: { text: "AniList · sytheris.vercel.app" },
      timestamp: new Date().toISOString(),
    };

    const fields: { name: string; value: string; inline: boolean }[] = [];

    if (studio.isAnimationStudio) {
      fields.push({ name: "🎨 Tip", value: "`Animasyon Stüdyosu`", inline: true });
    }
    if (studio.favourites != null) {
      fields.push({
        name: "💜 Favori",
        value: `\`${studio.favourites.toLocaleString("tr-TR")}\``,
        inline: true,
      });
    }

    if (studio.media.nodes.length > 0) {
      const works = studio.media.nodes
        .slice(0, 5)
        .map((m) => {
          const t = pickTitle(m.title);
          const score = m.averageScore ? ` · ⭐ ${m.averageScore}` : "";
          const year = m.seasonYear ? ` (${m.seasonYear})` : "";
          return `• **${t}**${year}${score}`;
        })
        .join("\n");
      fields.push({ name: "🏆 Popüler Yapımlar", value: works, inline: false });
    }

    if (fields.length > 0) embed.fields = fields;

    const firstCover =
      studio.media.nodes[0]?.coverImage.extraLarge ??
      studio.media.nodes[0]?.coverImage.large;
    if (firstCover) embed.thumbnail = { url: firstCover };

    return NextResponse.json({
      type: 4,
      data: {
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "AniList'te Aç",
                url: `https://anilist.co/studio/${studio.id}`,
                emoji: { name: "🔗" },
              },
            ],
          },
        ],
      },
    });
  } catch {
    return ephemeral("AniList'e ulaşılamadı.", "❌");
  }
}

/* ================================================================
   /random
   ================================================================ */
async function handleRandom(): Promise<NextResponse> {
  try {
    const res = await anilistRequest<{ Page: Page<Anime> }>(RANDOM_ANIME, {
      page: 1,
      perPage: 50,
      averageScore_greater: 65,
    });

    const items = res.Page.media ?? [];
    if (items.length === 0) return ephemeral("Rastgele öneri bulunamadı.", "🎲");

    const anime = items[Math.floor(Math.random() * items.length)];
    const title = pickTitle(anime.title);
    const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

    const embed: Record<string, unknown> = {
      author: {
        name: "SYTHERIS · Rastgele Keşif",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title,
      url: `${SITE_URL}/anime/${anime.id}`,
      color: scoreColor(anime.averageScore),
      footer: { text: "🎲 Kaderin seçimi · sytheris.vercel.app" },
      timestamp: new Date().toISOString(),
    };

    if (anime.description) {
      embed.description = "> " + stripHtml(anime.description).slice(0, 350) + "…";
    }
    if (cover) embed.thumbnail = { url: cover };

    const fields: { name: string; value: string; inline: boolean }[] = [];
    if (anime.averageScore != null) {
      fields.push({
        name: "⭐ Puan",
        value: `\`${anime.averageScore}\` / 100\n${scoreBar(anime.averageScore)}`,
        inline: true,
      });
    }
    if (anime.seasonYear) {
      fields.push({ name: "📅 Yıl", value: `\`${anime.seasonYear}\``, inline: true });
    }
    if (anime.format) {
      fields.push({ name: "🎬 Format", value: `\`${anime.format}\``, inline: true });
    }
    if (fields.length > 0) embed.fields = fields;

    return NextResponse.json({
      type: 4,
      data: {
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "Site'de Aç",
                url: `${SITE_URL}/anime/${anime.id}`,
                emoji: { name: "🔗" },
              },
              {
                type: 2,
                style: 1,
                label: "Tekrar Çevir",
                custom_id: "random_again",
                emoji: { name: "🎲" },
              },
            ],
          },
        ],
      },
    });
  } catch {
    return ephemeral("Rastgele öneri alınamadı.", "❌");
  }
}

/* ================================================================
   /sezon
   ================================================================ */
function getCurrentSeason(): { season: string; year: number; label: string } {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  const season = m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  const labels: Record<string, string> = {
    WINTER: "❄️ Kış",
    SPRING: "🌸 İlkbahar",
    SUMMER: "☀️ Yaz",
    FALL: "🍂 Sonbahar",
  };
  return { season, year: y, label: labels[season] };
}

async function handleSeason(): Promise<NextResponse> {
  try {
    const { season, year, label } = getCurrentSeason();
    const res = await anilistRequest<{ Page: Page<Anime> }>(CURRENT_SEASON, {
      season,
      seasonYear: year,
      perPage: 10,
    });

    const items = res.Page.media ?? [];
    if (items.length === 0) return ephemeral("Bu sezon için veri yok.", "📺");

    const description = items
      .slice(0, 10)
      .map((a, i) => {
        const t = pickTitle(a.title);
        const score = a.averageScore ? ` · ⭐ ${a.averageScore}` : "";
        const fmt = a.format ? ` · \`${a.format}\`` : "";
        return `**\`${String(i + 1).padStart(2, "0")}\`** · [${t}](${SITE_URL}/anime/${a.id})${score}${fmt}`;
      })
      .join("\n");

    const embed = {
      author: {
        name: `SYTHERIS · ${label} ${year}`,
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title: `${label} ${year} Sezonu · Popüler Animeler`,
      url: `${SITE_URL}/search`,
      description,
      color: C.green,
      footer: { text: "AniList · Popülerlik sıralaması" },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ type: 4, data: { embeds: [embed] } });
  } catch {
    return ephemeral("Sezon verisi alınamadı.", "❌");
  }
}

/* ================================================================
   /top
   ================================================================ */
async function handleTop(): Promise<NextResponse> {
  try {
    const res = await anilistRequest<{ Page: Page<Anime> }>(TOP_ANIME, {
      page: 1,
      perPage: 10,
    });

    const items = res.Page.media ?? [];
    if (items.length === 0) return ephemeral("Top liste alınamadı.", "🏆");

    const description = items
      .map((a, i) => {
        const t = pickTitle(a.title);
        const medal =
          i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `\`${String(i + 1).padStart(2, "0")}\``;
        return `${medal} · [${t}](${SITE_URL}/anime/${a.id}) · ⭐ **${a.averageScore}**`;
      })
      .join("\n");

    const embed = {
      author: {
        name: "SYTHERIS · Zirve",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title: "🏆 Tüm Zamanların En İyi 10 Animesi",
      url: `${SITE_URL}/search?sort=SCORE_DESC`,
      description,
      color: C.amber,
      footer: { text: "AniList · Puan sıralaması" },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ type: 4, data: { embeds: [embed] } });
  } catch {
    return ephemeral("Top liste alınamadı.", "❌");
  }
}

/* ================================================================
   /takvim
   ================================================================ */
async function handleCalendar(): Promise<NextResponse> {
  try {
    const now = new Date();
    const from = Math.floor(now.getTime() / 1000);
    const to = from + 24 * 60 * 60;

    const res = await anilistRequest<{
      Page: {
        airingSchedules: {
          id: number;
          episode: number;
          airingAt: number;
          media: {
            id: number;
            title: { romaji: string | null; english: string | null; native: string | null };
            coverImage: { large: string | null; extraLarge: string | null };
            format: string | null;
          };
        }[];
      };
    }>(AIRING_SCHEDULE, { from, to, page: 1, perPage: 10 });

    const entries = res.Page.airingSchedules ?? [];
    if (entries.length === 0) return ephemeral("Bugün yayınlanacak bölüm yok.", "📺");

    const description = entries
      .map((e) => {
        const t = pickTitle(e.media.title);
        const time = new Date(e.airingAt * 1000).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const fmt = e.media.format ? ` \`${e.media.format}\`` : "";
        return `\`${time}\` · [**${t}**](${SITE_URL}/anime/${e.media.id}) · Bölüm **${e.episode}**${fmt}`;
      })
      .join("\n");

    const embed = {
      author: {
        name: "SYTHERIS · Yayın Akışı",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title: "📺 Bugün Yayınlanacak Bölümler",
      description,
      color: C.teal,
      footer: { text: "Önümüzdeki 24 saat · sytheris.vercel.app" },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ type: 4, data: { embeds: [embed] } });
  } catch {
    return ephemeral("Takvim alınamadı.", "❌");
  }
}

/* ================================================================
   /yardim
   ================================================================ */
function handleHelp(): NextResponse {
  const embed = {
    author: {
      name: "SYTHERIS · Komut Rehberi",
      icon_url: `${SITE_URL}/icon-192.png`,
    },
    title: "📖 Komutlar",
    description: "Aşağıdaki komutları kullanarak alemi keşfedebilirsin.",
    color: C.green,
    fields: [
      {
        name: "🔍  Keşif",
        value: [
          "`/anime <isim>`  ·  Anime ara ve bilgi al",
          "`/karakter <isim>`  ·  Karakter ara",
          "`/studyo <isim>`  ·  Stüdyo ara",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🎲  Rastgele & Zirve",
        value: [
          "`/random`  ·  Kaderin seçimi",
          "`/top`  ·  En iyi 10 anime",
          "`/sezon`  ·  Bu sezon popüler",
        ].join("\n"),
        inline: false,
      },
      {
        name: "📅  Takvim",
        value: "`/takvim`  ·  Bugün yayında olan bölümler",
        inline: false,
      },
      {
        name: "ℹ️  Bilgi",
        value: "`/yardim`  ·  Bu rehberi göster",
        inline: false,
      },
    ],
    footer: {
      text: "SYTHERIS · sytheris.vercel.app",
      icon_url: `${SITE_URL}/icon-192.png`,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    type: 4,
    data: {
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "Web Sitesi",
              url: SITE_URL,
              emoji: { name: "🌐" },
            },
            {
              type: 2,
              style: 5,
              label: "Katalog",
              url: `${SITE_URL}/search`,
              emoji: { name: "📚" },
            },
          ],
        },
      ],
    },
  });
}

/* ================================================================
   VERIFY BUTONU
   ================================================================ */
async function handleVerifyButton(payload: DiscordInteraction): Promise<NextResponse> {
  const userId = payload.member?.user?.id ?? payload.user?.id;
  const guildId = payload.guild_id;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!userId || !guildId || !botToken) return ephemeral("Doğrulama başarısız.", "❌");

  try {
    const rolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!rolesRes.ok) return ephemeral("Roller alınamadı.", "❌");

    const roles = (await rolesRes.json()) as { id: string; name: string }[];
    const memberRole = roles.find((r) => r.name === "ᴜʏᴇ");
    if (!memberRole) return ephemeral("Doğrulama rolü bulunamadı.", "❌");

    const addRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${memberRole.id}`,
      { method: "PUT", headers: { Authorization: `Bot ${botToken}` } },
    );

    if (!addRes.ok) return ephemeral("Rol verilemedi. Yetkililere bildir.", "❌");

    return NextResponse.json({
      type: 4,
      data: {
        embeds: [
          {
            title: "🌸 Hoş Geldin!",
            description:
              "Doğrulandın ve tüm kanallara erişimin açıldı.\n\n" +
              "**İlk adımlar:**\n" +
              "`1` · 📜 `ᴋᴜʀᴀʟʟᴀʀ`\n" +
              "`2` · 🌸 `ᴛᴀɴɪsᴍᴀ`\n" +
              "`3` · 💬 `sᴏʜʙᴇᴛ`\n\n" +
              `🌐  ${SITE_URL}`,
            color: C.green,
            footer: { text: "SYTHERIS" },
          },
        ],
        flags: 64,
      },
    });
  } catch {
    return ephemeral("Beklenmeyen hata.", "❌");
  }
}

/* ================================================================
   HOBİ ROL BUTONU
   ================================================================ */
const HOBBY_MAP: Record<string, { role: string; emoji: string }> = {
  hobby_anime: { role: "🎴 Anime İzleyicisi", emoji: "🎴" },
  hobby_manga: { role: "📖 Manga Okuru", emoji: "📖" },
  hobby_game: { role: "🎮 Oyun Bağımlısı", emoji: "🎮" },
  hobby_movie: { role: "🎬 Sinema Sever", emoji: "🎬" },
  hobby_music: { role: "🎵 Müzik Kurdu", emoji: "🎵" },
  hobby_art: { role: "🎨 Sanatçı", emoji: "🎨" },
};

async function handleHobbyButton(
  payload: DiscordInteraction,
  customId: string,
): Promise<NextResponse> {
  const hobby = HOBBY_MAP[customId];
  if (!hobby) return ephemeral("Bilinmeyen hobi butonu.", "❓");

  const userId = payload.member?.user?.id ?? payload.user?.id;
  const guildId = payload.guild_id;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!userId || !guildId || !botToken) return ephemeral("Eksik bilgi.", "❌");

  try {
    const rolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!rolesRes.ok) return ephemeral("Roller alınamadı.", "❌");

    const roles = (await rolesRes.json()) as { id: string; name: string }[];
    const target = roles.find((r) => r.name === hobby.role);
    if (!target) return ephemeral(`"${hobby.role}" rolü bulunamadı.`, "❌");

    const memberRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!memberRes.ok) return ephemeral("Üye bilgisi alınamadı.", "❌");

    const member = (await memberRes.json()) as { roles: string[] };
    const hasRole = member.roles.includes(target.id);

    if (hasRole) {
      await fetch(
        `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${target.id}`,
        { method: "DELETE", headers: { Authorization: `Bot ${botToken}` } },
      );
      return NextResponse.json({
        type: 4,
        data: {
          content: `${hobby.emoji} **${hobby.role}** rolü kaldırıldı.`,
          flags: 64,
        },
      });
    } else {
      await fetch(
        `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${target.id}`,
        { method: "PUT", headers: { Authorization: `Bot ${botToken}` } },
      );
      return NextResponse.json({
        type: 4,
        data: {
          content: `${hobby.emoji} **${hobby.role}** rolü verildi.`,
          flags: 64,
        },
      });
    }
  } catch {
    return ephemeral("Beklenmeyen hata.", "❌");
  }
}