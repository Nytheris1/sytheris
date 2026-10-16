"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/components/audio-provider";
import { cn } from "@/lib/utils";

const BARS = 32;

export function AudioVisualizer({
  height = 56,
  className,
}: {
  height?: number;
  className?: string;
}) {
  const { analyser, enabled } = useAudio();
  const rafRef = useRef<number | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const bars = barRefs.current;

    if (!analyser || !enabled) {
      bars.forEach((b) => {
        if (b) b.style.transform = "scaleY(0.12)";
      });
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);

      // Logaritmik gruplama — insan kulağına daha doğal
      const step = Math.max(1, Math.floor(data.length / BARS));
      for (let i = 0; i < BARS; i++) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < step; j++) {
          const idx = i * step + j;
          if (idx >= data.length) break;
          sum += data[idx];
          count++;
        }
        const avg = count > 0 ? sum / count : 0;
        // 0..255 → 0.12..1.0 arası ölçek
        const scale = Math.max(0.12, Math.min(1, (avg / 255) * 1.25));
        const bar = bars[i];
        if (bar) bar.style.transform = `scaleY(${scale})`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, enabled]);

  return (
    <div
      className={cn("flex items-end gap-[3px]", className)}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <div key={i} className="relative flex-1" style={{ height: "100%" }}>
          <div
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 origin-bottom rounded-sm transition-transform duration-75",
              enabled ? "bg-accent-400" : "bg-ink-700",
            )}
            style={{
              height: "100%",
              transform: "scaleY(0.12)",
            }}
          />
        </div>
      ))}
    </div>
  );
}