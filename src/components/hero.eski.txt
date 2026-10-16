"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { pickTitle } from "@/lib/anilist/client";
import type { Anime } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

const ROTATION_MS = 9000;

interface HeroProps {
  animeList: Anime[];
}

export function Hero({ animeList }: HeroProps) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ["0%", "0%"] : ["0%", "18%"],
  );
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ["0%", "0%"] : ["0%", "38%"],
  );
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const count = animeList.length;
  const anime = animeList[index];

  useEffect(() => {
    if (reduced || paused || count <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATION_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, reduced]);

  if (!anime) return null;

  const title = pickTitle(anime.title);
  const native =
    anime.title.native && anime.title.native !== title ? anime.title.native : null;
  const banner = anime.bannerImage ?? anime.coverImage.extraLarge;
  const indexStr = String(index + 1).padStart(2, "0");
  const totalStr = String(count).padStart(2, "0");

  /* Başlığı ikiye böl — son kelimeyi italik serif yap */
  const words = title.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words[words.length - 1] : "";
  const restWords = words.length > 1 ? words.slice(0, -1).join(" ") : title;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] w-full overflow-hidden bg-[#1a1a1f]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        style={{ y: bgY, opacity: bgOpacity }}
        className="absolute inset-0"
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={anime.id}
            initial={{ opacity: 0, scale: reduced ? 1 : 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {banner && (
              <Image
                src={banner}
                alt={title}
                fill
                priority={index === 0}
                quality={90}
                sizes="100vw"
                className="object-cover"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#15151a]/90 via-[#15151a]/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f13]/95 via-[#15151a]/55 to-transparent lg:via-[#15151a]/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block">
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 [writing-mode:vertical-rl]">
            ANILIST · TRENDING
          </span>
          <span className="h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <span className="font-mono text-[10px] text-white/40">
            {indexStr}/{totalStr}
          </span>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end gap-12 px-6 pb-20 pt-28 lg:flex-row lg:items-end lg:gap-16 lg:pb-24">
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="flex-1 lg:max-w-[58%]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.28em] text-accent-400">
                <span className="inline-block h-px w-10 bg-accent-400" />
                <span>Öne çıkan</span>
                <span className="text-white/30">/</span>
                <span className="text-white/50">{indexStr}</span>
              </div>

              <h1 className="text-hero font-display font-semibold text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">
                {restWords}
                {lastWord && (
                  <>
                    {" "}
                    <em className="editorial-em font-normal">{lastWord}</em>
                  </>
                )}
              </h1>

              {native && (
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-white/55 md:text-sm">
                  {native}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {anime.seasonYear && (
                  <MetaChip>{anime.seasonYear}</MetaChip>
                )}
                {anime.format && <MetaChip>{anime.format}</MetaChip>}
                {anime.episodes && (
                  <MetaChip>{anime.episodes} BÖLÜM</MetaChip>
                )}
                {anime.averageScore != null && (
                  <span className="flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1 font-mono text-[11px] font-semibold text-accent-400 backdrop-blur-sm">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-400" />
                    {anime.averageScore} / 100
                  </span>
                )}
              </div>

              {anime.description && (
                <p className="mt-6 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                  {stripHtml(anime.description)}
                </p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={`/anime/${anime.id}`}
                  className="group inline-flex items-center gap-3 rounded-full bg-accent-400 px-7 py-3.5 text-sm font-semibold text-night-950 shadow-lg shadow-accent-400/20 transition-all hover:bg-accent-500 hover:shadow-accent-400/30"
                >
                  <span>Detayları gör</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/search"
                  className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/5"
                >
                  Katalogda ara
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {count > 1 && (
            <div className="mt-12 flex items-center gap-5 lg:hidden">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                Seç
              </span>
              <div className="flex items-center gap-2">
                {animeList.map((a, i) => {
                  const isActive = i === index;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setIndex(i)}
                      aria-label={`${i + 1}. öne çıkana git`}
                      aria-current={isActive}
                      className={cn(
                        "relative h-1 overflow-hidden rounded-full transition-all duration-500",
                        isActive
                          ? "w-14 bg-white/20"
                          : "w-7 bg-white/20 hover:bg-white/35",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          key={`${a.id}-${paused}-${reduced}`}
                          initial={{ width: reduced ? "100%" : "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: reduced || paused ? 0 : ROTATION_MS / 1000,
                            ease: "linear",
                          }}
                          className="absolute inset-y-0 left-0 block bg-accent-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {count > 1 && (
          <motion.aside
            style={{ y: contentY, opacity: contentOpacity }}
            className="hidden w-full max-w-md lg:block"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
                Şu an trend
              </span>
              <span className="font-mono text-[10px] tabular-nums text-white/40">
                {indexStr} / {String(count).padStart(2, "0")}
              </span>
            </div>

            <ul className="space-y-2">
              {animeList.map((a, i) => {
                const isActive = i === index;
                const aTitle = pickTitle(a.title);
                const aCover = a.coverImage.large ?? a.coverImage.extraLarge;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setIndex(i)}
                      className={cn(
                        "group/row relative flex w-full items-center gap-3.5 rounded-xl border p-2.5 text-left transition-all duration-300",
                        isActive
                          ? "border-accent-400/40 bg-white/[0.06] backdrop-blur-md"
                          : "border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-white/15 hover:bg-white/[0.05]",
                      )}
                      aria-current={isActive}
                    >
                      <span
                        className={cn(
                          "absolute inset-y-2 left-0 w-[2px] rounded-full transition-colors",
                          isActive ? "bg-accent-400" : "bg-transparent",
                        )}
                      />
                      <div
                        className={cn(
                          "relative shrink-0 overflow-hidden rounded-lg bg-night-900 ring-1 transition-all duration-300",
                          isActive
                            ? "h-16 w-11 ring-accent-400/50"
                            : "h-14 w-10 ring-white/10 group-hover/row:ring-white/25",
                        )}
                      >
                        {aCover && (
                          <Image
                            src={aCover}
                            alt={aTitle}
                            fill
                            quality={85}
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "line-clamp-1 text-sm font-medium transition-colors",
                            isActive
                              ? "text-white"
                              : "text-white/75 group-hover/row:text-white",
                          )}
                        >
                          {aTitle}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                          {a.seasonYear ?? "—"} · {a.format ?? "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-xs tabular-nums transition-colors",
                          isActive
                            ? "text-accent-400"
                            : "text-white/30 group-hover/row:text-white/50",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!reduced && !paused && (
              <div className="mt-4 h-px w-full overflow-hidden bg-white/10">
                <motion.div
                  key={`${anime.id}-${paused}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: ROTATION_MS / 1000, ease: "linear" }}
                  className="h-full bg-accent-400"
                />
              </div>
            )}
          </motion.aside>
        )}
      </div>
    </section>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white/70 backdrop-blur-sm">
      {children}
    </span>
  );
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "");
}