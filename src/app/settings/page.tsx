"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimeCard } from "@/components/anime-card";
import { EmptyState } from "@/components/empty-state";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { StatsPanel } from "@/components/stats-panel";
import { LibrarySection } from "@/components/library-section";
import { useAudio } from "@/components/audio-provider";
import { useAuth } from "@/components/auth-provider";
import { useTheme, THEMES } from "@/lib/theme";
import { useFavorites, useLibrary, STORAGE_KEYS } from "@/lib/user-data";
import type { Anime } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

type SectionId =
  | "general"
  | "account"
  | "library"
  | "favorites"
  | "stats"
  | "music"
  | "data";

const SECTIONS: { id: SectionId; label: string; icon: string; desc: string }[] = [
  { id: "general", label: "Genel", icon: "◆", desc: "Görünüm ve tercihler" },
  { id: "account", label: "Hesap", icon: "◉", desc: "Giriş ve bulut senkron" },
  { id: "library", label: "Kitaplık", icon: "◐", desc: "İzleme durumun" },
  { id: "favorites", label: "Favoriler", icon: "★", desc: "Beğendiklerin" },
  { id: "stats", label: "İstatistik", icon: "▦", desc: "İzleme alışkanlıkların" },
  { id: "music", label: "Müzik", icon: "♪", desc: "Arka plan müziği" },
  { id: "data", label: "Veri", icon: "◈", desc: "Yedekleme ve sıfırlama" },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("general");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <header className="mb-6 sm:mb-8 md:mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-700 sm:text-xs">
          Tercihler
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold leading-[1.1] tracking-tight sm:mt-2.5 sm:text-3xl md:text-5xl">
          Ayarlar
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-400 sm:mt-3 sm:text-sm md:text-base">
          Görünümü, hesabını, kitaplığını, müziğini ve verilerini tek yerden yönet.
        </p>
      </header>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    active
                      ? "bg-ink-900/80 text-cream-50"
                      : "text-cream-200 hover:bg-ink-900/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors",
                      active
                        ? "bg-accent-400 text-night-950"
                        : "bg-ink-800 text-muted-400 group-hover:text-cream-200",
                    )}
                    aria-hidden
                  >
                    {s.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-400">
                      {s.desc}
                    </span>
                  </span>
                  {active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="lg:hidden">
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5 sm:py-2 sm:text-sm",
                    active
                      ? "border-accent-400 bg-accent-400/10 text-accent-700"
                      : "border-ink-700 text-cream-200 hover:border-ink-600",
                  )}
                >
                  <span aria-hidden className="mr-1.5 text-[10px] sm:text-xs">
                    {s.icon}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          {section === "general" && <GeneralSection />}
          {section === "account" && <AccountSection />}
          {section === "library" && <LibrarySection />}
          {section === "favorites" && <FavoritesSection />}
          {section === "stats" && <StatsPanel />}
          {section === "music" && <MusicSection />}
          {section === "data" && <DataSection />}
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   HESAP
   ============================================================ */
