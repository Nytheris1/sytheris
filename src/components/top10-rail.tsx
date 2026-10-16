"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { pickTitle } from "@/lib/anilist/client";
import { SectionHeader } from "@/components/section-header";
import type { Anime } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

interface Top10RailProps {
  animeList: Anime[];
  title?: string;
  subtitle?: string;
  moreHref?: string;
  className?: string;
}

export function Top10Rail({
  animeList,
  title = "Bugün Türkiye'de <em>Top 10</em>",
  subtitle,
  moreHref,
  className,
}: Top10RailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  function scrollByAmount(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 360);
    el.scrollBy({ left: amount * dir, behavior: "smooth" });
  }

  if (animeList.length === 0) return null;

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Top 10"
        title={title}
        subtitle={subtitle}
        moreHref={moreHref}
      />

      <div className="relative">
        {/* Sol ok */}
        <button
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          aria-label="Sola kaydır"
          className={cn(
            "absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-700 bg-ink-950/90 text-cream-200 shadow-lg backdrop-blur-md transition-all md:flex",
            canScrollLeft
              ? "opacity-100 hover:border-accent-400 hover:text-accent-700"
              : "pointer-events-none opacity-0",
          )}
        >
          ‹
        </button>

        {/* Sağ ok */}
        <button
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          aria-label="Sağa kaydır"
          className={cn(
            "absolute right-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-700 bg-ink-950/90 text-cream-200 shadow-lg backdrop-blur-md transition-all md:flex",
            canScrollRight
              ? "opacity-100 hover:border-accent-400 hover:text-accent-700"
              : "pointer-events-none opacity-0",
          )}
        >
          ›
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-6 flex gap-2 overflow-x-auto px-6 pb-4 pt-2"
        >
          {animeList.slice(0, 10).map((anime, i) => (
            <Top10Card key={anime.id} anime={anime} rank={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Top10Card({ anime, rank }: { anime: Anime; rank: number }) {
  const title = pickTitle(anime.title);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
  const rankStr = String(rank).padStart(2, "0");

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group relative flex shrink-0 items-end gap-1 pr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
    >
      {/* Devasa numara — sol tarafta, kartın arkasına geçiyor */}
      <span
        aria-hidden
        className="select-none font-display text-[140px] font-bold leading-[0.8] tracking-[-0.08em] text-transparent transition-all duration-500 sm:text-[160px] md:text-[180px]"
        style={{
          WebkitTextStroke: "2px var(--color-ink-600)",
        }}
      >
        {rankStr}
      </span>

      {/* Kart — numarayı hafifçe örtüyor */}
      <div className="-ml-10 relative aspect-[2/3] w-[130px] shrink-0 overflow-hidden rounded-xl bg-ink-800 ring-1 ring-ink-700/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-accent-400 group-hover:shadow-xl group-hover:shadow-night-950/25 sm:w-[145px] md:w-[160px]">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            quality={85}
            sizes="(max-width: 640px) 130px, 160px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-500">
            Görsel yok
          </div>
        )}

        {/* Alt gradient — başlık için */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night-950/95 via-night-950/40 to-transparent" />

        {/* Başlık kartın içinde */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="line-clamp-2 text-[11px] font-medium leading-tight text-white/90 transition-colors group-hover:text-accent-400">
            {title}
          </p>
        </div>

        {/* Puan */}
        {anime.averageScore != null && (
          <div className="absolute right-2 top-2 rounded-full bg-night-950/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-400 backdrop-blur-sm">
            {anime.averageScore}
          </div>
        )}
      </div>
    </Link>
  );
}