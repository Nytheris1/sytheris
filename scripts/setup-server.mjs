// SYTHERIS — Discord sunucu otomatik kurulum
// Kullanım: node scripts/setup-server.mjs
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
const TOKEN = env.DISCORD_BOT_TOKEN;
const GUILD_ID = env.DISCORD_GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error("DISCORD_BOT_TOKEN veya DISCORD_GUILD_ID eksik");
  process.exit(1);
}

const API = "https://discord.com/api/v10";
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bot ${TOKEN}`,
};

async function api(method, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${method} ${endpoint}: ${text.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- RENKLER ---
const COLORS = {
  founder: 0xe02556,
  mod: 0xff9500,
  bot: 0x8f8f99,
  contrib: 0x00b4ff,
  member: 0x00e676,
  newbie: 0xa855f7,
};

// --- ROLLER ---
const ROLES = [
  { name: "Kurucu", color: COLORS.founder, hoist: true, mentionable: true },
  { name: "Moderatör", color: COLORS.mod, hoist: true, mentionable: true },
  { name: "Botlar", color: COLORS.bot, hoist: false, mentionable: false },
  { name: "Katkıcı", color: COLORS.contrib, hoist: true, mentionable: true },
  { name: "Üye", color: COLORS.member, hoist: false, mentionable: false },
  { name: "Yeni Üye", color: COLORS.newbie, hoist: false, mentionable: false },
];

// --- KATEGORİLER VE KANALLAR ---
const STRUCTURE = [
  {
    category: "📢 BİLGİ",
    channels: [
      { name: "kurallar", type: 0, topic: "Sunucu kuralları. Okumadan yazma." },
      { name: "duyurular", type: 0, topic: "Yeni bölümler, site güncellemeleri." },
      { name: "hosgeldin", type: 0, topic: "Yeni üyeler burada karşılanır." },
    ],
  },
  {
    category: "💬 TOPLULUK",
    channels: [
      { name: "genel", type: 0, topic: "Her şey hakkında sohbet." },
      { name: "tanisma", type: 0, topic: "Kendini tanıt." },
      { name: "off-topic", type: 0, topic: "Anime dışı sohbet." },
      { name: "meme", type: 0, topic: "Anime meme'leri." },
    ],
  },
  {
    category: "🎌 ANIME",
    channels: [
      { name: "anime-tartisma", type: 0, topic: "Genel anime sohbeti." },
      { name: "oneriler", type: 0, topic: "Anime önerisi iste veya ver." },
      { name: "sezonluk", type: 0, topic: "Bu sezon çıkan animeler." },
      { name: "spoiler", type: 0, topic: "Spoiler içeren tartışmalar." },
    ],
  },
  {
    category: "🤖 BOTLAR",
    channels: [
      { name: "bot-komutlari", type: 0, topic: "/anime, /random, /calendar komutlarını dene." },
      { name: "yeni-bolumler", type: 0, topic: "SYTHERIS'ten otomatik yeni bölüm bildirimleri." },
    ],
  },
  {
    category: "🔊 SESLİ",
    channels: [
      { name: "Genel Ses", type: 2 },
      { name: "Watch Party", type: 2 },
      { name: "Müzik", type: 2 },
    ],
  },
];

// --- MEVCUT DURUM ---
console.log("\n=== SYTHERIS Sunucu Kurulumu ===\n");

console.log("Mevcut roller ve kanallar alınıyor...");
const existingRoles = await api("GET", `/guilds/${GUILD_ID}/roles`);
const existingChannels = await api("GET", `/guilds/${GUILD_ID}/channels`);

const roleNames = new Set(existingRoles.map((r) => r.name));
const channelNames = new Set(existingChannels.map((c) => c.name));
const categoryMap = new Map();

for (const ch of existingChannels) {
  if (ch.type === 4) categoryMap.set(ch.name, ch.id);
}

// --- ROLLERİ OLUŞTUR ---
console.log("\n[1] Roller:");
for (const role of ROLES) {
  if (roleNames.has(role.name)) {
    console.log(`  . ${role.name} (zaten var)`);
    continue;
  }
  try {
    await api("POST", `/guilds/${GUILD_ID}/roles`, role);
    console.log(`  + ${role.name}`);
  } catch (e) {
    console.log(`  X ${role.name}: ${e.message}`);
  }
}

// --- KATEGORİLERİ VE KANALLARI OLUŞTUR ---
console.log("\n[2] Kategoriler ve kanallar:");

for (const block of STRUCTURE) {
  let catId = categoryMap.get(block.category);

  if (!catId) {
    try {
      const cat = await api("POST", `/guilds/${GUILD_ID}/channels`, {
        name: block.category,
        type: 4,
        position: STRUCTURE.indexOf(block),
      });
      catId = cat.id;
      console.log(`\n  + Kategori: ${block.category}`);
    } catch (e) {
      console.log(`\n  X Kategori ${block.category}: ${e.message}`);
      continue;
    }
  } else {
    console.log(`\n  . Kategori: ${block.category} (zaten var)`);
  }

  for (const ch of block.channels) {
    if (channelNames.has(ch.name)) {
      console.log(`    . #${ch.name} (zaten var)`);
      continue;
    }
    try {
      const body = {
        name: ch.name,
        type: ch.type,
        parent_id: catId,
      };
      if (ch.topic) body.topic = ch.topic;
      await api("POST", `/guilds/${GUILD_ID}/channels`, body);
      console.log(`    + ${ch.type === 2 ? "🔊" : "#"}${ch.name}`);
    } catch (e) {
      console.log(`    X ${ch.name}: ${e.message}`);
    }
  }
}

console.log("\n===========================================");
console.log("  Bitti!");
console.log("===========================================\n");
console.log("Discord'da sunucuyu yenile (Ctrl+R) ve kontrol et.\n");