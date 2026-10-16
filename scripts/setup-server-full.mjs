// SYTHERIS — Komple Discord sunucu kurulumu
// Tek komutla: roller, kategoriler, kanallar, izinler, mesajlar, ikon, banner
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

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
  for (let i = 0; i < 4; i++) {
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

// ============================================================
// PERMISSION FLAGS
// ============================================================
const P = {
  VIEW_CHANNEL: 1024n,
  SEND_MESSAGES: 2048n,
  READ_HISTORY: 65536n,
  ADD_REACTIONS: 64n,
  CONNECT: 1048576n,
  SPEAK: 2097152n,
  MANAGE_MESSAGES: 8192n,
  KICK: 2n,
  BAN: 4n,
  MANAGE_ROLES: 268435456n,
  MANAGE_CHANNELS: 16n,
  ADMIN: 8n,
  MODERATE_MEMBERS: 1099511627776n,
  MANAGE_GUILD: 32n,
  MENTION_EVERYONE: 131072n,
};

const bits = (...flags) => flags.reduce((a, b) => a | b, 0n).toString();

const READONLY_ALLOW = bits(P.VIEW_CHANNEL, P.READ_HISTORY);
const READONLY_DENY = bits(P.SEND_MESSAGES);
const STAFF_ALLOW = bits(P.VIEW_CHANNEL, P.READ_HISTORY, P.SEND_MESSAGES, P.MANAGE_MESSAGES);

// ============================================================
// YAPI TANIMI
// ============================================================
const ROLES = [
  { key: "founder", name: "ᴋᴜʀᴜᴄᴜ", color: 0x8b5cf6, hoist: true, mention: true, perms: bits(P.ADMIN) },
  { key: "headmod", name: "ʙᴀs ᴍᴏᴅᴇʀᴀᴛᴏʀ", color: 0xe02556, hoist: true, mention: true, perms: bits(P.MANAGE_CHANNELS, P.MANAGE_ROLES, P.KICK, P.BAN, P.MANAGE_MESSAGES, P.MODERATE_MEMBERS) },
  { key: "moderator", name: "ᴍᴏᴅᴇʀᴀᴛᴏʀ", color: 0xf59e0b, hoist: true, mention: true, perms: bits(P.KICK, P.MANAGE_MESSAGES, P.MODERATE_MEMBERS) },
  { key: "guide", name: "ʀᴇʜʙᴇʀ", color: 0x14b8a6, hoist: true, mention: true, perms: 0 },
  { key: "bot", name: "ʙᴏᴛʟᴀʀ", color: 0x64748b, hoist: false, mention: false, perms: 0 },
  { key: "member", name: "ᴜʏᴇ", color: 0x00e676, hoist: false, mention: false, perms: 0 },
  { key: "visitor", name: "ᴢɪʏᴀʀᴇᴛᴄɪ", color: 0xa855f7, hoist: false, mention: false, perms: 0 },
];

const STRUCTURE = [
  {
    key: "start",
    name: "『 ɪ · ʙᴀsʟᴀɴɢɪᴄ 』",
    channels: [
      { key: "rules", name: "📜・ᴋᴜʀᴀʟʟᴀʀ", type: 0, topic: "Yasalar. Okumadan yazma, ruhun kaybolur.", readonly: true },
      { key: "announce", name: "📢・ᴅᴜʏᴜʀᴜʟᴀʀ", type: 0, topic: "Kadim duyurular. Site güncellemeleri, yeni bölümler.", readonly: true },
      { key: "welcome", name: "🎭・ᴋᴀʀsɪʟᴀᴍᴀ", type: 0, topic: "Yeni ruhlar bu kapıdan girer.", readonly: true },
      { key: "roles", name: "🎯・ʀᴏʟʟᴀʀ", type: 0, topic: "İlgi alanlarına göre rol seç.", readonly: true },
    ],
  },
  {
    key: "community",
    name: "『 ɪɪ · ᴛᴏᴘʟᴜʟᴜᴋ 』",
    channels: [
      { key: "general", name: "💬・sᴏʜʙᴇᴛ", type: 0, topic: "Ruhların buluştuğu meydan." },
      { key: "intro", name: "🌸・ᴛᴀɴɪsᴍᴀ", type: 0, topic: "Kendini tanıt: ad, zevk, yolculuk." },
      { key: "art", name: "🎨・sᴀɴᴀᴛ", type: 0, topic: "Sanat paylaşımları." },
      { key: "meme", name: "😂・ᴍᴇᴍᴇ", type: 0, topic: "Meme, mizah, kahkaha kristalleri." },
      { key: "selfie", name: "📸・sᴇʟꜰɪᴇ", type: 0, topic: "Koleksiyon, masaüstü, kişisel alan." },
    ],
  },
  {
    key: "anime",
    name: "『 ɪɪɪ · ᴀɴɪᴍᴇ 』",
    channels: [
      { key: "discuss", name: "🎴・ᴛᴀʀᴛɪsᴍᴀ", type: 0, topic: "Anime tartışmaları, karakter analizleri." },
      { key: "recom", name: "🔮・ᴏɴᴇʀɪ", type: 0, topic: "Öneri iste veya kehanet paylaş." },
      { key: "season", name: "🌊・sᴇᴢᴏɴ", type: 0, topic: "Bu sezon çıkan animeler." },
      { key: "versus", name: "⚔️・ᴋᴀʀsɪʟᴀsᴛɪʀᴍᴀ", type: 0, topic: "Anime kapışmaları." },
      { key: "spoiler", name: "🤫・sᴘᴏɪʟᴇʀ", type: 0, topic: "Spoiler içeren tartışmalar. Uyarıldın." },
    ],
  },
  {
    key: "voice",
    name: "『 ɪᴠ · sᴇsʟɪ 』",
    channels: [
      { key: "vc-general", name: "🔊 Genel Ses", type: 2 },
      { key: "vc-watch", name: "🎬 Watch Party", type: 2 },
      { key: "vc-music", name: "🎵 Müzik Odası", type: 2 },
      { key: "vc-game", name: "🎮 Oyun Odası", type: 2 },
    ],
  },
  {
    key: "bots",
    name: "『 ᴠ · ʙᴏᴛʟᴀʀ 』",
    channels: [
      { key: "commands", name: "🤖・ᴋᴏᴍᴜᴛʟᴀʀ", type: 0, topic: "/anime, /random, /calendar — büyüler burada işler." },
      { key: "notifs", name: "📬・ʙɪʟᴅɪʀɪᴍʟᴇʀ", type: 0, topic: "SYTHERIS otomatik bildirimleri.", readonly: true },
    ],
  },
  {
    key: "staff",
    name: "『 ᴠɪ · ʏᴏɴᴇᴛɪᴍ 』",
    staffOnly: true,
    channels: [
      { key: "staff-chat", name: "🛠️・ᴘᴇʀsᴏɴᴇʟ", type: 0, topic: "Personel sohbeti." },
      { key: "logs", name: "📋・ᴋᴀʏɪᴛʟᴀʀ", type: 0, topic: "Moderasyon kayıtları.", readonly: true },
      { key: "reports", name: "🚨・ʀᴀᴘᴏʀʟᴀʀ", type: 0, topic: "Üye şikayetleri." },
    ],
  },
];

// ============================================================
// 0) İKON + BANNER
// ============================================================
console.log("\n=== SYTHERIS Komple Kurulum ===\n");
console.log("[0] Sunucu ikonu ve banner:");

const patch = {};

const iconPath = path.join(ROOT, "public", "icon-512.png");
if (fs.existsSync(iconPath)) {
  patch.icon = `data:image/png;base64,${fs.readFileSync(iconPath).toString("base64")}`;
  console.log("  ✓ İkon eklendi");
}

const bannerSvg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#050507"/>
<stop offset="0.5" stop-color="#0a0a0e"/>
<stop offset="1" stop-color="#131318"/>
</linearGradient>
<radialGradient id="g1" cx="0.3" cy="0.4" r="0.55">
<stop offset="0" stop-color="#00E676" stop-opacity="0.35"/>
<stop offset="1" stop-color="#00E676" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g2" cx="0.8" cy="0.7" r="0.45">
<stop offset="0" stop-color="#A855F7" stop-opacity="0.28"/>
<stop offset="1" stop-color="#A855F7" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="1920" height="1080" fill="url(#bg)"/>
<circle cx="576" cy="432" r="900" fill="url(#g1)"/>
<circle cx="1536" cy="756" r="750" fill="url(#g2)"/>
<line x1="0" y1="140" x2="1920" y2="140" stroke="#ffffff" stroke-opacity="0.06"/>
<line x1="0" y1="940" x2="1920" y2="940" stroke="#ffffff" stroke-opacity="0.06"/>
<text x="120" y="100" fill="#00E676" font-family="monospace" font-size="18" letter-spacing="12">P R E M I U M   A N I M E   H U B</text>
<text x="960" y="580" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-size="200" font-weight="900" letter-spacing="24">SYTHERIS</text>
<line x1="620" y1="640" x2="1300" y2="640" stroke="#00E676" stroke-width="3"/>
<text x="960" y="710" text-anchor="middle" fill="#ffffff" fill-opacity="0.7" font-family="monospace" font-size="24" letter-spacing="14">ANIME  ·  KESIF  ·  TOPLULUK</text>
<text x="960" y="1000" text-anchor="middle" fill="#ffffff" fill-opacity="0.35" font-family="monospace" font-size="16" letter-spacing="8">SYTHERIS.VERCEL.APP</text>
<path d="M 60 60 L 160 60 M 60 60 L 60 160" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
<path d="M 1860 60 L 1760 60 M 1860 60 L 1860 160" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
<path d="M 60 1020 L 160 1020 M 60 1020 L 60 960" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
<path d="M 1860 1020 L 1760 1020 M 1860 1020 L 1860 960" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
</svg>`;

try {
  const buf = await sharp(Buffer.from(bannerSvg)).png({ compressionLevel: 9 }).toBuffer();
  patch.banner = `data:image/png;base64,${buf.toString("base64")}`;
  fs.writeFileSync(path.join(ROOT, "public", "banner.png"), buf);
  console.log("  ✓ Banner oluşturuldu");
} catch (e) {
  console.log(`  ✗ Banner: ${e.message.slice(0, 80)}`);
}

try {
  await api("PATCH", `/guilds/${GUILD_ID}`, {
    name: "SYTHERIS",
    description: "Anime keşif platformu ve topluluk. " + SITE_URL,
    verification_level: 2,
    explicit_content_filter: 2,
    default_message_notifications: 0,
    ...patch,
  });
  console.log("  ✓ Sunucu ayarları güncellendi");
} catch (e) {
  console.log(`  ✗ Sunucu ayarları: ${e.message.slice(0, 100)}`);
}

// ============================================================
// 1) ROLLER
// ============================================================
console.log("\n[1] Roller:");
let existingRoles = await api("GET", `/guilds/${GUILD_ID}/roles`);
const roleIdByKey = {};
const rolesByName = new Map(existingRoles.map((r) => [r.name, r]));

for (const r of ROLES) {
  const found = rolesByName.get(r.name);
  if (found) {
    roleIdByKey[r.key] = found.id;
    console.log(`  . ${r.name}`);
    continue;
  }
  try {
    const created = await api("POST", `/guilds/${GUILD_ID}/roles`, {
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      mentionable: r.mention,
      permissions: r.perms,
    });
    roleIdByKey[r.key] = created.id;
    console.log(`  + ${r.name}`);
  } catch (e) {
    console.log(`  ✗ ${r.name}: ${e.message.slice(0, 80)}`);
  }
}

// İkinci turda pozisyonları ayarla (yukarıdan aşağıya)
await new Promise((r) => setTimeout(r, 800));
existingRoles = await api("GET", `/guilds/${GUILD_ID}/roles`);
const posBody = ROLES.map((r, i) => {
  const found = existingRoles.find((x) => x.name === r.name);
  return found ? { id: found.id, position: ROLES.length - i } : null;
}).filter(Boolean);

if (posBody.length > 0) {
  try {
    await api("PATCH", `/guilds/${GUILD_ID}/roles`, posBody);
    console.log("  ✓ Rol sıralaması ayarlandı");
  } catch (e) {
    console.log(`  ✗ Rol sıralaması: ${e.message.slice(0, 80)}`);
  }
}

const staffRoleIds = [
  roleIdByKey.founder,
  roleIdByKey.headmod,
  roleIdByKey.moderator,
].filter(Boolean);

// ============================================================
// 2) KATEGORİ + KANALLAR
// ============================================================
console.log("\n[2] Kategoriler ve kanallar:");
let channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
const catIdByKey = {};
const chanIdByKey = {};

for (let i = 0; i < STRUCTURE.length; i++) {
  const cat = STRUCTURE[i];

  // Kategori
  let catId = channels.find((c) => c.type === 4 && c.name === cat.name)?.id;
  if (!catId) {
    try {
      const c = await api("POST", `/guilds/${GUILD_ID}/channels`, {
        name: cat.name,
        type: 4,
        position: i,
        permission_overwrites: cat.staffOnly
          ? [
              { id: GUILD_ID, type: 0, allow: "0", deny: bits(P.VIEW_CHANNEL) },
              ...staffRoleIds.map((rid) => ({
                id: rid,
                type: 0,
                allow: STAFF_ALLOW,
                deny: "0",
              })),
            ]
          : [],
      });
      catId = c.id;
      console.log(`  + ${cat.name}`);
    } catch (e) {
      console.log(`  ✗ ${cat.name}: ${e.message.slice(0, 80)}`);
      continue;
    }
  } else {
    console.log(`  . ${cat.name}`);
  }
  catIdByKey[cat.key] = catId;

  // Kanallar
  for (const ch of cat.channels) {
    channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
    const existing = channels.find((c) => c.name === ch.name);

    if (existing) {
      chanIdByKey[ch.key] = existing.id;
      console.log(`    . ${ch.name}`);
      continue;
    }

    const body = {
      name: ch.name,
      type: ch.type,
      parent_id: catId,
    };
    if (ch.topic) body.topic = ch.topic;

    if (ch.readonly) {
      body.permission_overwrites = [
        { id: GUILD_ID, type: 0, allow: READONLY_ALLOW, deny: READONLY_DENY },
        ...staffRoleIds.map((rid) => ({
          id: rid,
          type: 0,
          allow: READONLY_ALLOW,
          deny: "0",
        })),
      ];
    } else if (cat.staffOnly) {
      body.permission_overwrites = [
        { id: GUILD_ID, type: 0, allow: "0", deny: bits(P.VIEW_CHANNEL) },
        ...staffRoleIds.map((rid) => ({
          id: rid,
          type: 0,
          allow: STAFF_ALLOW,
          deny: "0",
        })),
      ];
    }

    try {
      const created = await api("POST", `/guilds/${GUILD_ID}/channels`, body);
      chanIdByKey[ch.key] = created.id;
      console.log(`    + ${ch.type === 2 ? "🔊 " : ""}${ch.name}`);
    } catch (e) {
      console.log(`    ✗ ${ch.name}: ${e.message.slice(0, 80)}`);
    }
  }
}

// ============================================================
// 3) KURALLAR MESAJI
// ============================================================
console.log("\n[3] Kurallar mesajı:");
if (chanIdByKey.rules) {
  const rulesEmbed = {
    title: "📜  KADİM YASALAR",
    description:
      "**Bu diyarın düzeni şu yasalarla korunur. Her ruh okumakla yükümlüdür.**\n\n" +
      "**`ɪ`**  ✦  **Saygı** — Her ruha saygı göster. Hakaret, ayrımcılık, taciz yasak.\n\n" +
      "**`ɪɪ`**  ✦  **Spoiler** — Spoiler içeren içerikleri `🤫・sᴘᴏɪʟᴇʀ` kanalında paylaş. Aksi halde uyarı.\n\n" +
      "**`ɪɪɪ`**  ✦  **Reklam** — İzinsiz reklam, davet linki, DM spamı yasaktır.\n\n" +
      "**`ɪᴠ`**  ✦  **NSFW** — NSFW içerik, görsel, link paylaşımı yasaktır.\n\n" +
      "**`ᴠ`**  ✦  **Konu Dışı** — Alakasız konuları `🌌・ʙᴏsʟᴜᴋ` kanalına taşı.\n\n" +
      "**`ᴠɪ`**  ✦  **Kanal Amacı** — Her kanalın kendi amacı var. Uygun yerde yaz.\n\n" +
      "**`ᴠɪɪ`**  ✦  **Yetkililer** — Kararlarına saygı göster. İtiraz için DM atabilirsin.\n\n" +
      "> **Kurallara uymayan ruhlar, uyarı almadan sessizliğe gömülebilir.**",
    color: 0x00e676,
    footer: { text: "SYTHERIS · Son güncelleme" },
    timestamp: new Date().toISOString(),
  };

  try {
    const msg = await api("POST", `/channels/${chanIdByKey.rules}/messages`, {
      embeds: [rulesEmbed],
    });
    await api("PUT", `/channels/${chanIdByKey.rules}/pins/${msg.id}`);
    console.log("  ✓ Kurallar gönderildi ve sabitlendi");
  } catch (e) {
    console.log(`  ✗ ${e.message.slice(0, 100)}`);
  }
}

// ============================================================
// 4) KARŞILAMA MESAJI
// ============================================================
console.log("\n[4] Karşılama mesajı:");
if (chanIdByKey.welcome) {
  const welcomeEmbed = {
    title: "🌌  SYTHERIS'E HOŞ GELDİN",
    description:
      `**Bir ruh daha aleme katıldı.**\n\n` +
      "**Bu diyarda seni neler bekliyor?**\n" +
      "🎴  Anime keşfi ve derin tartışmalar\n" +
      "🔮  Kişisel öneriler ve kehanetler\n" +
      "🌸  Sıcak bir topluluk ve mistik dostluklar\n" +
      "🎬  Birlikte izleme ayinleri\n\n" +
      "**İlk adımların:**\n" +
      "`1` →  📜 `ᴋᴜʀᴀʟʟᴀʀ` kanalını oku\n" +
      "`2` →  🎯 `ʀᴏʟʟᴀʀ` kanalından ilgi alanlarını seç\n" +
      "`3` →  🌸 `ᴛᴀɴɪsᴍᴀ` kanalında kendini tanıt\n" +
      "`4` →  💬 `sᴏʜʙᴇᴛ` kanalına katıl\n\n" +
      `🔗  **Web sitemiz:** ${SITE_URL}\n` +
      "🤖  **Bot komutları:** `/anime`, `/random`, `/calendar`",
    color: 0x00e676,
    image: {
      url: "attachment://welcome.png",
    },
  };

  // welcome.png yoksa sadece metin at
  const body = { embeds: [welcomeEmbed] };

  try {
    const msg = await api("POST", `/channels/${chanIdByKey.welcome}/messages`, body);
    await api("PUT", `/channels/${chanIdByKey.welcome}/pins/${msg.id}`);
    console.log("  ✓ Karşılama gönderildi ve sabitlendi");
  } catch (e) {
    console.log(`  ✗ ${e.message.slice(0, 100)}`);
  }
}

// ============================================================
// 5) DUYURU BAŞLANGIÇ
// ============================================================
console.log("\n[5] Duyuru kanalı açılış:");
if (chanIdByKey.announce) {
  const embed = {
    title: "📯  HABERCİ KULESİ AKTİF",
    description:
      "Bundan sonra bu kanalda:\n\n" +
      "• 🎬 Yeni anime bölümleri\n" +
      "• 🚀 Site güncellemeleri\n" +
      "• 🎉 Topluluk etkinlikleri\n" +
      "• 🏆 Haftalık özetler\n\n" +
      `Kal sağlıcakla. — **SYTHERIS**\n${SITE_URL}`,
    color: 0x00e676,
    footer: { text: "SYTHERIS · Haberci" },
    timestamp: new Date().toISOString(),
  };
  try {
    await api("POST", `/channels/${chanIdByKey.announce}/messages`, { embeds: [embed] });
    console.log("  ✓ Duyuru açılışı gönderildi");
  } catch (e) {
    console.log(`  ✗ ${e.message.slice(0, 100)}`);
  }
}

console.log("\n===========================================");
console.log("  ✅ KOMPLE SUNUCU KURULUMU TAMAM!");
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap → sunucunu yenile.\n");