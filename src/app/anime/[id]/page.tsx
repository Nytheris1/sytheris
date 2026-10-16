"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { ANIME_DETAIL } from "@/lib/anilist/queries";
import type {
  AnimeDetail,
  ExternalLink,
  RelationEdge,
  RelationNode,
} from "@/lib/anilist/types";
import {
  useFavorites,
  useLibrary,
  toggleFavorite,
  setStatus,
  setRating,
  setNotes,
  STATUS_LABELS,
  STATUS_ICONS,
  STATUS_ORDER,
} from "@/lib/user-data";
import type { SavedAnime, WatchStatus } from "@/lib/user-data";
import { cn } from "@/lib/utils";
import { AnimeDetailSkeleton } from "@/components/skeleton";
import { EpisodeList } from "@/components/episode-list";
import { EpisodeGallery } from "@/components/episode-gallery";
import { ScoreDistribution } from "@/components/score-distribution";
import { RewatchCounter } from "@/components/rewatch-counter";
import { SectionNav, type SectionNavItem } from "@/components/section-nav";
import { useToast } from "@/components/toast";

const STATUS_LABELS_ANIME: Record<string, string> = {
  FINISHED: "Tamamlandı",
  RELEASING: "Yayında",
  NOT_YET_RELEASED: "Yakında",
  CANCELLED: "İptal edildi",
  HIATUS: "Arada",
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "Kısa TV",
  MOVIE: "Film",
  SPECIAL: "Özel",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Müzik",
};

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Kış",
  SPRING: "İlkbahar",
  SUMMER: "Yaz",
  FALL: "Sonbahar",
};

const RELATION_LABELS: Record<string, string> = {
  SEQUEL: "Devam sezonu",
  PREQUEL: "Önceki sezon",
  PARENT: "Ana hikaye",
  SIDE_STORY: "Yan hikaye",
  SPIN_OFF: "Spin-off",
  ALTERNATIVE: "Alternatif versiyon",
  ADAPTATION: "Uyarlama",
  SUMMARY: "Özet",
  COMPILATION: "Derleme",
  CONTAINS: "İçerir",
  CHARACTER: "Karakter",
  SOURCE: "Kaynak",
  OTHER: "Diğer",
};

const RELATION_ORDER: string[] = [
  "SEQUEL",
  "PREQUEL",
  "PARENT",
  "SIDE_STORY",
  "SPIN_OFF",
  "ALTERNATIVE",
  "ADAPTATION",
  "SUMMARY",
  "COMPILATION",
  "CONTAINS",
  "CHARACTER",
  "SOURCE",
  "OTHER",
];

