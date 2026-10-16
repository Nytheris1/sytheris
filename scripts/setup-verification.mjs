// SYTHERIS — Doğrulama sistemi kurulumu
// Kanalları kilitler + #ᴅᴏɢʀᴜʟᴀᴍᴀ kanalı + buton mesajı
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
  console.error("Token veya Guild ID eksik");
  process.exit(1);
}

const API = "https://discord.com/api/v10";
const H = { "Content-Type": "application/json", Authorization: `Bot ${TOKEN}` };

async function api(method, endpoint, body, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(API + endpoint, {
      method,
      headers: H,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      const wait = (parseFloat(res.headers.get("retry-after") || "1") + 0.5) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${method} ${endpoint} :: ${t.slice(0, 200)}`);
    }
    return res.status === 204 ? null : res.json();
  }
  throw new Error("rate limit");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Permission bits
const P = {
  VIEW_CHANNEL: 1024n,
  SEND_MESSAGES: 2048n,
  READ_HISTORY: 65536n,
  ADD_REACTIONS: 64n,
  CONNECT: 1048576n,
  SPEAK: 2097152n,
  USE_APPLICATION_COMMANDS: 2147483648n,
};
const bits = (...f) => f.reduce((a, b) => a | b, 0n).toString();

// Public kanallar (yeni üyeler görebilecek)
const PUBLIC_CHANNELS = [
  "🎭・ᴋᴀʀsɪʟᴀᴍᴀ",
  "📜・ᴋᴜʀᴀʟʟᴀʀ",
  "📢・ᴅᴜʏᴜʀᴜʟᴀʀ",
  "🔒・ᴅᴏɢʀᴜʟᴀᴍᴀ",
];

console.log("\n=== SYTHERIS Doğrulama Kurulumu ===\n");

// ---- 1) Rolleri al ----
const roles = await api("GET", `/guilds/${GUILD_ID}/roles`);
const everyoneRole = roles.find((r) => r.name === "@everyone");
const memberRole = roles.find((r) => r.name === "ᴜʏᴇ");
const staffRoles = roles.filter((r) =>
  ["ᴋᴜʀᴜᴄᴜ", "ʙᴀs ᴍᴏᴅᴇʀᴀᴛᴏʀ", "ᴍᴏᴅᴇʀᴀᴛᴏʀ", "ʀᴇʜʙᴇʀ"].includes(r.name),
);

if (!everyoneRole || !memberRole) {
  console.error("@everyone veya ᴜʏᴇ rolü bulunamadı. Önce setup-server-full.mjs çalıştır.");
  process.exit(1);
}

console.log(`Roller:`);
console.log(`  @everyone : ${everyoneRole.id}`);
console.log(`  ᴜʏᴇ       : ${memberRole.id}`);
console.log(`  Staff     : ${staffRoles.length} rol`);
console.log("");

// ---- 2) Önce doğrulama kanalını oluştur ----
console.log("[1] Doğrulama kanalı:");
let channels = await api("GET", `/guilds/${GUILD_ID}/channels`);

// Kategori bul (varsa)
const infoCat = channels.find((c) => c.name === "『 ɪ · ʙᴀsʟᴀɴɢɪᴄ 』");

let verifyCh = channels.find((c) => c.name === "🔒・ᴅᴏɢʀᴜʟᴀᴍᴀ");
if (!verifyCh) {
  verifyCh = await api("POST", `/guilds/${GUILD_ID}/channels`, {
    name: "🔒・ᴅᴏɢʀᴜʟᴀᴍᴀ",
    type: 0,
    topic: "Doğrulan ve topluluğa katıl. Aşağıdaki butona bas.",
    parent_id: infoCat?.id ?? undefined,
    permission_overwrites: [
      {
        id: everyoneRole.id,
        type: 0,
        allow: bits(P.VIEW_CHANNEL, P.READ_HISTORY, P.SEND_MESSAGES),
        deny: "0",
      },
      {
        id: memberRole.id,
        type: 0,
        allow: "0",
        deny: bits(P.VIEW_CHANNEL),
      },
    ],
  });
  console.log("  + 🔒・ᴅᴏɢʀᴜʟᴀᴍᴀ");
} else {
  console.log("  . 🔒・ᴅᴏɢʀᴜʟᴀᴍᴀ (zaten var)");
}

// ---- 3) Tüm diğer kanalları kilitle ----
console.log("\n[2] Kanallar kilitleniyor:");
channels = await api("GET", `/guilds/${GUILD_ID}/channels`);

for (const ch of channels) {
  if (ch.type === 4) continue; // kategori atla
  if (PUBLIC_CHANNELS.includes(ch.name)) continue; // public kanallar atla
  if (ch.name.startsWith("『 ᴠɪ · ʏᴏɴᴇᴛɪᴍ")) continue;

  // Mevcut overwrite'ları koru, üstüne @everyone DENY ve ᴜʏᴇ ALLOW ekle
  const current = (ch.permission_overwrites ?? []).filter(
    (o) => o.id !== everyoneRole.id && o.id !== memberRole.id,
  );

  const newOverwrites = [
    ...current,
    {
      id: everyoneRole.id,
      type: 0,
      allow: "0",
      deny: bits(P.VIEW_CHANNEL),
    },
    {
      id: memberRole.id,
      type: 0,
      allow: bits(
        P.VIEW_CHANNEL,
        P.READ_HISTORY,
        P.SEND_MESSAGES,
        P.CONNECT,
        P.SPEAK,
        P.USE_APPLICATION_COMMANDS,
      ),
      deny: "0",
    },
  ];

  try {
    await api("PATCH", `/channels/${ch.id}`, {
      permission_overwrites: newOverwrites,
    });
    console.log(`  🔒 ${ch.name}`);
    await sleep(250);
  } catch (e) {
    console.log(`  ✗ ${ch.name}: ${e.message.slice(0, 60)}`);
  }
}

// ---- 4) Buton mesajı gönder ----
console.log("\n[3] Doğrulama butonu:");

// Mevcut mesajları kontrol et
const existing = await fetch(
  `${API}/channels/${verifyCh.id}/messages?limit=20`,
  { headers: H },
).then((r) => r.json());

const hasButton = existing.some((m) =>
  m.components?.some((c) =>
    c.components?.some((b) => b.custom_id === "verify_button"),
  ),
);

if (hasButton) {
  console.log("  . Buton zaten var");
} else {
  const msg = await api("POST", `/channels/${verifyCh.id}/messages`, {
    embeds: [
      {
        title: "🚪  KAPIYI AÇ",
        description:
          "**SYTHERIS'e adım atmak için kapıyı aralaman gerek.**\n\n" +
          "Aşağıdaki butona basarak doğrulamanı tamamla ve tüm aleme erişim kazan.\n\n" +
          "**Doğrulandığında:**\n" +
          "🎴  Anime tartışmalarına katılabilirsin\n" +
          "🔮  Kişisel öneri alabilirsin\n" +
          "🌸  Ruhlarla tanışabilirsin\n" +
          "🎬  Watch party'lere girebilirsin\n\n" +
          "> *Kuralları okumadıysan geri dön. Yasalar bağlayıcıdır.*",
        color: 0x00e676,
        footer: { text: "SYTHERIS · Doğrulama" },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: "Doğrulan",
            emoji: { name: "🌸" },
            custom_id: "verify_button",
          },
        ],
      },
    ],
  });
  console.log("  ✓ Buton mesajı gönderildi");

  try {
    await api("PUT", `/channels/${verifyCh.id}/pins/${msg.id}`);
    console.log("  ✓ Mesaj sabitlendi");
  } catch {}
}

// ---- 5) Public kanalların izinlerini de kontrol et ----
console.log("\n[4] Public kanallar açık bırakılıyor:");
for (const name of PUBLIC_CHANNELS) {
  const ch = (await api("GET", `/guilds/${GUILD_ID}/channels`)).find(
    (c) => c.name === name,
  );
  if (!ch) continue;
  console.log(`  🔓 ${ch.name}`);
}

console.log("\n===========================================");
console.log("  ✅ Doğrulama sistemi kuruldu!");
console.log("===========================================\n");
console.log("⚠️  BOTUN ROLÜ ᴜʏᴇ ROLÜNÜN ÜSTÜNDE OLMALI!");
console.log("   Sunucu Ayarları → Roller → bot rolünü en üste sürükle.\n");