"use client";

import { motion } from "motion/react";
import { useAudio } from "@/components/audio-provider";
import { cn } from "@/lib/utils";

const BARS = [0, 1, 2, 3];

export function AudioToggle() {
  const { enabled, toggle } = useAudio();

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Müziği kapat" : "Müziği aç"}
      aria-pressed={enabled}
      title={enabled ? "Müziği kapat" : "Müziği aç"}
      className={cn(
        "group flex h-8 items-center gap-2 rounded-full border px-3 transition-colors",
        enabled
          ? "border-accent-400/60 bg-accent-400/10"
          : "border-ink-700 bg-ink-900/60 hover:border-ink-600",
      )}
    >
      <span className="flex h-3 items-end gap-[2px]">
        {BARS.map((i) =>
          enabled ? (
            <motion.span
              key={i}
              animate={{ height: [4, 12, 6, 11, 5] }}
              transition={{
                duration: 1.15,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
              className="block w-[2px] rounded-full bg-accent-400"
              style={{ height: 4 }}
            />
          ) : (
            <span
              key={i}
              className="block w-[2px] rounded-full bg-muted-400/70"
              style={{ height: 4 }}
            />
          ),
        )}
      </span>
      <span
        className={cn(
          "hidden font-mono text-[10px] uppercase tracking-[0.2em] transition-colors lg:inline",
          enabled ? "text-accent-700" : "text-muted-400",
        )}
      >
        {enabled ? "müzik" : "sessiz"}
      </span>
    </button>
  );
}