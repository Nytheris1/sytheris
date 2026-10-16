// SYTHERIS — Discord slash komutlarını kaydet
// Kullanım: node scripts/discord-register-commands.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local bulunamadi");
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

const env = loadEnv();
const APP_ID = env.DISCORD_APPLICATION_ID ?? process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = env.DISCORD_BOT_TOKEN ?? process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = env.DISCORD_GUILD_ID ?? process.env.DISCORD_GUILD_ID;

if (!APP_ID || !BOT_TOKEN) {
  console.error("DISCORD_APPLICATION_ID veya DISCORD_BOT_TOKEN .env.local'da yok");
  process.exit(1);
}

const COMMANDS = [
  {
    name: "anime",
    description: "Anime ara ve bilgi al",
    options: [
      {
        name: "isim",
        description: "Anime adi (orn: frieren)",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "random",
    description: "Rastgele bir anime oner",
  },
  {
    name: "calendar",
    description: "Bugun yayinlanacak bolumler",
  },
  {
    name: "yardim",
    description: "Bot komutlarini listeler",
  },
];

const url = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

console.log("\n=== Komutlar Discord'a kaydediliyor ===");
console.log("Endpoint:", url);
console.log("Komut sayisi:", COMMANDS.length);
console.log("");

const res = await fetch(url, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${BOT_TOKEN}`,
  },
  body: JSON.stringify(COMMANDS),
});

if (!res.ok) {
  const text = await res.text().catch(() => "");
  console.error(`Discord API hata: HTTP ${res.status}`);
  console.error(text.slice(0, 400));
  process.exit(1);
}

const data = await res.json();
console.log(`${data.length} komut kaydedildi`);
for (const c of data) {
  console.log(`  · /${c.name} — ${c.description}`);
}
console.log("\n Bitti! Discord'da bir kanalda /anime yazmayi dene.\n");