function AccountSection() {
  const { user, loading, configured, signIn, signUp, signInWithDiscord, signOut } =
    useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  function showFlash(kind: "ok" | "err", text: string) {
    setFlash({ kind, text });
    setTimeout(() => setFlash(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) showFlash("err", error);
        else showFlash("ok", "Giriş başarılı. Verilerin senkronize ediliyor…");
      } else {
        const { error, needsConfirmation } = await signUp(
          email.trim(),
          password,
        );
        if (error) {
          showFlash("err", error);
        } else if (needsConfirmation) {
          showFlash(
            "ok",
            "Kayıt alındı. E-postana gelen onay linkine tıklaman gerekiyor.",
          );
        } else {
          showFlash("ok", "Kayıt başarılı. Giriş yapıldı.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscordLogin() {
    setBusy(true);
    try {
      const { error } = await signInWithDiscord();
      if (error) showFlash("err", error);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SectionCard title="Hesap" description="Yükleniyor…">
        <div className="h-24 animate-pulse rounded-xl bg-ink-800/60" />
      </SectionCard>
    );
  }

  if (!configured) {
    return (
      <SectionCard title="Hesap" description="Bulut senkronizasyonu kapalı.">
        <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-4 text-sm text-muted-400">
          Supabase yapılandırılmamış. <code>.env.local</code> dosyasına{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ekle, ardından sunucuyu
          yeniden başlat.
        </div>
      </SectionCard>
    );
  }

  if (user) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <SectionCard
          title="Giriş yapıldı"
          description="Verilerin buluta otomatik yedeklenir."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-400 sm:text-sm">E-posta</p>
              <p className="mt-1 truncate font-mono text-sm text-cream-50">
                {user.email}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-400">
                ID · {user.id.slice(0, 8)}…
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-full border border-crimson-500/50 px-5 py-2.5 text-xs font-medium text-crimson-500 transition-colors hover:bg-crimson-500/10 sm:text-sm"
            >
              Çıkış yap
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Senkronizasyon"
          description="Favorilerin, kitaplığın ve bölüm puanların bulutta saklanır."
        >
          <ul className="space-y-2.5 text-sm text-cream-200">
            <SyncRow label="Favoriler" status="otomatik" />
            <SyncRow label="Kitaplık (izleme durumları)" status="otomatik" />
            <SyncRow label="Bölüm puanları" status="otomatik" />
            <SyncRow label="Bölüm izlemeleri" status="otomatik" />
            <SyncRow label="Notlar ve puanlar" status="otomatik" />
          </ul>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {flash && (
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm",
            flash.kind === "ok"
              ? "border-accent-400/40 bg-accent-400/10 text-accent-700"
              : "border-crimson-500/40 bg-crimson-500/10 text-crimson-500",
          )}
          role="status"
        >
          {flash.text}
        </div>
      )}

      <SectionCard
        title={mode === "signin" ? "Giriş yap" : "Hesap oluştur"}
        description="Favorilerini ve kitaplığını tüm cihazlarında taşı."
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400"
            >
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sen@ornek.com"
              required
              className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400"
            >
              Parola
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
              className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !email.trim() || password.length < 6}
            className="w-full rounded-full bg-accent-400 px-5 py-2.5 text-sm font-semibold text-night-950 transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {busy
              ? "İşleniyor…"
              : mode === "signin"
                ? "Giriş yap"
                : "Hesap oluştur"}
          </button>
        </form>

        {/* VEYA ayırıcı */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
            <span className="bg-ink-950 px-3 text-muted-400">veya</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDiscordLogin}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 px-5 py-3 text-sm font-semibold text-[#a5b4fc] transition-colors hover:border-[#5865F2] hover:bg-[#5865F2]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DiscordIcon />
          <span>Discord ile devam et</span>
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-xs text-muted-400 underline-offset-4 transition-colors hover:text-cream-50 hover:underline sm:text-sm"
        >
          {mode === "signin"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </SectionCard>

      <SectionCard
        title="Neden hesap?"
        description="Yerel verilerin cihazına bağlıdır; hesap açınca buluta yedeklenir."
      >
        <ul className="space-y-2 text-xs text-muted-400 sm:text-sm">
          <li className="flex items-start gap-2">
            <span className="text-accent-700" aria-hidden>
              ◆
            </span>
            Cihaz değiştirdiğinde verilerin kaybolmaz.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-700" aria-hidden>
              ◆
            </span>
            Tarayıcı verilerini temizlesen bile bulutta durur.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-700" aria-hidden>
              ◆
            </span>
            Birden fazla cihazdan aynı listeyi görürsün.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent-700" aria-hidden>
              ◆
            </span>
            Verileri sadece sen görebilirsin (Supabase RLS).
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}

function SyncRow({ label, status }: { label: string; status: string }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-ink-800/60 pb-2.5 last:border-0 last:pb-0">
      <span>{label}</span>
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-400" />
        {status}
      </span>
    </li>
  );
}

/* ============================================================
   GENEL
   ============================================================ */
function GeneralSection() {
  const { theme, setTheme } = useTheme();
  const { enabled: audioEnabled, toggle: toggleAudio } = useAudio();

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionCard title="Görünüm" description="Uygulamanın vurgu rengini seç.">
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {THEMES.map((t) => {
            const active = theme.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-all sm:p-4",
                  active
                    ? "border-accent-400 bg-accent-400/[0.06]"
                    : "border-ink-800 hover:border-ink-700 hover:bg-ink-900/40",
                )}
                aria-pressed={active}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-full ring-1 ring-inset ring-white/10 sm:h-8 sm:w-8"
                  style={{ backgroundColor: t.accent }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-cream-50 sm:text-sm">
                    {t.tagline}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-muted-400 sm:text-[10px]">
                    {t.id}
                  </span>
                </span>
                {active && (
                  <span className="text-accent-400" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Arka plan müziği"
        description="Müzik otomatik çalsın mı?"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-cream-50 sm:text-sm">
              {audioEnabled ? "Müzik açık" : "Müzik kapalı"}
            </p>
            <p className="mt-1 text-[11px] text-muted-400 sm:text-xs">
              Dosya ve ses için <strong>Müzik</strong> bölümüne geç.
            </p>
          </div>
          <button
            onClick={toggleAudio}
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full transition-colors sm:h-7 sm:w-12",
              audioEnabled ? "bg-accent-400" : "bg-ink-700",
            )}
            role="switch"
            aria-checked={audioEnabled}
            aria-label={audioEnabled ? "Müziği kapat" : "Müziği aç"}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform sm:top-1",
                audioEnabled
                  ? "translate-x-[18px] sm:translate-x-6"
                  : "translate-x-0.5 sm:translate-x-1",
              )}
            />
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Hakkında" description="Sürüm ve veri kaynağı.">
        <dl className="space-y-2.5 text-xs sm:space-y-3 sm:text-sm">
          <Row label="Veri kaynağı">
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream-50 underline-offset-4 hover:underline"
            >
              AniList GraphQL
            </a>
          </Row>
          <Row label="Sürüm">
            <span className="font-mono text-[11px] text-cream-50 sm:text-xs">
              0.2.0
            </span>
          </Row>
          <Row label="Depolama">
            <span className="text-cream-50">Tarayıcı + Supabase</span>
          </Row>
        </dl>
      </SectionCard>
    </div>
  );
}

