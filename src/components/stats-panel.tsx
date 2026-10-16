"use client";

import { useMemo } from "react";
import { useFavorites, useLibrary } from "@/lib/user-data";
import type { LibraryEntry, FavoriteEntry, WatchStatus } from "@/lib/user-data";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/user-data";
import { cn } from "@/lib/utils";

const MONTH_ORDER = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function StatsPanel() {
  const favorites = useFavorites();
  const library = useLibrary();

  const stats = useMemo(() => computeStats(favorites, library), [favorites, library]);

  if (stats.total === 0) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-900/30 p-8 text-center sm:p-12">
        <p className="font-display text-lg font-semibold tracking-tight text-cream-50">
          Henüz istatistik için veri yok.
        </p>
        <p className="mt-2 text-sm text-muted-400">
          Birkaç animeyi kitaplığına ekle, puan ver; burada özetini göreceksin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <SummaryCard label="Toplam anime" value={stats.total} accent />
        <SummaryCard label="İzledim" value={stats.byStatus.completed} />
        <SummaryCard label="İzliyorum" value={stats.byStatus.watching} />
        <SummaryCard
          label="Ortalama puan"
          value={stats.avgRating != null ? stats.avgRating.toFixed(1) : "—"}
          suffix={stats.avgRating != null ? "/10" : undefined}
        />
      </div>

      {/* Durum dağılımı */}
      <Section title="Durum dağılımı" description={`${stats.total} kayıt`}>
        <div className="space-y-2.5">
          {STATUS_ORDER.map((s) => {
            const count = stats.byStatus[s];
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <BarRow
                key={s}
                label={STATUS_LABELS[s]}
                count={count}
                percent={pct}
              />
            );
          })}
        </div>
      </Section>

      {/* Puan dağılımı — sadece puanlı kayıtlar varsa */}
      {stats.ratingCount > 0 && (
        <Section
          title="Puan dağılımı"
          description={`${stats.ratingCount} anime puanlanmış · ortalama ${stats.avgRating?.toFixed(1)}`}
        >
          <div className="space-y-2">
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => {
              const count = stats.byRating[n] ?? 0;
              const pct =
                stats.ratingCount > 0 ? (count / stats.ratingCount) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-muted-400">
                    {n}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-ink-800/50">
                    <div
                      className="h-full rounded bg-accent-400 transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-[10px] tabular-nums text-muted-400">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Yıllara göre */}
      {stats.byYear.length > 0 && (
        <Section title="Yıllara göre" description="Kitaplığındaki animelerin yayın yılları">
          <div className="space-y-2">
            {stats.byYear.slice(0, 10).map(([year, count]) => {
              const max = Math.max(...stats.byYear.map(([, c]) => c));
              const pct = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={year} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-muted-400">
                    {year}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-ink-800/50">
                    <div
                      className="h-full rounded bg-accent-400/70 transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-[10px] tabular-nums text-muted-400">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Format dağılımı */}
      {stats.byFormat.length > 0 && (
        <Section title="Formata göre" description="TV, film, OVA ve diğerleri">
          <div className="flex flex-wrap gap-2">
            {stats.byFormat.map(([format, count]) => (
              <span
                key={format}
                className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900/40 px-3 py-1.5 text-xs"
              >
                <span className="text-cream-200">{format}</span>
                <span className="rounded-full bg-accent-400/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-700">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ============================================================
   YARDIMCI BİLEŞENLER
   ============================================================ */
function SummaryCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 sm:p-4",
        accent
          ? "border-accent-400/40 bg-accent-400/[0.06]"
          : "border-ink-800 bg-ink-900/40",
      )}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-display text-xl font-semibold tabular-nums sm:mt-2 sm:text-3xl",
          accent ? "text-accent-700" : "text-cream-50",
        )}
      >
        {value}
        {suffix && (
          <span className="ml-0.5 text-xs font-normal text-muted-400 sm:text-sm">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-900/30 p-4 sm:p-6">
      <header className="mb-3.5 sm:mb-5">
        <h3 className="font-display text-sm font-semibold tracking-tight text-cream-50 sm:text-base md:text-lg">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-[11px] text-muted-400 sm:mt-1 sm:text-sm">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function BarRow({
  label,
  count,
  percent,
}: {
  label: string;
  count: number;
  percent: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 truncate text-xs text-cream-200 sm:w-24 sm:text-sm">
        {label}
      </span>
      <div className="h-5 flex-1 overflow-hidden rounded bg-ink-800/50">
        <div
          className="h-full rounded bg-accent-400 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
          aria-hidden
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-muted-400 sm:w-10 sm:text-sm">
        {count}
      </span>
    </div>
  );
}

/* ============================================================
   İSTATİSTİK HESAPLAMA
   ============================================================ */
interface ComputedStats {
  total: number;
  byStatus: Record<WatchStatus, number>;
  byRating: Record<number, number>;
  ratingCount: number;
  avgRating: number | null;
  byYear: [number, number][];
  byFormat: [string, number][];
}

function computeStats(
  favorites: FavoriteEntry[],
  library: LibraryEntry[],
): ComputedStats {
  /* Aynı animeyi iki kere saymamak için id ile birleştir.
     Favori + kütüphane birleşimi unique id'ler. */
  const map = new Map<number, LibraryEntry | FavoriteEntry>();

  for (const f of favorites) map.set(f.id, f);
  for (const l of library) map.set(l.id, l);

  const all = Array.from(map.values());

  const byStatus: Record<WatchStatus, number> = {
    watching: 0,
    planned: 0,
    completed: 0,
    dropped: 0,
  };

  const byRating: Record<number, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;

  const yearCount = new Map<number, number>();
  const formatCount = new Map<string, number>();

  for (const item of all) {
    /* Durum — sadece LibraryEntry'de var */
    if ("status" in item && item.status) {
      byStatus[item.status as WatchStatus] =
        (byStatus[item.status as WatchStatus] ?? 0) + 1;
    }

    /* Puan */
    if ("rating" in item && typeof item.rating === "number") {
      byRating[item.rating] = (byRating[item.rating] ?? 0) + 1;
      ratingSum += item.rating;
      ratingCount++;
    }

    /* Yıl */
    if (item.seasonYear && item.seasonYear >= 1990) {
      yearCount.set(item.seasonYear, (yearCount.get(item.seasonYear) ?? 0) + 1);
    }

    /* Format */
    if (item.format) {
      formatCount.set(item.format, (formatCount.get(item.format) ?? 0) + 1);
    }
  }

  const byYear = Array.from(yearCount.entries()).sort((a, b) => b[0] - a[0]);
  const byFormat = Array.from(formatCount.entries()).sort((a, b) => b[1] - a[1]);

  return {
    total: all.length,
    byStatus,
    byRating,
    ratingCount,
    avgRating: ratingCount > 0 ? ratingSum / ratingCount : null,
    byYear,
    byFormat,
  };
}