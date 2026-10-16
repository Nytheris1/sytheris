// SYTHERIS — Discord sunucu estetik dönüşümü
// İkon yükler + kategorileri ve kanalları yeniden adlandırır
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
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

// --- KATEGORİ YENİDEN ADLANDIRMA ---
const RENAME_CATEGORIES = {
  "📢 BİLGİ": "🌌 KADİM BİLGİ",
  "📢 BILGI": "🌌 KADİM BİLGİ",
  "BİLGİ": "🌌 KADİM BİLGİ",
  "BILGI": "🌌 KADİM BİLGİ",

  "💬 TOPLULUK": "✨ RUHLAR MECLİSİ",
  "TOPLULUK": "✨ RUHLAR MECLİSİ",

  "🎌 ANIME": "🎴 ANİME ALEMİ",
  "🎌 ANİME": "🎴 ANİME ALEMİ",
  "ANIME": "🎴 ANİME ALEMİ",
  "ANİME": "🎴 ANİME ALEMİ",

  "🤖 BOTLAR": "⚙️ YAPAY ZEKA KULESİ",
  "BOTLAR": "⚙️ YAPAY ZEKA KULESİ",

  "🔊 SESLİ": "🌊 YANKILAR ODASI",
  "🔊 SESLI": "🌊 YANKILAR ODASI",
  "SESLİ": "🌊 YANKILAR ODASI",
  "SESLI": "🌊 YANKILAR ODASI",
};

// --- KANAL YENİDEN ADLANDIRMA ---
const RENAME_CHANNELS = {
  "kurallar": "📜・yasalar",
  "duyurular": "📯・haberci",
  "hosgeldin": "🚪・kapi-araligi",
  "genel": "💬・meydan",
  "tanisma": "🌸・ruh-tanitimi",
  "off-topic": "🌌・bosluk",
  "meme": "😂・kahkaha-kristali",
  "anime-tartisma": "🎴・anlatilar",
  "oneriler": "🔮・kehanet",
  "sezonluk": "🌸・mevsim-gecisleri",
  "spoiler": "🤫・gizli-sayfalar",
  "bot-komutlari": "🤖・buyu-komutlari",
  "yeni-bolumler": "📬・haberci-kuslari",
  "Genel Ses": "🌌・kadim-ses",
  "Watch Party": "🎬・izleme-ayini",
  "Müzik": "🎵・melodi-kulesi",
  "Muzik": "🎵・melodi-kulesi",
};

console.log("\n=== SYTHERIS Estetik Dönüşümü ===\n");

// ---- 1) İKON YÜKLE ----
console.log("[1] Sunucu ikonu yükleniyor...");
const iconPath = path.join(ROOT, "public", "icon-512.png");
if (fs.existsSync(iconPath)) {
  try {
    const buf = fs.readFileSync(iconPath);
    const b64 = buf.toString("base64");
    await api("PATCH", `/guilds/${GUILD_ID}`, {
      icon: `data:image/png;base64,${b64}`,
    });
    console.log("  + İkon yüklendi");
  } catch (e) {
    console.log(`  X İkon yüklenemedi: ${e.message.slice(0, 100)}`);
  }
} else {
  console.log("  . public/icon-512.png bulunamadı, atlandı");
}

// ---- 2) KATEGORİLERİ YENİDEN ADLANDIR ----
console.log("\n[2] Kategoriler:");
const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);

for (const ch of channels) {
  if (ch.type !== 4) continue;
  const newName = RENAME_CATEGORIES[ch.name];
  if (!newName || newName === ch.name) {
    console.log(`  . ${ch.name} (atlandı)`);
    continue;
  }
  try {
    await api("PATCH", `/channels/${ch.id}`, { name: newName });
    console.log(`  + ${ch.name} → ${newName}`);
  } catch (e) {
    console.log(`  X ${ch.name}: ${e.message.slice(0, 80)}`);
  }
}

// ---- 3) KANALLARI YENİDEN ADLANDIR ----
console.log("\n[3] Kanallar:");
for (const ch of channels) {
  if (ch.type === 4) continue;
  const newName = RENAME_CHANNELS[ch.name];
  if (!newName || newName === ch.name) continue;
  try {
    await api("PATCH", `/channels/${ch.id}`, { name: newName });
    console.log(`  + ${ch.name} → ${newName}`);
  } catch (e) {
    console.log(`  X ${ch.name}: ${e.message.slice(0, 80)}`);
  }
}

// ---- 4) KONULARI GÜNCELLE (atmosferik) ----
console.log("\n[4] Kanal açıklamaları:");
const TOPICS = {
  "📜・yasalar": "Yasalar burada yazılıdır. Okumadan yazma, ruhun kaybolur.",
  "📯・haberci": "Krallıktan haberler, kadim duyurular, alemlerin fısıltıları.",
  "🚪・kapi-araligi": "Yeni ruhlar bu kapıdan girer. Karşıla, selamla.",
  "💬・meydan": "Ruhların buluştuğu meydan. Her konu serbest.",
  "🌸・ruh-tanitimi": "Kendini tanıt. Adın, zevkin, yolculuğun.",
  "🌌・bosluk": "Konu dışı sohbet. Boşlukta kaybol.",
  "😂・kahkaha-kristali": "Meme, mizah, kahkaha kristalleri.",
  "🎴・anlatilar": "Anime hikayeleri, karakter analizleri.",
  "🔮・kehanet": "Anime öneri iste veya kehanet paylaş.",
  "🌸・mevsim-gecisleri": "Bu sezon çıkan animeler. Mevsim geçişleri.",
  "🤫・gizli-sayfalar": "Spoiler içeren tartışmalar. Uyarıldın.",
  "🤖・buyu-komutlari": "/anime, /random, /calendar komutları burada hayat bulur.",
  "📬・haberci-kuslari": "SYTHERIS'ten otomatik yeni bölüm bildirimleri.",
};

const freshChannels = await api("GET", `/guilds/${GUILD_ID}/channels`);
for (const ch of freshChannels) {
  if (ch.type !== 0) continue;
  const topic = TOPICS[ch.name];
  if (!topic) continue;
  if (ch.topic === topic) continue;
  try {
    await api("PATCH", `/channels/${ch.id}`, { topic });
    console.log(`  + ${ch.name}: konu güncellendi`);
  } catch (e) {
    console.log(`  X ${ch.name}: ${e.message.slice(0, 80)}`);
  }
}

console.log("\n===========================================");
console.log("  ✅ Estetik dönüşüm tamam!");
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap ve sunucunu yenile.\n");