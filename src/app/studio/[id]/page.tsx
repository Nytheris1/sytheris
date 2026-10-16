"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { STUDIO_DETAIL } from "@/lib/anilist/queries";
import type { StudioDetail, StudioMediaNode } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

export default function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);
  const router = useRouter();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["studio-detail", numericId],
    enabled: Number.isFinite(numericId),
    queryFn: ({ signal }) =>
      anilistRequest<{ Studio: StudioDetail | null }>(
        STUDIO_DETAIL,
        { id: numericId },
        { signal },
      ),
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-ink-800" />
          <div className="h-12 w-80 rounded bg-ink-800" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] w-full rounded-[var(--radius-card)] bg-ink-800" />
                <div className="mt-3 h-3.5 w-4/5 rounded bg-ink-800" />
                <div className="mt-2 h-3 w-3/5 rounded bg-ink-800/70" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <EmptyState
          icon="!"
          title="Stüdyo yüklenemedi"
          description={(error as Error).message}
          action={{ onClick: () => refetch(), label: "Tekrar dene" }}
        />
      </main>
    );
  }

  const studio = data?.Studio;
  if (!studio) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <EmptyState
          icon="?"
          title="Stüdyo bulunamadı"
          description="Bu stüdyo mevcut değil."
          action={{ onClick: () => router.back(), label: "Geri dön" }}
        />
      </main>
    );
  }

  const items = studio.media.nodes;
  const total = studio.media.pageInfo.total;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/60 px-3.5 py-1.5 text-xs text-cream-200 transition-colors hover:border-ink-600 hover:text-cream-50 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span aria-hidden>←</span> Geri
        </button>
      </div>

      <PageHeader
        eyebrow={studio.isAnimationStudio ? "Animasyon stüdyosu" : "Stüdyo"}
        title={studio.name}
        description={
          total > 0
            ? `${total} anime · ${studio.favourites?.toLocaleString("tr-TR") ?? 0} favori`
            : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="—"
          title="Bu stüdyo için anime bulunamadı."
          description="AniList bu stüdyoya ait bir yapım listelemiyor."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
          {items.map((anime, i) => (
            <StudioCard key={anime.id} anime={anime} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}

function StudioCard({ anime, index }: { anime: StudioMediaNode; index: number }) {
  const title = pickTitle(anime.title);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.035, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group"
    >
      <Link
        href={`/anime/${anime.id}`}
        className="block rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      >
        <div
          className={cn(
            "relative aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] bg-ink-800",
            "ring-1 ring-inset ring-ink-700/60",
            "transition-[transform,box-shadow,ring-color] duration-300 ease-out will-change-transform",
            "group-hover:-translate-y-1 group-hover:ring-accent-400 group-hover:shadow-xl group-hover:shadow-night-950/20",
          )}
        >
          {cover ? (
            <Image
              src={cover}
              alt={title}
              fill
              quality={85}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-500">
              Görsel yok
            </div>
          )}

          {anime.averageScore != null && (
            <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-night-950/85 px-2 py-1 text-[11px] font-semibold text-accent-400 backdrop-blur-sm">
              ★ {anime.averageScore}
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-cream-50 transition-colors group-hover:text-accent-700">
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted-400">
            {anime.seasonYear ?? "—"} · {anime.format ?? "—"}
            {anime.episodes ? ` · ${anime.episodes} bölüm` : ""}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}