export default function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id);
  const router = useRouter();
  const toast = useToast();

  const favorites = useFavorites();
  const library = useLibrary();
  const fav = favorites.some((f) => f.id === numericId);
  const entry = library.find((l) => l.id === numericId);
  const currentStatus: WatchStatus | null = entry?.status ?? null;
  const rating: number | null = entry?.rating ?? null;

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(entry?.notes ?? "");
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimerRef = useRef<number | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["anime-detail", numericId],
    enabled: Number.isFinite(numericId),
    queryFn: ({ signal }) =>
      anilistRequest<{ Media: AnimeDetail | null }>(
        ANIME_DETAIL,
        { id: numericId },
        { signal },
      ),
  });

  useEffect(() => {
    setNoteValue(entry?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  useEffect(() => {
    if (!trailerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrailerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [trailerOpen]);

  function handleNoteChange(v: string) {
    setNoteValue(v);
    setNoteStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setNotes(numericId, v);
      setNoteStatus("saved");
      setTimeout(() => setNoteStatus("idle"), 1500);
    }, 500);
  }

  if (isPending) return <AnimeDetailSkeleton />;

  if (isError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="font-display text-3xl">Bir şeyler ters gitti</h1>
        <p className="mt-2 text-muted-400">{(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="mt-6 rounded-full bg-accent-400 px-5 py-2 font-medium text-night-950 transition-colors hover:bg-accent-500"
        >
          Tekrar dene
        </button>
      </main>
    );
  }

  const anime = data?.Media;
  if (!anime) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="font-display text-3xl">Bulunamadı</h1>
        <p className="mt-2 text-muted-400">Bu anime mevcut değil.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-accent-400 px-5 py-2 font-medium text-night-950 hover:bg-accent-500"
        >
          Ana sayfaya dön
        </Link>
      </main>
    );
  }

  const title = pickTitle(anime.title);
  const banner = anime.bannerImage ?? anime.coverImage.extraLarge;
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
  const studioNode = anime.studios.nodes[0];
  const studioName = studioNode?.name;
  const studioId = studioNode?.id;
  const streamingLinks = anime.externalLinks.filter((l) => l.type === "STREAMING");
  const otherLinks = anime.externalLinks
    .filter((l) => l.type !== "STREAMING")
    .slice(0, 6);

  const hasTrailer = anime.trailer?.site === "youtube";
  const ambientColor = anime.coverImage.color;

  const relationsByType = new Map<string, RelationNode[]>();
  for (const edge of anime.relations.edges as RelationEdge[]) {
    if (edge.node.type !== "ANIME") continue;
    if (edge.node.id === anime.id) continue;
    const list = relationsByType.get(edge.relationType) ?? [];
    list.push(edge.node);
    relationsByType.set(edge.relationType, list);
  }

  const relationGroups = RELATION_ORDER.filter((t) =>
    relationsByType.has(t),
  ).map((t) => ({ type: t, items: relationsByType.get(t) ?? [] }));

  const scoreBuckets = anime.stats?.scoreDistribution ?? [];
  const rankings = anime.rankings ?? [];

  /* Bölüm menüsü */
  const sections: SectionNavItem[] = [];
  if (anime.description) {
    sections.push({ id: "summary", label: "Özet" });
  }
  if (relationGroups.length > 0) {
    sections.push({ id: "relations", label: "İlgili" });
  }
  if (
    (anime.streamingEpisodes?.length ?? 0) > 0 ||
    (anime.episodes != null && anime.episodes > 0)
  ) {
    sections.push({ id: "episodes", label: "Bölümler" });
  }
  if (anime.characters.edges.length > 0) {
    sections.push({ id: "characters", label: "Karakterler" });
  }
  if (anime.recommendations.nodes.length > 0) {
    sections.push({ id: "similar", label: "Benzer" });
  }

  const saved: SavedAnime = {
    id: anime.id,
    title,
    cover,
    format: anime.format,
    seasonYear: anime.seasonYear,
    averageScore: anime.averageScore,
    genres: anime.genres,
  };

  function handleFavoriteClick() {
    toggleFavorite(saved);
    toast.success(
      fav ? "Favoriden çıkarıldı" : "Favoriye eklendi",
      title,
    );
  }

  function handleStatusClick(s: WatchStatus) {
    const wasActive = currentStatus === s;
    setStatus(saved, s);
    if (wasActive) {
      toast.info("Durum kaldırıldı", title);
    } else {
      toast.success(`"${STATUS_LABELS[s]}" olarak işaretlendi`, title);
    }
  }

  return (
    <main className="relative pb-24">
      {ambientColor && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[75vh] opacity-[0.35]"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${ambientColor}, transparent 70%)`,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[60vh] h-[40vh] opacity-[0.12]"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 30% 50%, ${ambientColor}, transparent 70%)`,
            }}
          />
        </>
      )}

      <div className="relative h-[52vh] min-h-[380px] w-full overflow-hidden bg-night-950">
        {banner && (
          <Image
            src={banner}
            alt={title}
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-night-950/55 to-night-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-night-950/90 via-night-950/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />

        <div className="absolute left-0 right-0 top-0 z-10">
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-night-950/40 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:border-white/60 hover:bg-night-950/60"
            >
              <span aria-hidden>←</span> Geri
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="-mt-44 flex flex-col gap-8 md:-mt-56 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-ink-800 shadow-2xl ring-1 ring-ink-700/60 md:w-56"
          >
            {cover && (
              <Image
                src={cover}
                alt={title}
                fill
                priority
                quality={90}
                sizes="(max-width: 768px) 160px, 224px"
                className="object-cover"
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 pb-2"
          >
            <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              {title}
            </h1>
            {anime.title.native && anime.title.native !== title && (
              <p className="mt-2 text-sm text-muted-400">{anime.title.native}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cream-200">
              {anime.seasonYear && anime.season && (
                <span>
                  {SEASON_LABELS[anime.season] ?? anime.season} {anime.seasonYear}
                </span>
              )}
              {anime.format && (
                <>
                  <span className="text-muted-500">·</span>
                  <span>{FORMAT_LABELS[anime.format] ?? anime.format}</span>
                </>
              )}
              {anime.status && (
                <>
                  <span className="text-muted-500">·</span>
                  <span>{STATUS_LABELS_ANIME[anime.status] ?? anime.status}</span>
                </>
              )}
              {anime.episodes && (
                <>
                  <span className="text-muted-500">·</span>
                  <span>{anime.episodes} bölüm</span>
                </>
              )}
              {anime.duration && (
                <>
                  <span className="text-muted-500">·</span>
                  <span>{anime.duration} dk</span>
                </>
              )}
              {studioNode && (
                <>
                  <span className="text-muted-500">·</span>
                  <Link
                    href={`/studio/${studioId}`}
                    className="text-cream-200 underline-offset-4 transition-colors hover:text-accent-700 hover:underline"
                  >
                    {studioName}
                  </Link>
                </>
              )}
            </div>

            {anime.averageScore != null && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-accent-700">
                    {anime.averageScore}
                  </span>
                  <span className="text-sm text-muted-400">/ 100</span>
                </div>
                <span className="text-sm text-muted-400">
                  {anime.popularity?.toLocaleString("tr-TR")} popülerlik ·{" "}
                  {anime.favourites?.toLocaleString("tr-TR")} favori
                </span>
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {hasTrailer && (
            <button
              onClick={() => setTrailerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-7 py-3.5 text-sm font-semibold text-night-950 transition-colors hover:bg-accent-500"
            >
              <span aria-hidden>▶</span> Fragmanı izle
            </button>
          )}

          <button
            onClick={handleFavoriteClick}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-medium transition-colors",
              fav
                ? "border-accent-500 bg-accent-400/15 text-accent-700"
                : "border-ink-600 text-cream-50 hover:border-cream-50",
            )}
            aria-pressed={fav}
          >
            <span aria-hidden>{fav ? "★" : "☆"}</span>
            {fav ? "Favoride" : "Favoriye ekle"}
          </button>

          <a
            href={`https://anilist.co/anime/${anime.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-6 py-3.5 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50"
          >
            AniList&apos;te aç <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/40 p-4 md:p-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                İzleme durumum
              </h3>
              {currentStatus && (
                <span className="font-mono text-[10px] text-accent-700">
                  {STATUS_LABELS[currentStatus]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUS_ORDER.map((s) => {
                const active = currentStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusClick(s)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-accent-500 bg-accent-400/15 text-accent-700"
                        : "border-ink-700 text-cream-200 hover:border-ink-600 hover:bg-ink-900/60",
                    )}
                    aria-pressed={active}
                  >
                    <span aria-hidden className="text-base">
                      {STATUS_ICONS[s]}
                    </span>
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            {currentStatus && (
              <p className="mt-2 text-xs text-muted-400">
                Aynı butona tekrar basarsan durum kaldırılır.
              </p>
            )}
          </div>

          {currentStatus ? (
            <>
              {/* İzleme sayacı */}
              <RewatchCounter animeId={anime.id} />

              <div className="mt-5 border-t border-ink-800 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                    Puanım
                  </h3>
                  <span className="font-mono text-[10px] tabular-nums text-muted-400">
                    {rating != null ? `${rating} / 10` : "—"}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const filled = rating != null && n <= rating;
                    const exact = rating === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setRating(numericId, exact ? null : n)}
                        aria-label={`${n} puan ver`}
                        aria-pressed={exact}
                        className={cn(
                          "flex h-9 flex-1 items-center justify-center rounded-lg border text-xs font-medium tabular-nums transition-all sm:text-sm",
                          filled
                            ? "border-accent-500 bg-accent-400/20 text-accent-700"
                            : "border-ink-700 text-cream-200 hover:border-ink-600 hover:bg-ink-900/60",
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {rating != null && (
                  <button
                    onClick={() => setRating(numericId, null)}
                    className="mt-2 text-xs text-muted-400 transition-colors hover:text-crimson-500"
                  >
                    Puanı kaldır
                  </button>
                )}
              </div>

              <div className="mt-5 border-t border-ink-800 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-400">
                    Notlarım
                  </h3>
                  <span className="font-mono text-[10px] text-muted-400">
                    {noteStatus === "saving" && "kaydediliyor…"}
                    {noteStatus === "saved" && (
                      <span className="text-accent-700">kaydedildi ✓</span>
                    )}
                  </span>
                </div>
                <textarea
                  value={noteValue}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Bu animeyle ilgili düşüncelerin, favori sahneler, karakter notları…"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-sm text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="mt-5 border-t border-ink-800 pt-5">
              <p className="text-sm text-muted-400">
                Puan, not ve izleme sayacı için önce yukarıdan bir durum seç.
              </p>
            </div>
          )}
        </div>

        <SectionNav sections={sections} />

        <div className="mt-4 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            {relationGroups.length > 0 && (
              <section id="relations" className="scroll-mt-32">
                <SectionHeading>İlgili yapımlar</SectionHeading>
                <div className="mt-6 space-y-8">
                  {relationGroups.map((group) => (
                    <div key={group.type}>
                      <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-700">
                        <span className="inline-block h-3 w-0.5 rounded-full bg-accent-400" />
                        {RELATION_LABELS[group.type] ?? group.type}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                        {group.items.map((r) => (
                          <RelationCard key={`${group.type}-${r.id}`} anime={r} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {anime.description && (
              <section
                id="summary"
                className={cn(
                  "scroll-mt-32",
                  relationGroups.length > 0 && "mt-16",
                )}
              >
                <SectionHeading>Özet</SectionHeading>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-cream-200/90 md:text-[15px]">
                  {anime.description.replace(/<[^>]+>/g, "")}
                </p>
              </section>
            )}

            {/* Bölüm görsel galerisi */}
            {anime.streamingEpisodes && anime.streamingEpisodes.length > 0 && (
              <div className="mt-16">
                <EpisodeGallery
                  animeId={anime.id}
                  streamingEpisodes={anime.streamingEpisodes}
                />
              </div>
            )}

            <div id="episodes" className="mt-16 scroll-mt-32">
              <EpisodeList
                animeId={anime.id}
                streamingEpisodes={anime.streamingEpisodes ?? []}
                totalEpisodes={anime.episodes}
              />
            </div>

            {anime.characters.edges.length > 0 && (
              <section id="characters" className="mt-16 scroll-mt-32">
                <SectionHeading>Karakterler</SectionHeading>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {anime.characters.edges.map((edge) => {
                    const va = edge.voiceActors[0];
                    return (
                      <div
                        key={edge.node.id}
                        className="group flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3 transition-all hover:border-accent-500/40 hover:bg-ink-900/80"
                      >
                        <Link
                          href={`/character/${edge.node.id}`}
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ink-800 ring-1 ring-ink-700 transition-colors hover:ring-accent-500/60"
                          aria-label={edge.node.name.full}
                        >
                          {edge.node.image.large && (
                            <Image
                              src={edge.node.image.large}
                              alt={edge.node.name.full}
                              fill
                              quality={85}
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/character/${edge.node.id}`}
                            className="block truncate text-sm font-medium text-cream-50 transition-colors hover:text-accent-700"
                          >
                            {edge.node.name.full}
                          </Link>
                          <p className="text-xs text-muted-400">
                            {edge.role === "MAIN"
                              ? "Ana karakter"
                              : edge.role === "SUPPORTING"
                                ? "Yardımcı"
                                : edge.role}
                          </p>
                          {va && (
                            <Link
                              href={`/staff/${va.id}`}
                              className="mt-0.5 block truncate text-[11px] text-muted-500 transition-colors hover:text-accent-700"
                            >
                              CV: {va.name.full}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {anime.recommendations.nodes.length > 0 && (
              <section id="similar" className="mt-16 scroll-mt-32">
                <SectionHeading>Benzer animeler</SectionHeading>
                <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4">
                  {anime.recommendations.nodes
                    .filter((n) => n.mediaRecommendation)
                    .map((n) => {
                      const r = n.mediaRecommendation!;
                      const rTitle = pickTitle(r.title);
                      const rCover =
                        r.coverImage.extraLarge ?? r.coverImage.large;
                      return (
                        <Link
                          key={r.id}
                          href={`/anime/${r.id}`}
                          className="group block"
                        >
                          <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] bg-ink-800 ring-1 ring-ink-800">
                            {rCover && (
                              <Image
                                src={rCover}
                                alt={rTitle}
                                fill
                                quality={85}
                                sizes="(max-width: 640px) 33vw, 20vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                              />
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-medium text-cream-50 transition-colors group-hover:text-accent-700">
                            {rTitle}
                          </p>
                        </Link>
                      );
                    })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8">
            {scoreBuckets.length > 0 && (
              <ScoreDistribution
                scores={scoreBuckets}
                meanScore={anime.meanScore}
                rankings={rankings}
              />
            )}

            {anime.genres.length > 0 && (
              <section>
                <AsideHeading>Türler</AsideHeading>
                <div className="mt-3 flex flex-wrap gap-2">
                  {anime.genres.map((g) => (
                    <Link
                      key={g}
                      href={`/search?genre=${encodeURIComponent(g)}`}
                      className="rounded-full border border-ink-700 bg-ink-900/60 px-3 py-1 text-xs text-cream-200 transition-colors hover:border-accent-500 hover:text-accent-700"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {streamingLinks.length > 0 && (
              <section>
                <AsideHeading>Nerede izlenir</AsideHeading>
                <ul className="mt-3 space-y-2">
                  {streamingLinks.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-ink-800 px-3 py-2 text-sm transition-colors hover:border-ink-600 hover:bg-ink-900/60"
                      >
                        <span className="text-cream-50">{link.site}</span>
                        <span className="text-xs text-muted-400">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {anime.nextAiringEpisode && (
              <section>
                <AsideHeading>Sıradaki bölüm</AsideHeading>
                <p className="mt-3 text-sm text-cream-200">
                  {anime.nextAiringEpisode.episode}. bölüm{" "}
                  <span className="text-muted-400">
                    ({formatDate(anime.nextAiringEpisode.airingAt)})
                  </span>
                </p>
              </section>
            )}

            {otherLinks.length > 0 && (
              <section>
                <AsideHeading>Bağlantılar</AsideHeading>
                <ul className="mt-3 space-y-1.5">
                  {otherLinks.map((link: ExternalLink) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-400 transition-colors hover:text-cream-50"
                      >
                        {link.site} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {anime.tags.length > 0 && (
              <section>
                <AsideHeading>Etiketler</AsideHeading>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {anime.tags
                    .filter((t) => !t.isMediaSpoiler && t.rank >= 40)
                    .slice(0, 12)
                    .map((t) => (
                      <span
                        key={t.name}
                        className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-cream-200/80"
                      >
                        {t.name}
                      </span>
                    ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {trailerOpen && hasTrailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/90 p-4 backdrop-blur-sm"
            onClick={() => setTrailerOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} fragmanı`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setTrailerOpen(false)}
                className="absolute -top-10 right-0 rounded-full px-3 py-1 text-sm text-cream-200 transition-colors hover:text-white"
                aria-label="Kapat"
              >
                Kapat ✕
              </button>

              <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-card)] bg-black shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${anime.trailer!.id}?autoplay=1&rel=0`}
                  title={`${title} fragmanı`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function RelationCard({ anime }: { anime: RelationNode }) {
  const title = pickTitle(anime.title);
  const cover = anime.coverImage.large ?? anime.coverImage.extraLarge;

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group block rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] bg-ink-800 ring-1 ring-inset ring-ink-700/60 transition-all group-hover:-translate-y-0.5 group-hover:ring-accent-400 group-hover:shadow-lg">
        {cover && (
          <Image
            src={cover}
            alt={title}
            fill
            quality={85}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        )}
        {anime.averageScore != null && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-night-950/85 px-1.5 py-0.5 text-[10px] font-semibold text-accent-400 backdrop-blur-sm">
            ★ {anime.averageScore}
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium text-cream-50 transition-colors group-hover:text-accent-700">
        {title}
      </p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
        {anime.seasonYear ?? "—"}
        {anime.format ? ` · ${FORMAT_LABELS[anime.format] ?? anime.format}` : ""}
        {anime.episodes ? ` · ${anime.episodes}b` : ""}
      </p>
    </Link>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
      <span className="mr-3 inline-block h-4 w-1 -translate-y-0.5 rounded-full bg-accent-400 align-middle" />
      {children}
    </h2>
  );
}

function AsideHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
      <span className="inline-block h-3 w-0.5 rounded-full bg-accent-500" />
      {children}
    </h3>
  );
}

function formatDate(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}