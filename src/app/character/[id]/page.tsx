"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { EmptyState } from "@/components/empty-state";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { CHARACTER_DETAIL } from "@/lib/anilist/queries";
import type {
  CharacterDetail,
  CharacterMediaEdge,
} from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

export default function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);
  const router = useRouter();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["character-detail", numericId],
    enabled: Number.isFinite(numericId),
    queryFn: ({ signal }) =>
      anilistRequest<{ Character: CharacterDetail | null }>(
        CHARACTER_DETAIL,
        { id: numericId },
        { signal },
      ),
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-20 rounded bg-ink-800" />
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <div className="aspect-[2/3] w-40 shrink-0 rounded-2xl bg-ink-800 sm:w-56" />
            <div className="flex-1 space-y-3 pt-4">
              <div className="h-4 w-24 rounded bg-ink-800/70" />
              <div className="h-10 w-3/4 rounded bg-ink-800" />
              <div className="h-4 w-40 rounded bg-ink-800/70" />
              <div className="h-4 w-full rounded bg-ink-800/70" />
              <div className="h-4 w-5/6 rounded bg-ink-800/70" />
            </div>
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
          title="Karakter yüklenemedi"
          description={(error as Error).message}
          action={{ onClick: () => refetch(), label: "Tekrar dene" }}
        />
      </main>
    );
  }

  const character = data?.Character;
  if (!character) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <EmptyState
          icon="?"
          title="Karakter bulunamadı"
          description="Bu karakter mevcut değil."
          action={{ onClick: () => router.back(), label: "Geri dön" }}
        />
      </main>
    );
  }

  const alternatives = character.name.alternative
    .filter((a): a is string => Boolean(a))
    .slice(0, 4);
  const appearances = character.media.edges;

  const mainAppearances = appearances.filter(
    (e: CharacterMediaEdge) => e.characterRole === "MAIN",
  );
  const supportingAppearances = appearances.filter(
    (e: CharacterMediaEdge) => e.characterRole === "SUPPORTING",
  );

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

      <div className="grid gap-6 sm:gap-8 md:grid-cols-[220px_1fr] md:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-2xl bg-ink-800 shadow-2xl ring-1 ring-ink-700/60 sm:w-48 md:mx-0 md:w-full"
        >
          {character.image.large && (
            <Image
              src={character.image.large}
              alt={character.name.full}
              fill
              priority
              quality={90}
              sizes="(max-width: 768px) 160px, 220px"
              className="object-cover"
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-700 sm:text-xs">
            Karakter
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-[1.1] tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            {character.name.full}
          </h1>
          {character.name.native && (
            <p className="mt-2 text-xs text-muted-400 sm:text-sm">
              {character.name.native}
            </p>
          )}

          {alternatives.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {alternatives.map((alt: string) => (
                <span
                  key={alt}
                  className="rounded-full border border-ink-700 bg-ink-900/60 px-3 py-1 text-[11px] text-cream-200 sm:text-xs"
                >
                  {alt}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cream-200">
            <span>
              <span className="font-semibold text-accent-700">
                {character.media.pageInfo.total}
              </span>{" "}
              yapım
            </span>
            {character.favourites != null && (
              <>
                <span className="text-muted-500">·</span>
                <span>
                  <span className="font-semibold text-accent-700">
                    {character.favourites.toLocaleString("tr-TR")}
                  </span>{" "}
                  favori
                </span>
              </>
            )}
          </div>

          {character.description && (
            <div className="mt-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-cream-200/85 md:text-[15px]">
                {character.description.replace(/<[^>]+>/g, "").trim()}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://anilist.co/character/${character.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-5 py-2.5 text-xs font-medium text-cream-50 transition-colors hover:border-cream-50 sm:px-6 sm:py-3 sm:text-sm"
            >
              AniList&apos;te aç <span aria-hidden>↗</span>
            </a>
          </div>
        </motion.div>
      </div>

      <div className="mt-14 space-y-12 sm:mt-16">
        {mainAppearances.length > 0 && (
          <AppearancesSection
            title="Ana karakter"
            subtitle={`${mainAppearances.length} yapımda başrolde`}
            edges={mainAppearances}
          />
        )}

        {supportingAppearances.length > 0 && (
          <AppearancesSection
            title="Yardımcı karakter"
            subtitle={`${supportingAppearances.length} yapımda`}
            edges={supportingAppearances}
          />
        )}

        {mainAppearances.length === 0 && supportingAppearances.length === 0 && (
          <EmptyState
            icon="—"
            title="Yapım bilgisi yok"
            description="Bu karakter için AniList'te yapım kaydı bulunmuyor."
          />
        )}
      </div>
    </main>
  );
}

function AppearancesSection({
  title,
  subtitle,
  edges,
}: {
  title: string;
  subtitle: string;
  edges: CharacterMediaEdge[];
}) {
  return (
    <section>
      <header className="mb-5">
        <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
          <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-400">{subtitle}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
        {edges.map((edge: CharacterMediaEdge, i: number) => (
          <AppearanceCard key={edge.node.id} edge={edge} index={i} />
        ))}
      </div>
    </section>
  );
}

function AppearanceCard({
  edge,
  index,
}: {
  edge: CharacterMediaEdge;
  index: number;
}) {
  const title = pickTitle(edge.node.title);
  const cover =
    edge.node.coverImage.extraLarge ?? edge.node.coverImage.large;

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
        href={`/anime/${edge.node.id}`}
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

          {edge.node.averageScore != null && (
            <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-night-950/85 px-2 py-1 text-[11px] font-semibold text-accent-400 backdrop-blur-sm">
              ★ {edge.node.averageScore}
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-cream-50 transition-colors group-hover:text-accent-700">
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted-400">
            {edge.node.seasonYear ?? "—"} · {edge.node.format ?? "—"}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}