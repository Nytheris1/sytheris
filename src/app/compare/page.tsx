"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { SEARCH_ANIME, ANIME_DETAIL } from "@/lib/anilist/queries";
import type { Anime, AnimeDetail, Page } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "Kısa TV",
  MOVIE: "Film",
  SPECIAL: "Özel",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Müzik",
};

const STATUS_LABELS: Record<string, string> = {
  FINISHED: "Tamamlandı",
  RELEASING: "Yayında",
  NOT_YET_RELEASED: "Yakında",
  CANCELLED: "İptal edildi",
  HIATUS: "Arada",
};

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <ComparePageInner />
    </Suspense>
  );
}

function CompareFallback() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader
        eyebrow="Karşılaştır"
        title="İki animeyi yan yana"
        description="Yükleniyor…"
      />
    </main>
  );
}

function ComparePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const aParam = searchParams.get("a");
  const bParam = searchParams.get("b");

  const [a, setA] = useState<number | null>(aParam ? Number(aParam) : null);
  const [b, setB] = useState<number | null>(bParam ? Number(bParam) : null);

  /* URL senkron */
  useEffect(() => {
    const params = new URLSearchParams();
    if (a != null) params.set("a", String(a));
    if (b != null) params.set("b", String(b));
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b]);

  const detailA = useQuery({
    queryKey: ["anime-detail", a],
    enabled: a != null && Number.isFinite(a),
    queryFn: ({ signal }) =>
      anilistRequest<{ Media: AnimeDetail | null }>(
        ANIME_DETAIL,
        { id: a },
        { signal },
      ),
  });

  const detailB = useQuery({
    queryKey: ["anime-detail", b],
    enabled: b != null && Number.isFinite(b),
    queryFn: ({ signal }) =>
      anilistRequest<{ Media: AnimeDetail | null }>(
        ANIME_DETAIL,
        { id: b },
        { signal },
      ),
  });

  const animeA = detailA.data?.Media ?? null;
  const animeB = detailB.data?.Media ?? null;

  const bothSelected = a != null && b != null;
  const bothLoaded = animeA != null && animeB != null;

  function clearAll() {
    setA(null);
    setB(null);
  }

  function swap() {
    setA(b);
    setB(a);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <PageHeader
        eyebrow="Karşılaştır"
        title="İki animeyi yan yana"
        description="Her iki slota birer anime seç, özellikleri karşılaştır."
        actions={
          bothSelected ? (
            <div className="flex gap-2">
              <button
                onClick={swap}
                className="rounded-full border border-ink-600 px-4 py-2 text-xs font-medium text-cream-50 transition-colors hover:border-cream-50 sm:text-sm"
              >
                ⇄ Yer değiştir
              </button>
              <button
                onClick={clearAll}
                className="rounded-full border border-ink-600 px-4 py-2 text-xs font-medium text-cream-50 transition-colors hover:border-crimson-500 hover:text-crimson-500 sm:text-sm"
              >
                Temizle
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Slotlar */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <ComparePicker
          slotLabel="A"
          value={a}
          onSelect={(id) => setA(id)}
          onClear={() => setA(null)}
          anime={animeA}
          loading={detailA.isPending && a != null}
        />
        <ComparePicker
          slotLabel="B"
          value={b}
          onSelect={(id) => setB(id)}
          onClear={() => setB(null)}
          anime={animeB}
          loading={detailB.isPending && b != null}
        />
      </div>

      {/* Karşılaştırma tablosu */}
      {bothLoaded && animeA && animeB && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <ComparisonTable a={animeA} b={animeB} />
        </motion.div>
      )}
    </main>
  );
}

/* ============================================================
   Slot seçici
   ============================================================ */
