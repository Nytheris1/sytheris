// SYTHERIS — Hobi rolleri oluştur
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
const H = { "Content-Type": "application/json", Authorization: `Bot ${TOKEN}` };

async function api(method, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} :: ${t.slice(0, 150)}`);
  }
  return res.status === 204 ? null : res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Hobi rolleri
const HOBBIES = [
  { name: "🎴 Anime İzleyicisi", color: 0xff6b9d, emoji: "🎴" },
  { name: "📖 Manga Okuru", color: 0xffa94d, emoji: "📖" },
  { name: "🎮 Oyun Bağımlısı", color: 0x845ef7, emoji: "🎮" },
  { name: "🎬 Sinema Sever", color: 0x4dabf7, emoji: "🎬" },
  { name: "🎵 Müzik Kurdu", color: 0x20c997, emoji: "🎵" },
  { name: "🎨 Sanatçı", color: 0xf783ac, emoji: "🎨" },
];

console.log("\n=== Hobi Rolleri Oluşturuluyor ===\n");

const existing = await api("GET", `/guilds/${GUILD_ID}/roles`);
const existingNames = new Set(existing.map((r) => r.name));

for (const h of HOBBIES) {
  if (existingNames.has(h.name)) {
    console.log(`  . ${h.name} (zaten var)`);
    continue;
  }
  try {
    await api("POST", `/guilds/${GUILD_ID}/roles`, {
      name: h.name,
      color: h.color,
      hoist: false,
      mentionable: true,
      permissions: "0",
    });
    console.log(`  + ${h.name}`);
    await sleep(300);
  } catch (e) {
    console.log(`  ✗ ${h.name}: ${e.message.slice(0, 80)}`);
  }
}

console.log("\n===========================================");
console.log("  ✅ Hobi rolleri hazır!");
console.log("===========================================\n");