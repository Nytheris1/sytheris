// SYTHERIS — Premium Discord sunucu dönüşümü
// Kategorileri + kanalları yeniden adlandırır, rolleri mistik yapar
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

// ================================================================
// YENİ YAPI
// ================================================================
const CATEGORIES = [
  { key: "info", name: "『 ɪ · ʙɪʟɢɪ 』", position: 0 },
  { key: "community", name: "『 ɪɪ · ᴛᴏᴘʟᴜʟᴜᴋ 』", position: 1 },
  { key: "anime", name: "『 ɪɪɪ · ᴀɴɪᴍᴇ 』", position: 2 },
  { key: "voice", name: "『 ɪᴠ · sᴇsʟɪ 』", position: 3 },
  { key: "system", name: "『 ᴠ · sɪsᴛᴇᴍ 』", position: 4 },
];

const CHANNELS = [
  { key: "rules", parent: "info", name: "📜・ᴋᴜʀᴀʟʟᴀʀ", type: 0, topic: "Yasalar burada yazılıdır. Okumadan yazma, ruhun kaybolur." },
  { key: "announcements", parent: "info", name: "📢・ᴅᴜʏᴜʀᴜʟᴀʀ", type: 0, topic: "Krallıktan haberler, kadim duyurular." },
  { key: "welcome", parent: "info", name: "🎭・ᴋᴀʀsɪʟᴀᴍᴀ", type: 0, topic: "Yeni ruhlar bu kapıdan girer." },

  { key: "general", parent: "community", name: "💬・sᴏʜʙᴇᴛ", type: 0, topic: "Ruhların buluştuğu meydan." },
  { key: "intros", parent: "community", name: "🌸・ᴛᴀɴɪsᴍᴀ", type: 0, topic: "Kendini tanıt. Adın, zevkin, yolculuğun." },
  { key: "art", parent: "community", name: "🎨・sᴀɴᴀᴛ", type: 0, topic: "Sanat paylaşımları." },
  { key: "memes", parent: "community", name: "😂・ᴍᴇᴍᴇ", type: 0, topic: "Meme, mizah, kahkaha kristalleri." },

  { key: "discussion", parent: "anime", name: "🎴・ᴛᴀʀᴛɪsᴍᴀ", type: 0, topic: "Anime hikayeleri, karakter analizleri." },
  { key: "recommend", parent: "anime", name: "🔮・ᴏɴᴇʀɪ", type: 0, topic: "Anime öneri iste veya kehanet paylaş." },
  { key: "seasonal", parent: "anime", name: "🌊・sᴇᴢᴏɴ", type: 0, topic: "Bu sezon çıkan animeler." },
  { key: "compare", parent: "anime", name: "⚔️・ᴋᴀʀsɪʟᴀsᴛɪʀᴍᴀ", type: 0, topic: "Anime karşılaştırmaları." },

  { key: "vc-general", parent: "voice", name: "🔊 Genel Ses", type: 2 },
  { key: "vc-watch", parent: "voice", name: "🎬 Watch Party", type: 2 },
  { key: "vc-music", parent: "voice", name: "🎵 Müzik Odası", type: 2 },

  { key: "commands", parent: "system", name: "🤖・ᴋᴏᴍᴜᴛʟᴀʀ", type: 0, topic: "/anime, /random, /calendar komutları." },
  { key: "notifications", parent: "system", name: "📬・ʙɪʟᴅɪʀɪᴍʟᴇʀ", type: 0, topic: "SYTHERIS'ten otomatik bildirimler." },
];

// Eski isimden yeni isme eşleme (varsa yeniden adlandır, yoksa oluştur)
const RENAME_MAP = {
  // kategoriler
  "Sunucu": "info",
  "BİLGİ": "info",
  "BILGI": "info",
  "Doğrulama": "info",
  "Topluluk": "community",
  "TOPLULUK": "community",
  "Anime": "anime",
  "ANIME": "anime",
  "Sesli": "voice",
  "SESLİ": "voice",
  "Botlar": "system",
  "BOTLAR": "system",
  // kanallar
  "kurallar": "rules",
  "duyurular": "announcements",
  "hosgeldin": "welcome",
  "hoşgeldin": "welcome",
  "genel": "general",
  "genel-sohbet": "general",
  "tanisma": "intros",
  "tanışma": "intros",
  "sanat": "art",
  "art": "art",
  "meme": "memes",
  "memes": "memes",
  "anime-tartisma": "discussion",
  "anime-tartışma": "discussion",
  "discussion": "discussion",
  "oneriler": "recommend",
  "öneriler": "recommend",
  "recommendations": "recommend",
  "sezonluk": "seasonal",
  "seasonal": "seasonal",
  "karsilastirma": "compare",
  "karşılaştırma": "compare",
  "compare": "compare",
  "bot-komutlari": "commands",
  "bot-komutları": "commands",
  "commands": "commands",
  "yeni-bolumler": "notifications",
  "yeni-bölümler": "notifications",
  "notifications": "notifications",
  "Genel Ses": "vc-general",
  "Watch Party": "vc-watch",
  "Müzik": "vc-music",
  "Muzik": "vc-music",
};

// ================================================================
console.log("\n=== SYTHERIS Premium Dönüşüm ===\n");

// ---- 0) İKON ----
console.log("[0] Sunucu ikonu:");
const iconPath = path.join(ROOT, "public", "icon-512.png");
if (fs.existsSync(iconPath)) {
  try {
    const b64 = fs.readFileSync(iconPath).toString("base64");
    await api("PATCH", `/guilds/${GUILD_ID}`, {
      icon: `data:image/png;base64,${b64}`,
    });
    console.log("  ✓ İkon yüklendi");
  } catch (e) {
    console.log(`  ✗ ${e.message.slice(0, 100)}`);
  }
} else {
  console.log("  . public/icon-512.png yok");
}