/* ============================================================
   FAVORİLER
   ============================================================ */
function FavoritesSection() {
  const favorites = useFavorites();

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionCard
        title="Favorilerim"
        description={`${favorites.length} anime favorilerinde.`}
      >
        <p className="text-xs text-muted-400 sm:text-sm">
          Beğendiğin animeleri favorilere ekleyerek buradan hızlıca erişebilirsin.
        </p>
      </SectionCard>

      {favorites.length === 0 ? (
        <EmptyState
          icon="★"
          title="Henüz favorin yok."
          description="Beğendiğin animeleri favorilere ekle, burada biriksin."
          action={{ href: "/search", label: "Anime ara" }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
          {favorites.map((f, i) => (
            <AnimeCard key={f.id} anime={favToAnime(f)} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MÜZİK
   ============================================================ */
function MusicSection() {
  const audioInput = useRef<HTMLInputElement>(null);
  const {
    enabled,
    volume,
    source,
    fileInfo,
    eq,
    toggle,
    setVolume,
    setSourceUrl,
    setSourceDefault,
    uploadFile,
    removeFile,
    setEQ,
    resetEQ,
  } = useAudio();

  const [urlInput, setUrlInput] = useState("");
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  function showFlash(kind: "ok" | "err", text: string) {
    setFlash({ kind, text });
    setTimeout(() => setFlash(null), 3000);
  }

  async function handleAudioFile(file: File) {
    if (file.size > 30 * 1024 * 1024) {
      showFlash("err", "Dosya çok büyük (maks. 30 MB).");
      return;
    }
    if (!file.type.startsWith("audio/")) {
      showFlash("err", "Lütfen bir ses dosyası seç.");
      return;
    }
    try {
      await uploadFile(file);
      showFlash("ok", `"${file.name}" yüklendi.`);
    } catch {
      showFlash("err", "Dosya yüklenemedi.");
    }
  }

  const sourceLabel =
    source.type === "default"
      ? "Varsayılan (ambient.mp3)"
      : source.type === "url"
        ? `URL: ${source.value?.slice(0, 30)}${(source.value?.length ?? 0) > 30 ? "…" : ""}`
        : `Dosya: ${fileInfo?.name ?? source.name ?? "yüklenen"}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {flash && (
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm",
            flash.kind === "ok"
              ? "border-accent-400/40 bg-accent-400/10 text-accent-700"
              : "border-crimson-500/40 bg-crimson-500/10 text-crimson-500",
          )}
          role="status"
        >
          {flash.text}
        </div>
      )}

      <SectionCard
        title="Müzik durumu"
        description="Aç/kapat, canlı frekansları izle."
        action={
          <button
            onClick={toggle}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
              enabled
                ? "border-accent-500 bg-accent-400/15 text-accent-700"
                : "border-ink-600 text-cream-50 hover:border-cream-50",
            )}
            aria-pressed={enabled}
          >
            {enabled ? "Açık" : "Kapalı"}
          </button>
        }
      >
        <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-3 sm:p-4">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:mb-3 sm:text-[10px]">
            Canlı frekans
          </p>
          <AudioVisualizer height={48} className="sm:!h-16" />
        </div>

        <div className="mt-3 rounded-lg border border-ink-800 bg-ink-950/50 px-3 py-2.5 sm:mt-5 sm:px-4 sm:py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
            Çalan kaynak
          </p>
          <p className="mt-1 truncate text-xs text-cream-50 sm:text-sm">
            {sourceLabel}
          </p>
          {fileInfo && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] text-muted-400 sm:mt-2 sm:gap-x-4 sm:text-[10px]">
              <span>{(fileInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              {fileInfo.bitrate && (
                <span className="text-accent-700">~{fileInfo.bitrate} kbps</span>
              )}
              {fileInfo.duration && <span>{formatDuration(fileInfo.duration)}</span>}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Ses seviyesi" description="Kulağa doğrusal eğri.">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="volume"
            className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]"
          >
            Seviye
          </label>
          <span className="font-mono text-[10px] tabular-nums text-muted-400 sm:text-xs">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          id="volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="mt-2 w-full accent-accent-400 sm:mt-3"
        />
      </SectionCard>

      <SectionCard
        title="Ekolayzer"
        description="Bas / Orta / Tiz — ±12 dB."
        action={
          <button
            onClick={resetEQ}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-400 transition-colors hover:text-cream-50 sm:text-[10px]"
          >
            sıfırla
          </button>
        }
      >
        <div className="space-y-3.5 sm:space-y-5">
          <EQSlider label="Bas" value={eq.bass} onChange={(v) => setEQ({ bass: v })} />
          <EQSlider label="Orta" value={eq.mid} onChange={(v) => setEQ({ mid: v })} />
          <EQSlider
            label="Tiz"
            value={eq.treble}
            onChange={(v) => setEQ({ treble: v })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Kaynak" description="Dosya, URL veya varsayılan.">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => audioInput.current?.click()}
              className="rounded-full bg-accent-400 px-4 py-2 text-xs font-semibold text-night-950 transition-colors hover:bg-accent-500 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Dosya yükle
            </button>
            {source.type === "file" && (
              <button
                onClick={async () => {
                  await removeFile();
                  showFlash("ok", "Yüklenen dosya kaldırıldı.");
                }}
                className="rounded-full border border-ink-600 px-4 py-2 text-xs text-cream-50 transition-colors hover:border-crimson-500 hover:text-crimson-500 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                Kaldır
              </button>
            )}
            <input
              ref={audioInput}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAudioFile(f);
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
              veya URL
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2 sm:mt-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://…/muzik.mp3"
                className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none sm:text-sm"
              />
              <button
                onClick={() => {
                  if (!urlInput.trim()) return;
                  setSourceUrl(urlInput.trim());
                  setUrlInput("");
                  showFlash("ok", "URL kaynağı uygulandı.");
                }}
                className="rounded-lg border border-ink-600 px-3 py-2 text-xs text-cream-50 transition-colors hover:border-cream-50 sm:px-4 sm:text-sm"
              >
                Uygula
              </button>
            </div>
          </div>

          {source.type !== "default" && (
            <button
              onClick={() => {
                setSourceDefault();
                showFlash("ok", "Varsayılan müziğe dönüldü.");
              }}
              className="text-xs text-muted-400 transition-colors hover:text-cream-50 sm:text-sm"
            >
              Varsayılana dön
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ============================================================
   VERİ
   ============================================================ */
function DataSection() {
  const favorites = useFavorites();
  const library = useLibrary();
  const dataInput = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  function showFlash(kind: "ok" | "err", text: string) {
    setFlash({ kind, text });
    setTimeout(() => setFlash(null), 3000);
  }

  function exportData() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.favorites) ?? "[]",
      ),
      library: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.library) ?? "[]",
      ),
      episodes: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.episodes) ?? "{}",
      ),
      episodeRatings: JSON.parse(
        localStorage.getItem(STORAGE_KEYS.episodeRatings) ?? "{}",
      ),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sytheris-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFlash("ok", "Veriler indirildi.");
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data.favorites)) {
          localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(data.favorites));
        }
        if (Array.isArray(data.library)) {
          localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(data.library));
        } else if (Array.isArray(data.history)) {
          localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(data.history));
        }
        if (data.episodes && typeof data.episodes === "object") {
          localStorage.setItem(STORAGE_KEYS.episodes, JSON.stringify(data.episodes));
        }
        if (data.episodeRatings && typeof data.episodeRatings === "object") {
          localStorage.setItem(
            STORAGE_KEYS.episodeRatings,
            JSON.stringify(data.episodeRatings),
          );
        }
        showFlash("ok", "Veriler yüklendi. Sayfa yenileniyor…");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        showFlash("err", "Dosya okunamadı veya geçersiz JSON.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {flash && (
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm",
            flash.kind === "ok"
              ? "border-accent-400/40 bg-accent-400/10 text-accent-700"
              : "border-crimson-500/40 bg-crimson-500/10 text-crimson-500",
          )}
          role="status"
        >
          {flash.text}
        </div>
      )}

      <SectionCard title="Kitaplık durumu" description="Şu anki kayıtların.">
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
          <StatBox label="Favoriler" value={favorites.length} />
          <StatBox
            label="İzliyorum"
            value={library.filter((l) => l.status === "watching").length}
          />
          <StatBox
            label="İzleyeceğim"
            value={library.filter((l) => l.status === "planned").length}
          />
          <StatBox
            label="İzledim"
            value={library.filter((l) => l.status === "completed").length}
          />
        </dl>
      </SectionCard>

      <SectionCard title="Yedekleme" description="JSON olarak taşı.">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={exportData}
            className="rounded-full bg-accent-400 px-4 py-2 text-xs font-semibold text-night-950 transition-colors hover:bg-accent-500 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Verileri indir
          </button>
          <button
            onClick={() => dataInput.current?.click()}
            className="rounded-full border border-ink-600 px-4 py-2 text-xs font-medium text-cream-50 transition-colors hover:border-cream-50 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Dosyadan yükle
          </button>
          <input
            ref={dataInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Tehlikeli bölge"
        description="Geri alınamaz."
        variant="danger"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <DangerButton
            label="Favorileri temizle"
            confirmText="Tüm favoriler silinsin mi?"
            onConfirm={() => {
              localStorage.removeItem(STORAGE_KEYS.favorites);
              window.location.reload();
            }}
            disabled={favorites.length === 0}
          />
          <DangerButton
            label="Kitaplığı temizle"
            confirmText="Tüm izleme kayıtları silinsin mi?"
            onConfirm={() => {
              localStorage.removeItem(STORAGE_KEYS.library);
              window.location.reload();
            }}
            disabled={library.length === 0}
          />
        </div>
      </SectionCard>
    </div>
  );
}

/* ============================================================
   YARDIMCI BİLEŞENLER
   ============================================================ */
function SectionCard({
  title,
  description,
  action,
  variant = "default",
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border p-4 sm:rounded-2xl sm:p-6 md:p-7",
        variant === "danger"
          ? "border-crimson-500/30 bg-crimson-500/[0.03]"
          : "border-ink-800 bg-ink-900/30",
      )}
    >
      <header className="mb-3.5 flex flex-wrap items-start justify-between gap-2.5 sm:mb-5 sm:gap-3">
        <div className="min-w-0">
          <h2
            className={cn(
              "font-display text-sm font-semibold tracking-tight sm:text-base md:text-lg",
              variant === "danger" ? "text-crimson-500" : "text-cream-50",
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-400 sm:mt-1 sm:text-sm">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-800/60 pb-2.5 last:border-0 last:pb-0 sm:gap-4 sm:pb-3">
      <dt className="text-muted-400">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950/40 p-2.5 sm:rounded-xl sm:p-4">
      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-lg font-semibold tabular-nums text-accent-700 sm:mt-2 sm:text-2xl">
        {value}
      </dd>
    </div>
  );
}

function EQSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-400 sm:text-[10px]">
          {label}
        </label>
        <span className="font-mono text-[10px] tabular-nums text-muted-400 sm:text-xs">
          {value > 0 ? "+" : ""}
          {value.toFixed(1)} dB
        </span>
      </div>
      <input
        type="range"
        min={-12}
        max={12}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full accent-accent-400"
      />
    </div>
  );
}

function DangerButton({
  label,
  confirmText,
  onConfirm,
  disabled,
}: {
  label: string;
  confirmText: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => {
        if (confirm(confirmText)) onConfirm();
      }}
      disabled={disabled}
      className="rounded-full border border-crimson-500/50 px-4 py-2 text-xs font-medium text-crimson-500 transition-colors hover:bg-crimson-500/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:px-5 sm:py-2.5 sm:text-sm"
    >
      {label}
    </button>
  );
}

function favToAnime(f: {
  id: number;
  title: string;
  cover: string | null;
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
}): Anime {
  return {
    id: f.id,
    title: { romaji: f.title, english: null, native: null },
    coverImage: { extraLarge: f.cover, large: f.cover, color: null },
    bannerImage: null,
    description: null,
    averageScore: f.averageScore,
    episodes: null,
    status: null,
    seasonYear: f.seasonYear,
    genres: [],
    format: f.format,
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.029.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}
