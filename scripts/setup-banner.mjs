// SYTHERIS — Otomatik banner üretimi + yükleme
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

if (!TOKEN || !GUILD_ID) {
  console.error("DISCORD_BOT_TOKEN veya DISCORD_GUILD_ID eksik");
  process.exit(1);
}

const API = "https://discord.com/api/v10";

// ============================================================
// BANNER SVG (1920x1080)
// ============================================================
const svg = `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050507"/>
      <stop offset="50%" stop-color="#0a0a0e"/>
      <stop offset="100%" stop-color="#131318"/>
    </linearGradient>
    <radialGradient id="glow1" cx="30%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#00E676" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#00E676" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="80%" cy="70%" r="45%">
      <stop offset="0%" stop-color="#A855F7" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#A855F7" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"/>
    </filter>
  </defs>

  <!-- arka plan -->
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="576" cy="432" r="900" fill="url(#glow1)"/>
  <circle cx="1536" cy="756" r="750" fill="url(#glow2)"/>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.7"/>

  <!-- ince çizgiler -->
  <line x1="0" y1="140" x2="1920" y2="140" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>
  <line x1="0" y1="940" x2="1920" y2="940" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>

  <!-- üst sol köşe: etiket -->
  <text x="120" y="100" fill="#00E676" font-family="monospace" font-size="18" letter-spacing="12">P R E M I U M   A N I M E   H U B</text>

  <!-- ana başlık -->
  <text x="960" y="560" text-anchor="middle" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-size="180" font-weight="900" letter-spacing="24">SYTHERIS</text>

  <!-- yeşil accent çizgi -->
  <line x1="620" y1="620" x2="1300" y2="620" stroke="#00E676" stroke-width="3"/>

  <!-- alt açıklama -->
  <text x="960" y="690" text-anchor="middle" fill="#ffffff" fill-opacity="0.7" font-family="monospace" font-size="24" letter-spacing="14">ANIME  ·  KESIF  ·  TOPLULUK</text>

  <!-- alt bilgi -->
  <text x="960" y="1000" text-anchor="middle" fill="#ffffff" fill-opacity="0.35" font-family="monospace" font-size="16" letter-spacing="8">SYTHERIS.VERCEL.APP</text>

  <!-- köşe süsleri -->
  <path d="M 60 60 L 160 60 M 60 60 L 60 160" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M 1860 60 L 1760 60 M 1860 60 L 1860 160" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M 60 1020 L 160 1020 M 60 1020 L 60 920" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M 1860 1020 L 1760 1020 M 1860 1020 L 1860 920" stroke="#00E676" stroke-width="2" fill="none" opacity="0.6"/>
</svg>
`;

console.log("\n=== SYTHERIS Banner Üretimi ===\n");

// ---- 1) PNG olarak render et ----
console.log("[1] Banner render ediliyor...");
const bannerPath = path.join(ROOT, "public", "banner.png");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(bannerPath);
const stat = fs.statSync(bannerPath);
console.log(`  ✓ public/banner.png (${(stat.size / 1024).toFixed(1)} KB)`);

// ---- 2) Discord'a yükle ----
console.log("\n[2] Discord'a yükleniyor...");
const b64 = fs.readFileSync(bannerPath).toString("base64");
const res = await fetch(`${API}/guilds/${GUILD_ID}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${TOKEN}`,
  },
  body: JSON.stringify({
    banner: `data:image/png;base64,${b64}`,
  }),
});

if (!res.ok) {
  const text = await res.text().catch(() => "");
  console.error(`  ✗ HTTP ${res.status}: ${text.slice(0, 300)}`);
  process.exit(1);
}

console.log("  ✓ Banner yüklendi");

console.log("\n===========================================");
console.log("  ✅ Banner hazır!");
console.log("===========================================\n");
console.log("Discord'da Ctrl+R yap ve sunucu banner'ını gör.\n");