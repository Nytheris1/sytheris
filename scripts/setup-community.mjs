// SYTHERIS — Community + Welcome Screen + AFK + Sistem mesajları
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnv() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
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
const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";

if (!TOKEN || !GUILD_ID) {
  console.error("DISCORD_BOT_TOKEN veya DISCORD_GUILD_ID eksik");
  process.exit(1);
}

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
    throw new Error(`HTTP ${res.status} ${method} ${endpoint} :: ${t.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("\n=== SYTHERIS Community Kurulumu ===\n");

// ---- 1) KANAL ID'LERİNİ BUL ----
const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
const find = (name) => channels.find((c) => c.name === name);

const welcomeCh = find("🎭・ᴋᴀʀsɪʟᴀᴍᴀ");
const generalCh = find("💬・sᴏʜʙᴇᴛ");
const rulesCh = find("📜・ᴋᴜʀᴀʟʟᴀʀ");
const vcGeneral = find("🔊 Genel Ses");

if (!welcomeCh || !generalCh) {
  console.error("Kanallar bulunamadı. Önce setup-server-full.mjs çalıştır.");
  process.exit(1);
}

// ---- 2) SİSTEM MESAJLARI + AFK ----
console.log("[1] Sistem mesajları ve AFK:");
try {
  await api("PATCH", `/guilds/${GUILD_ID}`, {
    system_channel_id: welcomeCh.id,
    system_channel_flags: 0, // tüm sistem mesajları açık (join boost vs)
    afk_channel_id: vcGeneral?.id ?? null,
    afk_timeout: 300, // 5 dakika
  });
  console.log("  ✓ Sistem mesaj kanalı → 🎭・ᴋᴀʀsɪʟᴀᴍᴀ");
  console.log("  ✓ AFK kanalı → 🔊 Genel Ses");
} catch (e) {
  console.log(`  ✗ ${e.message.slice(0, 100)}`);
}

// ---- 3) WELCOME SCREEN ----
console.log("\n[2] Welcome Screen:");
try {
  await api("PATCH", `/guilds/${GUILD_ID}/welcome-screen`, {
    enabled: true,
    description:
      "SYTHERIS — Anime keşif ve topluluk platformu. " +
      "Ruhlar burada buluşur, hikayeler paylaşılır, dostluklar doğar.",
    welcome_channels: [
      {
        channel_id: rulesCh?.id,
        description: "📜  Yasaları oku — bu diyarın düzeni burada yazılı.",
        emoji: { name: "📜" },
      },
      {
        channel_id: welcomeCh.id,
        description: "🎭  Kendini tanıt, ilk adımını at.",
        emoji: { name: "🎭" },
      },
      {
        channel_id: generalCh.id,
        description: "💬  Sohbete katıl, ruhlarla tanış.",
        emoji: { name: "💬" },
      },
    ].filter((c) => c.channel_id),
  });
  console.log("  ✓ Welcome Screen aktif");
} catch (e) {
  console.log(`  ✗ ${e.message.slice(0, 120)}`);
}

// ---- 4) COMMUNITY ÖZELLİKLERİ ----
console.log("\n[3] Community özellikleri:");
try {
  await api("PATCH", `/guilds/${GUILD_ID}`, {
    features: ["COMMUNITY", "NEWS", "WELCOME_SCREEN_ENABLED"],
  });
  console.log("  ✓ Community modu aktif");
} catch (e) {
  console.log(`  ! ${e.message.slice(0, 100)}`);
  console.log("    (Bu özellik manuel açılabilir: Sunucu Ayarları → Topluluk)");
}

// ---- 5) SUNUCU ETİKETLERİ ----
console.log("\n[4] Sunucu etiketleri (Discovery):");
try {
  await api("PATCH", `/guilds/${GUILD_ID}`, {
    preferred_locale: "tr",
  });
  console.log("  ✓ Dil: Türkçe");
} catch (e) {
  console.log(`  ✗ ${e.message.slice(0, 100)}`);
}

// ---- 6) KANAL KONULARINI ZENGİNLEŞTİR ----
console.log("\n[5] Kanal konuları zenginleştiriliyor:");
const TOPIC_UPGRADES = {
  "💬・sᴏʜʙᴇᴛ": "🌸 Ruhların buluştuğu meydan. Her konu serbest, saygı sonsuz. — sytheris.vercel.app",
  "🌸・ᴛᴀɴɪsᴍᴀ": "✨ Yeni ruhlar kendini tanıtır: ad, zevkler, yolculuk. İlk adım burada atılır.",
  "🎨・sᴀɴᴀᴛ": "🎨 Çizim, wallpaper, manga panel paylaşımları. Kaynak belirt.",
  "😂・ᴍᴇᴍᴇ": "😂 Kahkaha kristalleri. Anime meme, caps, montaj. NSFW değil.",
  "🎴・ᴛᴀʀᴛɪsᴍᴀ": "🎴 Anime hikayeleri, karakter analizleri, teoriler. Spoiler'a dikkat.",
  "🔮・ᴏɴᴇʀɪ": "🔮 Anime önerisi iste veya kehanet paylaş. İstek atarken tür belirt.",
  "🌊・sᴇᴢᴏɴ": "🌊 Bu sezon çıkan animelerin tartışması. Güncel bölüm spoiler'ı olabilir.",
  "⚔️・ᴋᴀʀsɪʟᴀsᴛɪʀᴍᴀ": "⚔️ İki animeyi kapıştır. Sebepli yaz, saygılı kal.",
  "🤫・sᴘᴏɪʟᴇʀ": "🤫 Spoiler içeren içerikler sadece burada. Uyarıldın.",
  "🤖・ᴋᴏᴍᴜᴛʟᴀʀ": "🤖 /anime, /random, /calendar — büyüler burada işler.",
  "📬・ʙɪʟᴅɪʀɪᴍʟᴇʀ": "📬 SYTHERIS'ten otomatik yeni bölüm bildirimleri.",
};

for (const [name, topic] of Object.entries(TOPIC_UPGRADES)) {
  const ch = find(name);
  if (!ch) continue;
  try {
    await api("PATCH", `/channels/${ch.id}`, { topic });
    await sleep(200);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message.slice(0, 60)}`);
  }
}

console.log("\n===========================================");
console.log("  ✅ Community kurulumu tamam!");
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap ve kontrol et:");
console.log("  · Sunucu adının altında Welcome Screen görünür mü?");
console.log("  · Yeni üye gelince #karşılama'ya sistem mesajı düşer mi?\n");