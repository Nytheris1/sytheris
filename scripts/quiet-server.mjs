// SYTHERIS — Sistem mesajlarını sustur + botları gizle
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
    throw new Error(`HTTP ${res.status} :: ${t.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

console.log("\n=== Sistem Mesajları Susturuluyor ===\n");

// system_channel_flags bits:
//   1 (1<<0) = SUPPRESS_JOIN_NOTIFICATIONS      -> "X katıldı" mesajını sustur
//   2 (1<<1) = SUPPRESS_PREMIUM_SUBSCRIPTIONS   -> boost mesajını sustur
//   4 (1<<2) = SUPPRESS_GUILD_REMINDER_NOTIFICATIONS
//   8 (1<<3) = SUPPRESS_JOIN_NOTIFICATION_REPLIES -> "X, Y'ye hoş geldin dedi" sustur
//  16 (1<<4) = SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS
//  32 (1<<5) = SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES

const FLAGS = 1 | 2 | 4 | 8 | 16 | 32; // 63 = hepsi susturulsun

try {
  await api("PATCH", `/guilds/${GUILD_ID}`, {
    system_channel_flags: FLAGS,
  });
  console.log("✓ Tüm sistem mesajları susturuldu (katılma, boost, hatırlatma)");
} catch (e) {
  console.log(`✗ ${e.message.slice(0, 150)}`);
}

console.log("\n===========================================");
console.log("  ✅ Sunucu sakinleştirildi!");
console.log("===========================================\n");
console.log("Artık 'X sunucuya katıldı' mesajları görünmeyecek.");
console.log("Karşılama mesajı sadece #ᴋᴀʀsɪʟᴀᴍᴀ'da senin yazdığın sabit mesaj.\n");