// ---- 1) MEVCUT DURUM ----
let channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
const categories = channels.filter((c) => c.type === 4);
const textAndVoice = channels.filter((c) => c.type !== 4);

console.log(`\nMevcut: ${categories.length} kategori, ${textAndVoice.length} kanal\n`);

// ---- 2) KATEGORİLERİ HAZIRLA ----
console.log("[1] Kategoriler:");
const catIdByKey = {};

for (const cat of CATEGORIES) {
  // Zaten bu isimde var mı?
  const existing = categories.find((c) => c.name === cat.name);
  if (existing) {
    catIdByKey[cat.key] = existing.id;
    console.log(`  . ${cat.name} (zaten var)`);
    continue;
  }

  // Eski isimle eşleşen var mı? (yeniden adlandır)
  const oldName = Object.entries(RENAME_MAP).find(
    ([, key]) => key === cat.key,
  )?.[0];
  const oldCat = oldName
    ? categories.find((c) => c.name === oldName && !catIdByKey[cat.key])
    : null;

  if (oldCat) {
    try {
      await api("PATCH", `/channels/${oldCat.id}`, {
        name: cat.name,
        position: cat.position,
      });
      catIdByKey[cat.key] = oldCat.id;
      console.log(`  ⟳ ${oldCat.name} → ${cat.name}`);
      continue;
    } catch (e) {
      console.log(`  ✗ ${oldCat.name}: ${e.message.slice(0, 80)}`);
    }
  }

  // Yeni oluştur
  try {
    const created = await api("POST", `/guilds/${GUILD_ID}/channels`, {
      name: cat.name,
      type: 4,
      position: cat.position,
    });
    catIdByKey[cat.key] = created.id;
    console.log(`  + ${cat.name}`);
  } catch (e) {
    console.log(`  ✗ ${cat.name}: ${e.message.slice(0, 80)}`);
  }
}

// ---- 3) KANALLARI HAZIRLA ----
console.log("\n[2] Kanallar:");
channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
const allNonCats = channels.filter((c) => c.type !== 4);

for (const ch of CHANNELS) {
  const parentId = catIdByKey[ch.parent];
  if (!parentId) {
    console.log(`  ✗ ${ch.name}: kategori yok`);
    continue;
  }

  // Zaten bu isimde var mı?
  const already = allNonCats.find((c) => c.name === ch.name);
  if (already) {
    console.log(`  . ${ch.name}`);
    continue;
  }

  // Eski isimle eşleşiyor mu?
  const oldNames = Object.entries(RENAME_MAP)
    .filter(([, key]) => key === ch.key)
    .map(([old]) => old);
  const oldCh = allNonCats.find((c) => oldNames.includes(c.name));

  if (oldCh && oldCh.type === ch.type) {
    try {
      const body = { name: ch.name, parent_id: parentId };
      if (ch.topic) body.topic = ch.topic;
      await api("PATCH", `/channels/${oldCh.id}`, body);
      console.log(`  ⟳ ${oldCh.name} → ${ch.name}`);
      continue;
    } catch (e) {
      console.log(`  ✗ ${oldCh.name}: ${e.message.slice(0, 80)}`);
    }
  }

  // Yeni oluştur
  try {
    const body = {
      name: ch.name,
      type: ch.type,
      parent_id: parentId,
    };
    if (ch.topic) body.topic = ch.topic;
    await api("POST", `/guilds/${GUILD_ID}/channels`, body);
    console.log(`  + ${ch.name}`);
  } catch (e) {
    console.log(`  ✗ ${ch.name}: ${e.message.slice(0, 80)}`);
  }
}

// ---- 4) ROLLER ----
console.log("\n[3] Roller:");
const roles = await api("GET", `/guilds/${GUILD_ID}/roles`);
const roleByName = new Map(roles.map((r) => [r.name, r]));

const NEW_ROLES = [
  { name: "ᴋᴜʀᴜᴄᴜ", color: 0x8b5cf6, hoist: true, mentionable: true, permissions: "8" },
  { name: "ʏᴏɴᴇᴛɪᴄɪ", color: 0xe02556, hoist: true, mentionable: true, permissions: "1099511627782" },
  { name: "ᴍᴏᴅᴇʀᴀᴛᴏʀ", color: 0xf59e0b, hoist: true, mentionable: true, permissions: "1099511627776" },
  { name: "ᴋᴀᴛᴋɪᴄɪ", color: 0x14b8a6, hoist: true, mentionable: true, permissions: "0" },
  { name: "ᴜʏᴇ", color: 0x00e676, hoist: false, mentionable: false, permissions: "0" },
  { name: "ᴢɪʏᴀʀᴇᴛᴄɪ", color: 0x64748b, hoist: false, mentionable: false, permissions: "0" },
];

for (let i = 0; i < NEW_ROLES.length; i++) {
  const role = NEW_ROLES[i];
  if (roleByName.has(role.name)) {
    console.log(`  . ${role.name}`);
    continue;
  }
  try {
    await api("POST", `/guilds/${GUILD_ID}/roles`, {
      ...role,
      position: NEW_ROLES.length - i,
    });
    console.log(`  + ${role.name}`);
  } catch (e) {
    console.log(`  ✗ ${role.name}: ${e.message.slice(0, 80)}`);
  }
}

console.log("\n===========================================");
console.log("  ✅ Premium dönüşüm tamam!");
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap ve sunucunu kontrol et.\n");