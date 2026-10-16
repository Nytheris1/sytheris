"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AnimeCard } from "@/components/anime-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { anilistRequest } from "@/lib/anilist/client";
import { SEARCH_ANIME, GENRE_COLLECTION } from "@/lib/anilist/queries";
import {
  useSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  POPULAR_SEARCHES,
} from "@/lib/search-history";
import type { Anime, Page } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

const FORMATS = [
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Film" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Özel" },
];

const SORTS = [
  { value: "POPULARITY_DESC", label: "Popülerlik" },
  { value: "SCORE_DESC", label: "Puan" },
  { value: "TRENDING_DESC", label: "Trend" },
  { value: "START_DATE_DESC", label: "En yeni" },
];

const YEARS = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchFallback() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <PageHeader
        eyebrow="Ara"
        title="Katalogda ara"
        description="Filtreleri yükleniyor…"
      />
    </main>
  );
}

function SearchPageInner() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialGenres = searchParams.getAll("genre");
  const initialYearParam = searchParams.get("year");
  const initialYear: number | "" = initialYearParam ? Number(initialYearParam) : "";
  const initialFormats = searchParams.getAll("format");
  const initialSort = searchParams.get("sort") ?? "POPULARITY_DESC";

  const [query, setQuery] = useState(initialQuery);
  const [genres, setGenres] = useState<string[]>(initialGenres);
  const [year, setYear] = useState<number | "">(initialYear);
  const [formats, setFormats] = useState<string[]>(initialFormats);
  const [sort, setSort] = useState(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(
    initialGenres.length > 0 || initialYear !== "" || initialFormats.length > 0,
  );

  const searchHistory = useSearchHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  /* URL senkron */
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    genres.forEach((g) => params.append("genre", g));
    if (year !== "") params.set("year", String(year));
    formats.forEach((f) => params.append("format", f));
    if (sort !== "POPULARITY_DESC") params.set("sort", sort);

    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genres, year, formats, sort]);

  /* Arama kaydı — 1.5 saniye bekleyince kaydet */
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;
    const t = setTimeout(() => {
      addSearchHistory(trimmed);
    }, 1500);
    return () => clearTimeout(t);
  }, [query]);

  const genreList = useQuery({
    queryKey: ["genre-collection"],
    queryFn: ({ signal }) =>
      anilistRequest<{ GenreCollection: string[] }>(GENRE_COLLECTION, {}, { signal }),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const variables = useMemo(
    () => ({
      page: 1,
      perPage: 40,
      search: query.trim() || undefined,
      genre_in: genres.length ? genres : undefined,
      seasonYear: year === "" ? undefined : year,
      format_in: formats.length ? formats : undefined,
      sort: [sort],
    }),
    [query, genres, year, formats, sort],
  );

  const hasAnyFilter =
    query.trim().length > 0 ||
    genres.length > 0 ||
    year !== "" ||
    formats.length > 0;

  const results = useQuery({
    queryKey: ["search", variables],
    enabled: hasAnyFilter,
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(SEARCH_ANIME, variables, { signal }),
  });

  const items = results.data?.Page.media ?? [];
  const total = results.data?.Page.pageInfo.total ?? 0;

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (query.trim()) {
      chips.push({
        key: "q",
        label: `"${query.trim()}"`,
        onRemove: () => setQuery(""),
      });
    }
    genres.forEach((g) =>
      chips.push({
        key: `g-${g}`,
        label: g,
        onRemove: () => setGenres((prev) => prev.filter((x) => x !== g)),
      }),
    );
    if (year !== "") {
      chips.push({
        key: `y-${year}`,
        label: String(year),
        onRemove: () => setYear(""),
      });
    }
    formats.forEach((f) =>
      chips.push({
        key: `f-${f}`,
        label: FORMATS.find((x) => x.value === f)?.label ?? f,
        onRemove: () => setFormats((prev) => prev.filter((x) => x !== f)),
      }),
    );
    return chips;
  }, [query, genres, year, formats]);

  function clearAll() {
    setQuery("");
    setGenres([]);
    setYear("");
    setFormats([]);
    setSort("POPULARITY_DESC");
  }

  function pickPopular(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <PageHeader
        eyebrow="Ara"
        title="Katalogda <em>ara</em>"
        description="Tür, yıl ve formata göre filtrele; puan veya popülerliğe göre sırala."
      />

      {/* Sticky arama ve kontroller */}
      <div className="sticky top-[68px] z-30 -mx-4 bg-ink-950/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Anime adı yaz…"
            className="w-full rounded-2xl border border-ink-700 bg-ink-900 px-5 py-3.5 pr-12 text-base text-cream-50 placeholder:text-muted-500 transition-colors focus:border-accent-400 focus:outline-none sm:py-4"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Aramayı temizle"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-400 transition-colors hover:text-cream-50"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
              filtersOpen
                ? "border-accent-400 text-accent-700"
                : "border-ink-700 text-cream-50 hover:border-ink-600",
            )}
            aria-expanded={filtersOpen}
          >
            Filtreler
            {activeChips.length > 0 && (
              <span className="ml-2 rounded-full bg-accent-400/15 px-2 py-0.5 text-[10px] text-accent-700 sm:text-xs">
                {activeChips.length}
              </span>
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-ink-700 bg-ink-900 px-3.5 py-1.5 text-xs text-cream-50 transition-colors focus:border-accent-400 focus:outline-none sm:px-4 sm:py-2 sm:text-sm"
            aria-label="Sıralama"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {hasAnyFilter && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-400 transition-colors hover:text-cream-50 sm:text-sm"
            >
              Temizle
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {activeChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={chip.onRemove}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-0.5 text-[11px] text-accent-700 transition-colors hover:border-accent-400 hover:bg-accent-400/15"
                  >
                    <span>{chip.label}</span>
                    <span className="text-accent-700/60 transition-colors group-hover:text-accent-700">
                      ✕
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filtre paneli */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-7 rounded-2xl border border-ink-800 bg-ink-900/50 p-5 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                  Türler
                </h3>
                {genreList.isPending ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-6 w-16 animate-pulse rounded-full bg-ink-800"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(genreList.data?.GenreCollection ?? []).map((g) => {
                      const active = genres.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() =>
                            setGenres((prev) =>
                              prev.includes(g)
                                ? prev.filter((x) => x !== g)
                                : [...prev, g],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            active
                              ? "border-accent-400 bg-accent-400/10 text-accent-700"
                              : "border-ink-700 text-cream-200 hover:border-ink-600",
                          )}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                    Yıl
                  </h3>
                  <select
                    value={year}
                    onChange={(e) =>
                      setYear(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-3 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-cream-50 transition-colors focus:border-accent-400 focus:outline-none sm:w-40"
                  >
                    <option value="">Hepsi</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
                    Format
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FORMATS.map((f) => {
                      const active = formats.includes(f.value);
                      return (
                        <button
                          key={f.value}
                          onClick={() =>
                            setFormats((prev) =>
                              prev.includes(f.value)
                                ? prev.filter((x) => x !== f.value)
                                : [...prev, f.value],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            active
                              ? "border-accent-400 bg-accent-400/10 text-accent-700"
                              : "border-ink-700 text-cream-200 hover:border-ink-600",
                          )}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* İçerik */}
      {!hasAnyFilter ? (
        <DiscoverState
          history={searchHistory}
          onPick={pickPopular}
          onClearHistory={clearSearchHistory}
          onRemoveHistory={removeSearchHistory}
        />
      ) : (
        <>
          <div className="mt-8 mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {results.isPending ? (
                <span className="text-muted-400">Aranıyor…</span>
              ) : results.isError ? (
                "Hata"
              ) : total > 0 ? (
                <>
                  <span className="text-accent-700">
                    {total.toLocaleString("tr-TR")}
                  </span>{" "}
                  sonuç
                </>
              ) : (
                "Sonuç yok"
              )}
            </h2>
          </div>

          {results.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] w-full animate-pulse rounded-[var(--radius-card)] bg-ink-800" />
                  <div className="mt-3 h-3.5 w-4/5 animate-pulse rounded bg-ink-800" />
                  <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-ink-800/70" />
                </div>
              ))}
            </div>
          ) : results.isError ? (
            <EmptyState
              icon="alert"
              title="Sonuçlar alınamadı"
              description={(results.error as Error).message}
              action={{ onClick: () => results.refetch(), label: "Tekrar dene" }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon="search"
              title="Eşleşen anime bulunamadı"
              description="Filtreleri gevşetmeyi veya farklı bir isim denemeyi düşün."
              action={
                hasAnyFilter
                  ? { onClick: clearAll, label: "Filtreleri temizle" }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
              {items.map((anime, i) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  index={i}
                  expandOnHover={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

/* ============================================================
   Keşfetme ekranı — arama boşken gösterilir
   ============================================================ */
function DiscoverState({
  history,
  onPick,
  onClearHistory,
  onRemoveHistory,
}: {
  history: string[];
  onPick: (term: string) => void;
  onClearHistory: () => void;
  onRemoveHistory: (term: string) => void;
}) {
  return (
    <div className="mt-10 space-y-12">
      {/* Son aramalar */}
      {history.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent-700">
                Geçmiş
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-cream-50">
                Son aramalar
              </h2>
            </div>
            <button
              onClick={onClearHistory}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400 transition-colors hover:text-crimson-500"
            >
              temizle
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {history.map((term) => (
              <div
                key={term}
                className="group inline-flex items-center overflow-hidden rounded-full border border-ink-700 bg-ink-900/40 transition-colors hover:border-accent-400"
              >
                <button
                  onClick={() => onPick(term)}
                  className="pl-3.5 pr-2 py-2 text-sm text-cream-200 transition-colors group-hover:text-accent-700"
                >
                  {term}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHistory(term);
                  }}
                  className="pr-3 pl-1 py-2 text-muted-400 transition-colors hover:text-crimson-500"
                  aria-label={`"${term}" aramasını kaldır`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popüler aramalar */}
      <section>
        <div className="mb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent-700">
            Popüler
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-cream-50">
            Bu aralar konuşulanlar
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((term, i) => (
            <motion.button
              key={term}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onPick(term)}
              className="rounded-full border border-ink-700 bg-ink-900/40 px-4 py-2 text-sm text-cream-200 transition-all hover:-translate-y-0.5 hover:border-accent-400 hover:bg-accent-400/5 hover:text-accent-700"
            >
              {term}
            </motion.button>
          ))}
        </div>
      </section>

      {/* İpucu */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/30 p-6 text-sm text-muted-400">
        <p>
          <span className="text-cream-50">İpucu:</span> Klavyeden{" "}
          <kbd className="rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 font-mono text-[10px] text-cream-200">
            ⌘K
          </kbd>{" "}
          veya{" "}
          <kbd className="rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 font-mono text-[10px] text-cream-200">
            Ctrl+K
          </kbd>{" "}
          ile her yerden hızlıca arama yapabilirsin.
        </p>
      </div>
    </div>
  );
}