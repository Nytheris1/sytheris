"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { pickTitle } from "@/lib/anilist/client";
import type { Anime } from "@/lib/anilist/types";

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "Kısa TV",
  MOVIE: "Film",
  SPECIAL: "Özel",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Müzik",
};

interface EditorialSpotlightProps {
  anime: Anime;
  issueNumber?: string;
}

export function EditorialSpotlight({
  anime,
  issueNumber = "01",
}: EditorialSpotlightProps) {
  const title = pickTitle(anime.title);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
  const description = anime.description
    ? stripHtml(anime.description)
    : null;
  const genres = anime.genres?.slice(0, 4) ?? [];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-900/40">
      {/* Arka plan katmanları */}
      {cover && (
        <>
          <Image
            src={cover}
            alt=""
            fill
            quality={75}
            sizes="100vw"
            className="pointer-events-none scale-110 object-cover opacity-[0.06] blur-3xl"
            aria-hidden
          />
        </>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.04]"
      />

      {/* Ghost numara — arka planda */}
      <motion.span
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
        className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none font-display text-[24rem] font-bold leading-none tracking-[-0.08em] text-cream-50/[0.03] sm:text-[32rem] lg:text-[40rem]"
      >
        {issueNumber}
      </motion.span>

      <div className="relative grid gap-8 p-6 sm:gap-10 sm:p-10 lg:grid-cols-[280px_1fr] lg:items-center lg:gap-16 lg:p-14">
        {/* Kapak */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[280px] lg:mx-0"
        >
          <Link
            href={`/anime/${anime.id}`}
            className="group relative block aspect-[2/3] overflow-hidden rounded-2xl bg-ink-800 shadow-2xl shadow-black/20 ring-1 ring-ink-700/60 transition-all hover:-translate-y-1 hover:ring-accent-400/60"
          >
            {cover && (
              <Image
                src={cover}
                alt={title}
                fill
                quality={90}
                sizes="(max-width: 1024px) 280px, 280px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            )}
            {/* İnce parlaklık şeridi */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5" />
          </Link>
        </motion.div>

        {/* Metin */}
        <div className="min-w-0">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-accent-700"
          >
            <span className="inline-block h-px w-8 bg-accent-400" />
            <span>Haftanın seçkisi</span>
            <span className="text-muted-400">/ {issueNumber}</span>
          </motion.div>

          {/* Başlık */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-cream-50 md:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h2>

          {/* Meta satırı */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.15em] text-cream-200 md:text-sm"
          >
            {anime.seasonYear && <span>{anime.seasonYear}</span>}
            {anime.format && (
              <>
                <span className="text-muted-500">·</span>
                <span>{FORMAT_LABELS[anime.format] ?? anime.format}</span>
              </>
            )}
            {anime.episodes && (
              <>
                <span className="text-muted-500">·</span>
                <span>{anime.episodes} bölüm</span>
              </>
            )}
            {anime.averageScore != null && (
              <>
                <span className="text-muted-500">·</span>
                <span className="flex items-center gap-1.5 font-semibold text-accent-700">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-400" />
                  {anime.averageScore} / 100
                </span>
              </>
            )}
          </motion.div>

          {/* Özet */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 line-clamp-4 max-w-3xl text-sm leading-relaxed text-cream-200/85 md:text-base"
            >
              {description}
            </motion.p>
          )}

          {/* Tür chip'leri */}
          {genres.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 flex flex-wrap gap-2"
            >
              {genres.map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className="rounded-full border border-ink-700 bg-ink-900/40 px-3 py-1 text-xs text-cream-200 transition-colors hover:border-accent-500 hover:text-accent-700"
                >
                  {g}
                </Link>
              ))}
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href={`/anime/${anime.id}`}
              className="group inline-flex items-center gap-3 rounded-full bg-accent-400 px-7 py-3.5 text-sm font-semibold text-night-950 transition-all hover:bg-accent-500"
            >
              <span>Detayları gör</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-ink-600 px-7 py-3.5 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50"
            >
              Tüm katalog
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}