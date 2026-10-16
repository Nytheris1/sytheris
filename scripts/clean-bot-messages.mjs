// SYTHERIS — Botun son mesajlarını temizle (test mesajları)
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

const API = "https://discord.com/api/v10";
const H = { Authorization: `Bot ${TOKEN}` };

async function api(method, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method,
    headers: { ...H, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} :: ${t.slice(0, 120)}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Botun kendi user ID'si
const me = await api("GET", "/users/@me");
const BOT_ID = me.id;
console.log(`\nBot ID: ${BOT_ID}\n`);

// Hangi kanalları temizleyelim?
const TARGET_CHANNELS = [
  "🔒・ᴅᴏɢʀᴜʟᴀᴍᴀ",
  "🤖・ᴋᴏᴍᴜᴛʟᴀʀ",
  "📬・ʙɪʟᴅɪʀɪᴍʟᴇʀ",
];

console.log("Bot mesajları temizleniyor...\n");

const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);

for (const name of TARGET_CHANNELS) {
  const ch = channels.find((c) => c.name === name);
  if (!ch) {
    console.log(`  . ${name} (bulunamadı)`);
    continue;
  }

  // Son 100 mesajı çek
  const messages = await api("GET", `/channels/${ch.id}/messages?limit=100`);
  if (!Array.isArray(messages) || messages.length === 0) {
    console.log(`  . ${name} (boş)`);
    continue;
  }

  // Sadece botun mesajları
  const botMessages = messages.filter((m) => m.author.id === BOT_ID);

  if (botMessages.length === 0) {
    console.log(`  . ${name} (bot mesajı yok)`);
    continue;
  }

  let deleted = 0;
  for (const msg of botMessages) {
    try {
      await api("DELETE", `/channels/${ch.id}/messages/${msg.id}`);
      deleted++;
      await sleep(150); // rate limit
    } catch {
      /* yoksay */
    }
  }
  console.log(`  ✓ ${name}: ${deleted} mesaj silindi`);
}

console.log("\n===========================================");
console.log("  ✅ Temizlik tamam!");
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap → kanallar artık temiz.\n");