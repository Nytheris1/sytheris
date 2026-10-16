// SYTHERIS — #ʀᴏʟʟᴀʀ kanalına buton panelini gönder
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const env = {};
{
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const TOKEN = env.DISCORD_BOT_TOKEN;
const GUILD_ID = env.DISCORD_GUILD_ID;
const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

const API = "https://discord.com/api/v10";
const H = { "Content-Type": "application/json", Authorization: `Bot ${TOKEN}` };

async function api(method, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} :: ${t.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

console.log("\n=== Rol Paneli Gönderiliyor ===\n");

const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
const ch = channels.find((c) => c.name === "🎯・ʀᴏʟʟᴀʀ");

if (!ch) {
  console.error("✗ #ʀᴏʟʟᴀʀ kanalı bulunamadı.");
  process.exit(1);
}

// Mevcut mesajları temizle (eski paneller)
const existing = await api("GET", `/channels/${ch.id}/messages?limit=20`);
for (const msg of existing) {
  if (msg.author.bot) {
    await api("DELETE", `/channels/${ch.id}/messages/${msg.id}`).catch(() => {});
  }
}

// Yeni panel
const msg = await api("POST", `/channels/${ch.id}/messages`, {
  embeds: [
    {
      author: {
        name: "SYTHERIS · Rol Merkezi",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      title: "🎯  İlgi Alanlarını Seç",
      description:
        "**Aşağıdaki butonlara tıklayarak ilgi alanlarını seç.**\n\n" +
        "Her butona tekrar tıklayarak rolünü kaldırabilirsin.\n" +
        "Bu roller sana bildirim ve etkinlik önerileri için kullanılır.\n\n" +
        "> İstediğin kadar rol seçebilirsin.",
      color: 0x00e676,
      fields: [
        {
          name: "🎴  Anime İzleyicisi",
          value: "Sezonluk animelerden haberdar ol",
          inline: true,
        },
        {
          name: "📖  Manga Okuru",
          value: "Manga tartışmalarına katıl",
          inline: true,
        },
        {
          name: "🎮  Oyun Bağımlısı",
          value: "Oyun odalarına erişim",
          inline: true,
        },
        {
          name: "🎬  Sinema Sever",
          value: "Film tartışmaları",
          inline: true,
        },
        {
          name: "🎵  Müzik Kurdu",
          value: "Müzik odası erişimi",
          inline: true,
        },
        {
          name: "🎨  Sanatçı",
          value: "Sanat kanalı erişimi",
          inline: true,
        },
      ],
      footer: {
        text: "SYTHERIS · Rolleri istediğin zaman değiştir",
        icon_url: `${SITE_URL}/icon-192.png`,
      },
      timestamp: new Date().toISOString(),
    },
  ],
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: "Anime İzleyicisi",
          emoji: { name: "🎴" },
          custom_id: "hobby_anime",
        },
        {
          type: 2,
          style: 2,
          label: "Manga Okuru",
          emoji: { name: "📖" },
          custom_id: "hobby_manga",
        },
        {
          type: 2,
          style: 2,
          label: "Oyun Bağımlısı",
          emoji: { name: "🎮" },
          custom_id: "hobby_game",
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: "Sinema Sever",
          emoji: { name: "🎬" },
          custom_id: "hobby_movie",
        },
        {
          type: 2,
          style: 2,
          label: "Müzik Kurdu",
          emoji: { name: "🎵" },
          custom_id: "hobby_music",
        },
        {
          type: 2,
          style: 2,
          label: "Sanatçı",
          emoji: { name: "🎨" },
          custom_id: "hobby_art",
        },
      ],
    },
  ],
});

await api("PUT", `/channels/${ch.id}/pins/${msg.id}`);

console.log("✓ Rol paneli gönderildi ve sabitlendi");
console.log("\nDiscord'da Ctrl+R yap → #ʀᴏʟʟᴀʀ kanalına git → butonlara tıkla.\n");