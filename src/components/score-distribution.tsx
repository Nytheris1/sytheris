"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ScoreBucket, RankingEntry } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

interface ScoreDistributionProps {
  scores: ScoreBucket[];
  meanScore: number | null;
  rankings: RankingEntry[];
}

const RANKING_TYPE_LABELS: Record<string, string> = {
  RATED: "Puanlanmış",
  POPULAR: "Popüler",
};

const RANKING_CONTEXT_LABELS: Record<string, string> = {
  "highest-rated": "en yüksek puanlı",
  popular: "en popüler",
};

export function ScoreDistribution({
  scores,
  meanScore,
  rankings,
}: ScoreDistributionProps) {
  const reduced = useReducedMotion();

  /* Sıfır barları temizle, 10-100 arasını tut */
  const buckets = scores
    .filter((s) => s.score >= 10 && s.score <= 100 && s.amount > 0)
    .sort((a, b) => a.score - b.score);

  const total = buckets.reduce((sum, b) => sum + b.amount, 0);
  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);

  if (buckets.length === 0) return null;

  /* Top-5 sıralamayı öne çıkar */
  const topRankings = rankings
    .filter((r) => r.rank <= 100)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-900/30 p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
        <div>
          <h3 className="font-display text-sm font-semibold tracking-tight text-cream-50 sm:text-base">
            <span className="mr-2 inline-block h-3.5 w-0.5 -translate-y-0.5 rounded-full bg-accent-400 align-middle sm:h-4 sm:w-1" />
            Puan dağılımı
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-400">
            {total.toLocaleString("tr-TR")} kullanıcı oyladı
          </p>
        </div>
        {meanScore != null && (
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
              Ortalama
            </p>
            <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-accent-700 sm:text-3xl">
              {meanScore}
            </p>
          </div>
        )}
      </header>

      {/* Histogram */}
      <div className="flex h-32 items-end gap-1 sm:h-40 sm:gap-1.5">
        {buckets.map((b, i) => {
          const pct = (b.amount / maxAmount) * 100;
          const isPeak = b.amount === maxAmount;
          return (
            <div
              key={b.score}
              className="group/bar relative flex flex-1 flex-col items-center"
              title={`${b.score} puan · ${b.amount.toLocaleString("tr-TR")} oy`}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{
                  duration: reduced ? 0 : 0.55,
                  delay: reduced ? 0 : i * 0.015,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "w-full rounded-t-sm transition-colors",
                  isPeak
                    ? "bg-accent-400 group-hover/bar:bg-accent-300"
                    : "bg-accent-400/60 group-hover/bar:bg-accent-400",
                )}
              />
              <span
                className={cn(
                  "mt-1 font-mono text-[9px] tabular-nums transition-colors",
                  isPeak
                    ? "font-semibold text-accent-700"
                    : "text-muted-400 group-hover/bar:text-cream-200",
                )}
              >
                {b.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sıralamalar */}
      {topRankings.length > 0 && (
        <div className="mt-5 border-t border-ink-800 pt-4">
          <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-400 sm:text-[10px]">
            Sıralamalar
          </p>
          <div className="flex flex-wrap gap-2">
            {topRankings.map((r, i) => (
              <RankingBadge key={i} ranking={r} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function RankingBadge({ ranking }: { ranking: RankingEntry }) {
  const typeLabel =
    RANKING_TYPE_LABELS[ranking.type] ?? ranking.type;
  const contextLabel =
    RANKING_CONTEXT_LABELS[ranking.context] ?? ranking.context;

  /* Kapsamı belirle: allTime / yıl / sezon */
  const scope = (() => {
    if (ranking.allTime) return "tüm zamanlar";
    if (ranking.year && ranking.season) {
      const seasonMap: Record<string, string> = {
        WINTER: "Kış",
        SPRING: "İlkbahar",
        SUMMER: "Yaz",
        FALL: "Sonbahar",
      };
      return `${seasonMap[ranking.season] ?? ranking.season} ${ranking.year}`;
    }
    if (ranking.year) return `${ranking.year}`;
    return "";
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
        ranking.rank <= 10
          ? "border-accent-400/50 bg-accent-400/[0.08]"
          : "border-ink-800 bg-ink-900/40",
      )}
    >
      <span
        className={cn(
          "font-display text-sm font-bold tabular-nums",
          ranking.rank <= 10 ? "text-accent-700" : "text-cream-200",
        )}
      >
        #{ranking.rank}
      </span>
      <span className="text-cream-200">
        {typeLabel}
        {scope && ` · ${scope}`}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-400">
        {contextLabel}
      </span>
    </span>
  );
}