// SYTHERIS — Mistik roller kurulumu
// Eski rolleri siler, yeni mistik rolleri oluşturur
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

// Bu isimdeki eski rolleri sil (script'in kendi oluşturduğu)
const OLD_ROLE_NAMES = [
  "Kurucu",
  "Moderatör",
  "Moderator",
  "Botlar",
  "Katkıcı",
  "Katkici",
  "Üye",
  "Uye",
  "Yeni Üye",
  "Yeni Uye",
  "Yeni Uyeler",
];

// Yeni mistik roller (yukarıdan aşağıya - önemli olan en üstte)
const NEW_ROLES = [
  {
    name: "Kadim Yaratıcı",
    color: 0x8b00ff,
    hoist: true,
    mentionable: true,
    permissions: "8", // Administrator
  },
  {
    name: "Peçe Muhafızı",
    color: 0x1e3a8a,
    hoist: true,
    mentionable: true,
    permissions: "1099511627782", // Moderation perms
  },
  {
    name: "Yıldız Habercisi",
    color: 0xf59e0b,
    hoist: true,
    mentionable: true,
    permissions: "0",
  },
  {
    name: "Ruhani Hizmetkâr",
    color: 0x64748b,
    hoist: false,
    mentionable: false,
    permissions: "0",
  },
  {
    name: "Boşluk Yürüyüşçüsü",
    color: 0x00e676,
    hoist: false,
    mentionable: false,
    permissions: "0",
  },
  {
    name: "Uyanan Ruh",
    color: 0xa855f7,
    hoist: false,
    mentionable: false,
    permissions: "0",
  },
];

console.log("\n=== SYTHERIS Mistik Roller Kurulumu ===\n");

const existingRoles = await api("GET", `/guilds/${GUILD_ID}/roles`);
console.log(`Mevcut rol sayisi: ${existingRoles.length}\n`);

// ---- 1) ESKİ ROLLERİ SİL ----
console.log("[1] Eski roller siliniyor:");
let deleted = 0;
for (const role of existingRoles) {
  // Sadece script'in oluşturduğu rolleri sil
  if (!OLD_ROLE_NAMES.includes(role.name)) continue;
  // Bot'un rolü, everyone (@everyone) ve managed roller silinemez
  if (role.managed || role.name === "@everyone") continue;

  try {
    await api("DELETE", `/guilds/${GUILD_ID}/roles/${role.id}`);
    console.log(`  - ${role.name}`);
    deleted++;
  } catch (e) {
    console.log(`  X ${role.name}: ${e.message.slice(0, 80)}`);
  }
}
if (deleted === 0) console.log("  . Silinecek eski rol yok");

// ---- 2) YENİ MİSTİK ROLLERİ OLUŞTUR ----
console.log("\n[2] Mistik roller oluşturuluyor:");
const freshRoles = await api("GET", `/guilds/${GUILD_ID}/roles`);
const freshNames = new Set(freshRoles.map((r) => r.name));

let created = 0;
for (let i = 0; i < NEW_ROLES.length; i++) {
  const role = NEW_ROLES[i];
  if (freshNames.has(role.name)) {
    console.log(`  . ${role.name} (zaten var)`);
    continue;
  }
  try {
    // Position: Discord'da pozisyon yüksek = üstte. Rolleri yukarıdan alta kuruyoruz.
    const body = {
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: role.permissions,
      position: NEW_ROLES.length - i,
    };
    await api("POST", `/guilds/${GUILD_ID}/roles`, body);
    console.log(`  + ${role.name}`);
    created++;
  } catch (e) {
    console.log(`  X ${role.name}: ${e.message.slice(0, 80)}`);
  }
}

console.log("\n===========================================");
console.log(`  Silinen  : ${deleted}`);
console.log(`  Oluşturan: ${created}`);
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap ve rolleri kontrol et.\n");