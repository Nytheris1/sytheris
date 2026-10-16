"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useLibrary } from "@/lib/user-data";
import type { LibraryEntry } from "@/lib/user-data";
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

interface WrappedStats {
  total: number;
  completed: number;
  watching: number;
  dropped: number;
  planned: number;
  avgRating: number | null;
  ratedCount: number;
  topRated: LibraryEntry[];
  genreCounts: [string, number][];
  formatCounts: [string, number][];
  yearCounts: [number, number][];
  hasAnyData: boolean;
}

// ============================================================
// 1. 内部组件 (使用 useMemo 计算 stats，但不包含 useSearchParams)
// ============================================================
function WrappedContent() {
  const library = useLibrary();
  const [year, setYear] = useState(CURRENT_YEAR);

  const stats = useMemo<WrappedStats>(() => {
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    const inYear = library.filter((l) => {
      const ts = l.completedAt ?? l.updatedAt;
      return ts >= start && ts < end;
    });

    if (inYear.length === 0) {
      return {
        total: 0,
        completed: 0,
        watching: 0,
        dropped: 0,
        planned: 0,
        avgRating: null,
        ratedCount: 0,
        topRated: [],
        genreCounts: [],
        formatCounts: [],
        yearCounts: [],
        hasAnyData: false,
      };
    }

    const completed = inYear.filter((l) => l.status === "completed");
    const watching = inYear.filter((l) => l.status === "watching");
    const dropped = inYear.filter((l) => l.status === "dropped");
    const planned = inYear.filter((l) => l.status === "planned");

    const rated = inYear.filter((l) => l.rating != null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, l) => sum + (l.rating ?? 0), 0) / rated.length
        : null;

    const topRated = [...rated]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 5);

    const genreMap = new Map<string, number>();
    for (const item of inYear) {
      if (item.genres && Array.isArray(item.genres)) {
        for (const g of item.genres) {
          genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
        }
      }
    }
    const genreCounts = Array.from(genreMap.entries()).sort(
      (a, b) => b[1] - a[1],
    );

    const formatMap = new Map<string, number>();
    for (const item of inYear) {
      if (item.format) {
        const label = FORMAT_LABELS[item.format] ?? item.format;
        formatMap.set(label, (formatMap.get(label) ?? 0) + 1);
      }
    }
    const formatCounts = Array.from(formatMap.entries()).sort(
      (a, b) => b[1] - a[1],
    );

    const yearMap = new Map<number, number>();
    for (const item of inYear) {
      if (item.seasonYear && item.seasonYear >= 1990) {
        yearMap.set(item.seasonYear, (yearMap.get(item.seasonYear) ?? 0) + 1);
      }
    }
    const yearCounts = Array.from(yearMap.entries()).sort(
      (a, b) => b[0] - a[0],
    );

    return {
      total: inYear.length,
      completed: completed.length,
      watching: watching.length,
      dropped: dropped.length,
      planned: planned.length,
      avgRating,
      ratedCount: rated.length,
      topRated,
      genreCounts,
      formatCounts,
      yearCounts,
      hasAnyData: true,
    };
  }, [library, year]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <PageHeader
        eyebrow="Yıl özeti"
        title={`${year} yılında ne izledim?`}
        description={
          stats.hasAnyData
            ? `${stats.total} anime bu yıl kitaplığına girdi.`
            : "Bu yıl için henüz kayıt yok."
        }
        actions={
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-full border border-ink-700 bg-ink-950 px-4 py-2 text-sm text-cream-50 focus:border-accent-400 focus:outline-none"
            aria-label="Yıl seç"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        }
      />

      {!stats.hasAnyData ? (
        <EmptyState
          icon="—"
          title={`${year} için veri yok`}
          description={`${year} yılında kitaplığına eklediğin bir anime bulunamadı. Başka bir yıl dene veya bu yıl animeleri işaretle.`}
          action={{ href: "/search", label: "Anime ara" }}
        />
      ) : (
        <div className="space-y-12 md:space-y-16">
          <section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <BigStat label="Toplam anime" value={stats.total} accent delay={0} />
              <BigStat label="Tamamlanan" value={stats.completed} delay={0.05} />
              <BigStat label="Devam eden" value={stats.watching} delay={0.1} />
              <BigStat
                label="Ortalama puan"
                value={stats.avgRating != null ? stats.avgRating.toFixed(1) : "—"}
                suffix={stats.avgRating != null ? "/10" : undefined}
                delay={0.15}
              />
            </div>
            {stats.ratedCount > 0 && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400">
                {stats.ratedCount} anime puanladın
              </p>
            )}
          </section>

          {stats.topRated.length > 0 && (
            <section>
              <SectionHeading>Bu yılın en yüksek puanlıları</SectionHeading>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-5">
                {stats.topRated.map((item, i) => (
                  <TopRatedCard key={item.id} item={item} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {stats.genreCounts.length > 0 && (
            <section>
              <SectionHeading>En çok izlediğin türler</SectionHeading>
              <div className="mt-6 space-y-2.5">
                {stats.genreCounts.slice(0, 8).map(([genre, count], i) => {
                  const max = stats.genreCounts[0][1];
                  const pct = (count / max) * 100;
                  return (
                    <motion.div
                      key={genre}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-24 shrink-0 truncate text-xs text-cream-200 sm:w-32 sm:text-sm">
                        {genre}
                      </span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-ink-800/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.04 + 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="h-full rounded-md bg-accent-400"
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-muted-400 sm:text-sm">
                        {count}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {stats.formatCounts.length > 0 && (
            <section>
              <SectionHeading>Format dağılımı</SectionHeading>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {stats.formatCounts.map(([format, count], i) => (
                  <motion.div
                    key={format}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="rounded-xl border border-ink-800 bg-ink-900/40 p-4"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400">
                      {format}
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-accent-700 sm:text-3xl">
                      {count}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {stats.yearCounts.length > 0 && (
            <section>
              <SectionHeading>İzlediğin animelerin çıkış yılları</SectionHeading>
              <div className="mt-6 flex h-40 items-end gap-1 sm:h-48 sm:gap-1.5">
                {stats.yearCounts
                  .slice()
                  .sort((a, b) => a[0] - b[0])
                  .map(([y, count], i) => {
                    const max = Math.max(...stats.yearCounts.map(([, c]) => c));
                    const pct = (count / max) * 100;
                    const isCurrentYear = y === year;
                    return (
                      <div
                        key={y}
                        className="group/bar relative flex flex-1 flex-col items-center"
                        title={`${y} · ${count} anime`}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{
                            duration: 0.5,
                            delay: i * 0.02,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={cn(
                            "w-full rounded-t-sm transition-colors",
                            isCurrentYear
                              ? "bg-accent-400 group-hover/bar:bg-accent-300"
                              : "bg-accent-400/50 group-hover/bar:bg-accent-400/80",
                          )}
                        />
                        {stats.yearCounts.length <= 15 && (
                          <span
                            className={cn(
                              "mt-1 font-mono text-[9px] tabular-nums transition-colors",
                              isCurrentYear
                                ? "font-semibold text-accent-700"
                                : "text-muted-400 group-hover/bar:text-cream-200",
                            )}
                          >
                            {y}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900/60 to-ink-900/20 p-6 text-center sm:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-700">
              Özet
            </p>
            <p className="mx-auto mt-3 max-w-2xl font-display text-lg font-semibold leading-relaxed tracking-tight text-cream-50 sm:text-xl">
              {stats.total} anime ·{" "}
              {stats.avgRating != null
                ? `ortalama ${stats.avgRating.toFixed(1)}/10`
                : "henüz puan yok"}
            </p>
            <p className="mt-2 text-sm text-muted-400">
              {year} boyunca izlediklerinin özeti
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/settings"
                className="rounded-full bg-accent-400 px-5 py-2.5 text-sm font-semibold text-night-950 transition-colors hover:bg-accent-500"
              >
                Kitaplığı gör
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-ink-600 px-5 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50"
              >
                Yeni anime ekle
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

// ============================================================
// 2. 默认导出 — 用 Suspense 包裹
// ============================================================
export default function WrappedPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
          <div className="h-8 w-64 animate-pulse rounded bg-ink-800" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-ink-800/60" />
        </main>
      }
    >
      <WrappedContent />
    </Suspense>
  );
}

// ============================================================
// 3. 辅助组件 (不变)
// ============================================================
function BigStat({
  label,
  value,
  suffix,
  accent,
  delay = 0,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-xl border p-4 sm:rounded-2xl sm:p-6",
        accent
          ? "border-accent-400/40 bg-accent-400/[0.06]"
          : "border-ink-800 bg-ink-900/40",
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-semibold tabular-nums sm:text-4xl md:text-5xl",
          accent ? "text-accent-700" : "text-cream-50",
        )}
      >
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-muted-400 sm:text-base">
            {suffix}
          </span>
        )}
      </p>
    </motion.div>
  );
}

function TopRatedCard({ item, rank }: { item: LibraryEntry; rank: number }) {
  const cover = item.cover;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: rank * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      <Link href={`/anime/${item.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] bg-ink-800 ring-1 ring-inset ring-ink-700/60 transition-all group-hover:-translate-y-1 group-hover:ring-accent-400 group-hover:shadow-xl">
          {cover && (
            <Image
              src={cover}
              alt={item.title}
              fill
              quality={85}
              sizes="(max-width: 640px) 45vw, 20vw"
              className="object-cover"
            />
          )}
          <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-400 font-display text-sm font-bold text-night-950 shadow-md">
            {rank}
          </div>
          {item.rating != null && (
            <div className="absolute right-2 top-2 rounded-full bg-night-950/85 px-2 py-1 text-[11px] font-semibold text-accent-400 backdrop-blur-sm">
              ★ {item.rating}
            </div>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-cream-50 transition-colors group-hover:text-accent-700">
          {item.title}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
          {item.seasonYear ?? "—"} · {item.format ?? "—"}
        </p>
      </Link>
    </motion.div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
      <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
      {children}
    </h2>
  );
}