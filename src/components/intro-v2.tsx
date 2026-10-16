"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { anilistRequest } from "@/lib/anilist/client";
import { TRENDING_ANIME } from "@/lib/anilist/queries";
import type { Anime, Page } from "@/lib/anilist/types";
import { useTheme } from "@/lib/theme";
import { useAudio } from "@/components/audio-provider";

const TOTAL_MS = 6200;
const BRAND = "SYTHERIS";
const LETTERS = BRAND.split("");
const COLUMN_COUNT = 6;

type Scene = "curtain" | "reveal" | "title" | "exit";

export function IntroV2() {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const { enable: enableAudio } = useAudio();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);
  const [scene, setScene] = useState<Scene>("curtain");
  const [progress, setProgress] = useState(0);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data } = useQuery({
    queryKey: ["intro-trending"],
    enabled: mounted && show,
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: Page<Anime> }>(
        TRENDING_ANIME,
        { page: 1, perPage: 36 },
        { signal },
      ),
    staleTime: 30 * 60 * 1000,
  });

  const covers = useMemo(() => {
    const items = data?.Page.media ?? [];
    return items
      .map((a) => a.coverImage.extraLarge ?? a.coverImage.large)
      .filter((c): c is string => Boolean(c));
  }, [data]);

  const dismiss = useCallback(() => {
    setShow(false);
    enableAudio();
  }, [enableAudio]);

  useEffect(() => {
    if (!mounted || !show) return;
    if (reduced) {
      setScene("title");
      return;
    }
    const t1 = window.setTimeout(() => setScene("reveal"), 1400);
    const t2 = window.setTimeout(() => setScene("title"), 2800);
    const t3 = window.setTimeout(() => setScene("exit"), 5400);
    const t4 = window.setTimeout(dismiss, TOTAL_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [mounted, show, reduced, dismiss]);

  useEffect(() => {
    if (!mounted || !show || reduced) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / TOTAL_MS);
      setProgress(p);
      setCounter(Math.min(100, Math.floor(p * 100)));
      if (elapsed < TOTAL_MS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, show, reduced]);

  useEffect(() => {
    if (!mounted || !show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, show]);

  useEffect(() => {
    if (!mounted || !show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dismiss();
      }
    };
    const onTouch = () => dismiss();
    document.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouch, { once: true, passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [mounted, show, dismiss]);

  const columns = useMemo(() => {
    if (covers.length === 0) return [];
    const cols: { src: string; speed: number }[][] = [];
    for (let c = 0; c < COLUMN_COUNT; c++) {
      const items: { src: string; speed: number }[] = [];
      for (let i = 0; i < covers.length; i += COLUMN_COUNT) {
        const src = covers[(i + c) % covers.length];
        if (src) {
          items.push({
            src,
            speed: 22 + ((c * 7) % 14),
          });
        }
      }
      cols.push(items);
    }
    return cols;
  }, [covers]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] overflow-hidden bg-night-950"
          role="dialog"
          aria-label="Tanıtım ekranı"
          onClick={dismiss}
        >
          {!reduced && columns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-0"
            >
              <div className="grid h-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                {columns.map((col, ci) => (
                  <CoverColumn key={ci} items={col} index={ci} />
                ))}
              </div>
            </motion.div>
          )}

          <div className="pointer-events-none absolute inset-0 z-[1] bg-night-950/75" />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,0.85)_100%)]" />

          <motion.div
            animate={{ opacity: [0.08, 0.22, 0.08] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-0 z-[3]"
            style={{
              background: `radial-gradient(ellipse 45% 40% at 50% 50%, ${theme.accent}44, transparent 70%)`,
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 z-[4] opacity-[0.09] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            }}
          />

          {!reduced && (
            <>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute left-0 right-0 z-[5] h-px origin-center"
                style={{ top: "14%", backgroundColor: "rgba(255,255,255,0.08)" }}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute left-0 right-0 z-[5] h-px origin-center"
                style={{ bottom: "14%", backgroundColor: "rgba(255,255,255,0.08)" }}
              />
            </>
          )}

          <SceneTitle
            scene={scene}
            accent={theme.accent}
            tagline={theme.tagline}
            reduced={!!reduced}
          />

          <TopBar accent={theme.accent} reduced={!!reduced} />

          <BottomBar
            accent={theme.accent}
            progress={progress}
            counter={counter}
            reduced={!!reduced}
            onSkip={dismiss}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CoverColumn({
  items,
  index,
}: {
  items: { src: string; speed: number }[];
  index: number;
}) {
  if (items.length === 0) return null;
  const looped = [...items, ...items];

  return (
    <div className="relative h-full overflow-hidden">
      <motion.div
        initial={{ y: "-50%" }}
        animate={{ y: "0%" }}
        transition={{
          duration: items[0]?.speed ?? 24,
          delay: -(index * 1.6),
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col gap-3"
      >
        {looped.map((it, i) => (
          <div
            key={`${it.src}-${i}`}
            className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-night-900"
          >
            <Image
              src={it.src}
              alt=""
              fill
              quality={60}
              sizes="(max-width: 640px) 33vw, 16vw"
              className="object-cover"
              priority={index < 3 && i < 3}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function SceneTitle({
  scene,
  accent,
  tagline,
  reduced,
}: {
  scene: Scene;
  accent: string;
  tagline: string;
  reduced: boolean;
}) {
  const showLetters = scene === "title" || scene === "exit";
  const showLoading = scene === "curtain";

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {showLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.9, 1.15, 0.9],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: "easeInOut",
                  }}
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 font-mono text-[10px] uppercase tracking-[0.5em] text-white/40"
            >
              hazırlanıyor
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLetters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.55em] text-white/50"
            >
              <span
                className="inline-block h-px w-8"
                style={{ backgroundColor: `${accent}88` }}
              />
              <span>kişisel katalog</span>
              <span
                className="inline-block h-px w-8"
                style={{ backgroundColor: `${accent}88` }}
              />
            </motion.div>

            <div className="flex items-baseline overflow-hidden py-2">
              {LETTERS.map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  initial={{ y: "115%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: reduced ? 0 : 0.9,
                    delay: reduced ? 0 : i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="font-display text-[clamp(2.75rem,13vw,11rem)] font-semibold leading-none tracking-[-0.06em] text-white"
                  style={{
                    textShadow: `0 0 80px ${accent}55, 0 2px 30px rgba(0,0,0,0.7)`,
                  }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0 : 0.7,
                delay: reduced ? 0 : 0.7 + LETTERS.length * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-8 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.55em] sm:text-[11px]"
              style={{ color: accent }}
            >
              <span
                className="inline-block h-px w-12"
                style={{ backgroundColor: accent }}
              />
              <span>{tagline}</span>
              <span
                className="inline-block h-px w-12"
                style={{ backgroundColor: accent }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopBar({ accent, reduced }: { accent: string; reduced: boolean }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.3 }}
      className="pointer-events-none absolute inset-x-0 top-0 z-[7] flex items-center justify-between px-6 pt-6 font-mono text-[10px] uppercase tracking-[0.35em] text-white/40 md:px-10"
    >
      <div className="flex items-center gap-3">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span>sytheris / v3.0</span>
      </div>
      <div className="hidden sm:block">kişisel katalog</div>
      <div className="tabular-nums">{time || "--:--:--"}</div>
    </motion.div>
  );
}

function BottomBar({
  accent,
  progress,
  counter,
  reduced,
  onSkip,
}: {
  accent: string;
  progress: number;
  counter: number;
  reduced: boolean;
  onSkip: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.6 }}
        className="pointer-events-none absolute bottom-6 left-6 z-[7] hidden font-mono text-[9px] uppercase tracking-[0.3em] text-white/35 md:block md:left-10"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-1 w-1 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span>yükleniyor</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.8 }}
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="group pointer-events-auto absolute bottom-6 right-6 z-[7] inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-white/50 transition-colors hover:text-white md:right-10"
        aria-label="Tanıtımı atla"
      >
        <span>içeri gir</span>
        <span aria-hidden className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </motion.button>

      {!reduced && (
        <div className="absolute inset-x-0 bottom-0 z-[7] h-[2px] bg-white/[0.06]">
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: accent,
              boxShadow: `0 0 16px ${accent}`,
            }}
          />
        </div>
      )}

      {!reduced && (
        <div className="pointer-events-none absolute bottom-6 right-6 z-[6] font-mono text-[9px] tabular-nums tracking-[0.3em] text-white/25 sm:hidden">
          {String(counter).padStart(3, "0")}%
        </div>
      )}
    </>
  );
}