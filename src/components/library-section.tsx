"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimeCard } from "@/components/anime-card";
import { EmptyState } from "@/components/empty-state";
import {
  useLibrary,
  removeFromLibrary,
  STATUS_LABELS,
  STATUS_ICONS,
  STATUS_ORDER,
} from "@/lib/user-data";
import type { WatchStatus, LibraryEntry } from "@/lib/user-data";
import type { Anime } from "@/lib/anilist/types";
import { useConfirm } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

type Tab = WatchStatus;
type SortKey =
  | "updated_desc"
  | "rating_desc"
  | "rating_asc"
  | "year_desc"
  | "year_asc"
  | "title_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated_desc", label: "Son güncellenen" },
  { value: "rating_desc", label: "Puan: yüksek → düşük" },
  { value: "rating_asc", label: "Puan: düşük → yüksek" },
  { value: "year_desc", label: "Yıl: yeni → eski" },
  { value: "year_asc", label: "Yıl: eski → yeni" },
  { value: "title_asc", label: "İsim: A → Z" },
];

export function LibrarySection() {
  const [tab, setTab] = useState<Tab>("watching");
  const [sortKey, setSortKey] = useState<SortKey>("updated_desc");
  const [search, setSearch] = useState("");
  const library = useLibrary();
  const { confirm } = useConfirm();
  const toast = useToast();

  const byStatus = useMemo(() => {
    const map: Record<WatchStatus, LibraryEntry[]> = {
      watching: [],
      planned: [],
      completed: [],
      dropped: [],
    };
    for (const entry of library) map[entry.status].push(entry);
    return map;
  }, [library]);

  const counts: Record<Tab, number> = {
    watching: byStatus.watching.length,
    planned: byStatus.planned.length,
    completed: byStatus.completed.length,
    dropped: byStatus.dropped.length,
  };

  const filteredAndSorted = useMemo(() => {
    let items = byStatus[tab];

    const q = search.trim().toLocaleLowerCase("tr-TR");
    if (q) {
      items = items.filter((it) =>
        it.title.toLocaleLowerCase("tr-TR").includes(q),
      );
    }

    const sorted = [...items];
    switch (sortKey) {
      case "updated_desc":
        sorted.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case "rating_desc":
        sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
        break;
      case "rating_asc":
        sorted.sort((a, b) => (a.rating ?? 999) - (b.rating ?? 999));
        break;
      case "year_desc":
        sorted.sort((a, b) => (b.seasonYear ?? 0) - (a.seasonYear ?? 0));
        break;
      case "year_asc":
        sorted.sort((a, b) => (a.seasonYear ?? 9999) - (b.seasonYear ?? 9999));
        break;
      case "title_asc":
        sorted.sort((a, b) =>
          a.title.localeCompare(b.title, "tr-TR", { sensitivity: "base" }),
        );
        break;
    }

    return sorted;
  }, [byStatus, tab, search, sortKey]);

  const currentList = filteredAndSorted.map(libraryToAnime);

  const isListMode = tab === "completed" || tab === "dropped";
  const totalInTab = byStatus[tab].length;
  const showing = filteredAndSorted.length;

  async function clearCurrentList() {
    const ok = await confirm({
      title: "Listeyi temizle",
      description: `Bu durumdaki ${totalInTab} anime listeden silinecek. Bu işlem geri alınamaz.`,
      confirmLabel: "Temizle",
      variant: "danger",
    });
    if (!ok) return;
    byStatus[tab].forEach((e) => removeFromLibrary(e.id));
    toast.success("Liste temizlendi");
  }

  async function handleRemoveOne(id: number, title: string) {
    const ok = await confirm({
      title: "Listeden kaldır",
      description: `"${title}" kitaplıktan çıkarılacak.`,
      confirmLabel: "Kaldır",
      variant: "danger",
    });
    if (!ok) return;
    removeFromLibrary(id);
    toast.success("Kaldırıldı", title);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-ink-800 bg-ink-900/30 p-4 sm:p-6">
        <div className="scrollbar-hide -mx-2 flex gap-1.5 overflow-x-auto px-2">
          {STATUS_ORDER.map((s) => {
            const active = tab === s;
            return (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5 sm:py-2 sm:text-sm",
                  active
                    ? "border-accent-400 bg-accent-400/10 text-accent-700"
                    : "border-ink-800 text-cream-200 hover:border-ink-700",
                )}
                aria-pressed={active}
              >
                <span aria-hidden className="mr-1 text-[10px] sm:mr-1.5 sm:text-xs">
                  {STATUS_ICONS[s]}
                </span>
                {STATUS_LABELS[s]}
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[9px] tabular-nums sm:ml-2 sm:text-[10px]",
                    active
                      ? "bg-accent-400/20 text-accent-700"
                      : "bg-ink-800/70 text-muted-400",
                  )}
                >
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {totalInTab > 0 && (
        <section className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kitaplıkta ara…"
              className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2 pr-9 text-xs text-cream-50 placeholder:text-muted-500 focus:border-accent-400 focus:outline-none sm:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Aramayı temizle"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-400 transition-colors hover:text-cream-50"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="shrink-0 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-cream-50 focus:border-accent-400 focus:outline-none sm:text-sm"
            aria-label="Sıralama"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <span className="shrink-0 text-center font-mono text-[10px] uppercase tracking-wider text-muted-400 sm:text-right">
            {search ? `${showing} / ${totalInTab}` : `${totalInTab} kayıt`}
          </span>
        </section>
      )}

      {totalInTab === 0 ? (
        <EmptyState
          icon={STATUS_ICONS[tab]}
          title={emptyLibraryTitle(tab)}
          description={emptyLibraryDescription(tab)}
          action={{ href: "/search", label: "Anime ara" }}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon="search"
          title="Sonuç bulunamadı"
          description={`"${search}" ile eşleşen kayıt yok.`}
          action={{ onClick: () => setSearch(""), label: "Aramayı temizle" }}
        />
      ) : (
        <>
          {isListMode && (
            <div className="flex justify-end">
              <button
                onClick={clearCurrentList}
                className="text-xs text-muted-400 transition-colors hover:text-crimson-500 sm:text-sm"
              >
                Bu listeyi temizle
              </button>
            </div>
          )}

          {isListMode ? (
            <ul className="divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800 bg-ink-900/30">
              {filteredAndSorted.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3.5"
                >
                  <Link
                    href={`/anime/${h.id}`}
                    className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-800 sm:h-20 sm:w-14"
                  >
                    {h.cover && (
                      <Image
                        src={h.cover}
                        alt={h.title}
                        fill
                        quality={85}
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/anime/${h.id}`}
                      className="line-clamp-2 text-xs font-medium text-cream-50 transition-colors hover:text-accent-700 sm:text-sm"
                    >
                      {h.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-400 sm:mt-1 sm:text-xs">
                      <span>{h.seasonYear ?? "—"}</span>
                      <span>·</span>
                      <span>{h.format ?? "—"}</span>
                      {h.rating != null && (
                        <>
                          <span>·</span>
                          <span className="text-accent-700">★ {h.rating}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveOne(h.id, h.title)}
                    className="shrink-0 rounded-full px-2 py-1 text-[11px] text-muted-400 transition-colors hover:text-crimson-500 sm:px-3 sm:text-xs"
                    aria-label="Listeden kaldır"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4">
              {currentList.map((a, i) => (
                <div key={a.id} className="relative">
                  <AnimeCard anime={a} index={i} expandOnHover={false} />
                  {byStatus[tab].find((b) => b.id === a.id)?.rating != null && (
                    <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-accent-400 px-2 py-0.5 font-mono text-[10px] font-semibold text-night-950 shadow-md">
                      ★ {byStatus[tab].find((b) => b.id === a.id)?.rating}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function emptyLibraryTitle(tab: WatchStatus): string {
  switch (tab) {
    case "watching":
      return "Şu an bir şey izlemiyorsun.";
    case "planned":
      return "İzleme planın boş.";
    case "completed":
      return "Bitirdiğin anime yok.";
    case "dropped":
      return "Bıraktığın anime yok.";
  }
}

function emptyLibraryDescription(tab: WatchStatus): string {
  switch (tab) {
    case "watching":
      return "Detay sayfasından “İzliyorum” olarak işaretle.";
    case "planned":
      return "İzlemek istediklerini “İzleyeceğim” olarak işaretle.";
    case "completed":
      return "Bitirdiğin animeleri işaretle.";
    case "dropped":
      return "Yarıda bıraktıklarını buraya taşıyabilirsin.";
  }
}

function libraryToAnime(f: {
  id: number;
  title: string;
  cover: string | null;
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
}): Anime {
  return {
    id: f.id,
    title: { romaji: f.title, english: null, native: null },
    coverImage: { extraLarge: f.cover, large: f.cover, color: null },
    bannerImage: null,
    description: null,
    averageScore: f.averageScore,
    episodes: null,
    status: null,
    seasonYear: f.seasonYear,
    genres: [],
    format: f.format,
  };
}