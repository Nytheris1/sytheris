"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useRewatchCount,
  incrementRewatch,
  decrementRewatch,
  resetRewatch,
} from "@/lib/user-data";
import { cn } from "@/lib/utils";

export function RewatchCounter({ animeId }: { animeId: number }) {
  const count = useRewatchCount(animeId);
  const reduced = useReducedMotion();

  return (
    <div className="mt-5 border-t border-ink-800 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
          İzleme sayısı
        </h3>
        {count > 0 && (
          <button
            onClick={() => resetRewatch(animeId)}
            className="text-[10px] text-muted-400 transition-colors hover:text-crimson-500"
          >
            sıfırla
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => decrementRewatch(animeId)}
          disabled={count === 0}
          aria-label="Bir azalt"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors",
            count === 0
              ? "cursor-not-allowed border-ink-800 text-muted-500 opacity-40"
              : "border-ink-700 text-cream-200 hover:border-ink-600 hover:bg-ink-900",
          )}
        >
          −
        </button>

        <div className="flex min-w-[64px] flex-col items-center">
          <motion.span
            key={count}
            initial={reduced ? undefined : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "font-display text-2xl font-semibold tabular-nums",
              count > 0 ? "text-accent-700" : "text-muted-400",
            )}
          >
            {count}
          </motion.span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-400">
            {count === 0
              ? "henüz"
              : count === 1
                ? "kez izlendi"
                : "kez izlendi"}
          </span>
        </div>

        <button
          onClick={() => incrementRewatch(animeId)}
          aria-label="Bir arttır"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700 text-sm text-cream-200 transition-colors hover:border-ink-600 hover:bg-ink-900"
        >
          +
        </button>

        {count > 0 && (
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-accent-700">
            {count >= 3 ? "★ favori klasiği" : count >= 2 ? "tekrar izlendi" : ""}
          </span>
        )}
      </div>
    </div>
  );
}