function ComparePicker({
  slotLabel,
  value,
  onSelect,
  onClear,
  anime,
  loading,
}: {
  slotLabel: string;
  value: number | null;
  onSelect: (id: number) => void;
  onClear: () => void;
  anime: AnimeDetail | null;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setDebounced("");
      return;
    }
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const results = useQuery({
    queryKey: ["compare-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(
        SEARCH_ANIME,
        { page: 1, perPage: 8, search: debounced, sort: ["POPULARITY_DESC"] },
        { signal },
      ),
    staleTime: 60_000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* Seçildiğinde dropdown'ı kapat */
  useEffect(() => {
    if (value != null) {
      setOpen(false);
      setQuery("");
    }
  }, [value]);

  const items = results.data?.Page.media ?? [];

  return (
    <div ref={containerRef} className="relative">
      {/* Slot başlığı */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
          Slot {slotLabel}
        </span>
        {value != null && (
          <button
            onClick={onClear}
            className="text-[11px] text-muted-400 transition-colors hover:text-crimson-500"
          >
            Kaldır
          </button>
        )}
      </div>

      {/* Seçili anime kartı */}
      {loading ? (
        <div className="flex h-40 animate-pulse items-center gap-4 rounded-2xl border border-ink-800 bg-ink-900/30 p-4">
          <div className="h-32 w-24 shrink-0 rounded-xl bg-ink-800" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 rounded bg-ink-800" />
            <div className="h-4 w-1/3 rounded bg-ink-800/70" />
            <div className="h-4 w-2/3 rounded bg-ink-800/70" />
          </div>
        </div>
      ) : anime ? (
        <SelectedCard anime={anime} slotLabel={slotLabel} />
      ) : (
        <div className="relative">
          <div
            className={cn(
              "flex flex-col gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors",
              open
                ? "border-accent-400/60 bg-accent-400/[0.03]"
                : "border-ink-800 hover:border-ink-700",
            )}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-muted-400">
                ⌕
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Anime ara…"
                className="w-full bg-transparent text-sm text-cream-50 placeholder:text-muted-500 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                  aria-label="Temizle"
                  className="text-xs text-muted-400 hover:text-cream-50"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400">
              Yazmaya başla · en az 2 karakter
            </p>
          </div>

          {/* Sonuç dropdown */}
          <AnimatePresence>
            {open && debounced.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-ink-700 bg-ink-950 shadow-2xl"
              >
                {results.isPending ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-400">
                    Aranıyor…
                  </div>
                ) : items.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-400">
                    Sonuç bulunamadı
                  </div>
                ) : (
                  <ul className="py-1">
                    {items.map((anime) => {
                      const title = pickTitle(anime.title);
                      const cover =
                        anime.coverImage.large ?? anime.coverImage.extraLarge;
                      return (
                        <li key={anime.id}>
                          <button
                            onClick={() => onSelect(anime.id)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-ink-900"
                          >
                            <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-ink-800">
                              {cover && (
                                <Image
                                  src={cover}
                                  alt={title}
                                  fill
                                  quality={85}
                                  sizes="36px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-xs font-medium text-cream-50">
                                {title}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
                                {anime.seasonYear ?? "—"} · {anime.format ?? "—"}
                              </p>
                            </div>
                            {anime.averageScore != null && (
                              <span className="shrink-0 font-mono text-[10px] tabular-nums text-accent-700">
                                ★ {anime.averageScore}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Seçili anime kartı
   ============================================================ */
function SelectedCard({
  anime,
  slotLabel,
}: {
  anime: AnimeDetail;
  slotLabel: string;
}) {
  const title = pickTitle(anime.title);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

  return (
    <div className="flex gap-4 rounded-2xl border border-ink-800 bg-ink-900/40 p-4">
      <Link
        href={`/anime/${anime.id}`}
        className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-ink-700/60"
      >
        {cover && (
          <Image
            src={cover}
            alt={title}
            fill
            quality={90}
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-700">
          Slot {slotLabel}
        </p>
        <Link
          href={`/anime/${anime.id}`}
          className="mt-1 line-clamp-2 font-display text-lg font-semibold leading-tight tracking-tight text-cream-50 hover:text-accent-700"
        >
          {title}
        </Link>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
          {anime.seasonYear ?? "—"} ·{" "}
          {FORMAT_LABELS[anime.format ?? ""] ?? anime.format ?? "—"}
          {anime.episodes ? ` · ${anime.episodes} bölüm` : ""}
        </p>
        {anime.averageScore != null && (
          <p className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold tabular-nums text-accent-700">
              {anime.averageScore}
            </span>
            <span className="text-xs text-muted-400">/ 100</span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Karşılaştırma tablosu
   ============================================================ */
function ComparisonTable({ a, b }: { a: AnimeDetail; b: AnimeDetail }) {
  const reduced = useReducedMotion();

  const rows: {
    label: string;
    a: string | number | null;
    b: string | number | null;
    aRaw?: number | null;
    bRaw?: number | null;
    higherIsBetter?: boolean;
  }[] = [
    {
      label: "Ortalama puan",
      a: a.averageScore != null ? `${a.averageScore}` : "—",
      b: b.averageScore != null ? `${b.averageScore}` : "—",
      aRaw: a.averageScore,
      bRaw: b.averageScore,
      higherIsBetter: true,
    },
    {
      label: "Popülerlik",
      a: a.popularity?.toLocaleString("tr-TR") ?? "—",
      b: b.popularity?.toLocaleString("tr-TR") ?? "—",
      aRaw: a.popularity,
      bRaw: b.popularity,
      higherIsBetter: true,
    },
    {
      label: "Favori",
      a: a.favourites?.toLocaleString("tr-TR") ?? "—",
      b: b.favourites?.toLocaleString("tr-TR") ?? "—",
      aRaw: a.favourites,
      bRaw: b.favourites,
      higherIsBetter: true,
    },
    {
      label: "Bölüm",
      a: a.episodes ?? "—",
      b: b.episodes ?? "—",
      aRaw: a.episodes,
      bRaw: b.episodes,
      higherIsBetter: true,
    },
    {
      label: "Bölüm süresi",
      a: a.duration ? `${a.duration} dk` : "—",
      b: b.duration ? `${b.duration} dk` : "—",
    },
    {
      label: "Toplam süre",
      a:
        a.episodes && a.duration
          ? `${Math.round((a.episodes * a.duration) / 60)} saat`
          : "—",
      b:
        b.episodes && b.duration
          ? `${Math.round((b.episodes * b.duration) / 60)} saat`
          : "—",
    },
    {
      label: "Yayın yılı",
      a: a.seasonYear ?? "—",
      b: b.seasonYear ?? "—",
      aRaw: a.seasonYear,
      bRaw: b.seasonYear,
    },
    {
      label: "Format",
      a: FORMAT_LABELS[a.format ?? ""] ?? a.format ?? "—",
      b: FORMAT_LABELS[b.format ?? ""] ?? b.format ?? "—",
    },
    {
      label: "Durum",
      a: STATUS_LABELS[a.status ?? ""] ?? a.status ?? "—",
      b: STATUS_LABELS[b.status ?? ""] ?? b.status ?? "—",
    },
    {
      label: "Stüdyo",
      a: a.studios.nodes[0]?.name ?? "—",
      b: b.studios.nodes[0]?.name ?? "—",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/30">
      <header className="border-b border-ink-800 px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
          Karşılaştırma
        </h2>
        <p className="mt-1 text-xs text-muted-400 sm:text-sm">
          Yüksek olan değerler yeşil vurgulanır.
        </p>
      </header>

      <div className="divide-y divide-ink-800">
        {rows.map((row, i) => {
          const aBetter =
            row.higherIsBetter &&
            row.aRaw != null &&
            row.bRaw != null &&
            row.aRaw > row.bRaw;
          const bBetter =
            row.higherIsBetter &&
            row.aRaw != null &&
            row.bRaw != null &&
            row.bRaw > row.aRaw;

          return (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0 : 0.25,
                delay: reduced ? 0 : Math.min(i * 0.03, 0.3),
              }}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4"
            >
              {/* A tarafı */}
              <div className="text-right">
                <p
                  className={cn(
                    "truncate font-mono text-xs tabular-nums sm:text-sm",
                    aBetter ? "font-semibold text-accent-700" : "text-cream-100",
                  )}
                >
                  {row.a}
                </p>
              </div>

              {/* Etiket */}
              <div className="w-24 shrink-0 text-center sm:w-32">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
                  {row.label}
                </p>
              </div>

              {/* B tarafı */}
              <div className="text-left">
                <p
                  className={cn(
                    "truncate font-mono text-xs tabular-nums sm:text-sm",
                    bBetter ? "font-semibold text-accent-700" : "text-cream-100",
                  )}
                >
                  {row.b}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Türler */}
        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-3 sm:gap-6 sm:px-6 sm:py-5">
          <div className="flex flex-wrap justify-end gap-1.5">
            {a.genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="rounded-full border border-ink-700 bg-ink-900/60 px-2.5 py-0.5 text-[10px] text-cream-200"
              >
                {g}
              </span>
            ))}
          </div>
          <div className="text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
              Türler
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {b.genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="rounded-full border border-ink-700 bg-ink-900/60 px-2.5 py-0.5 text-[10px] text-cream-200"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}