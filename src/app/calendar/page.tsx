"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { AIRING_SCHEDULE } from "@/lib/anilist/queries";
import type { AiringScheduleEntry, AiringSchedulePage } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const WEEKDAYS_LONG = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];
const MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

interface DayBucket {
  date: Date;
  dayKey: string;
  label: string;
  shortLabel: string;
  dayOfMonth: string;
  isToday: boolean;
  entries: AiringScheduleEntry[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function CalendarPage() {
  const reduced = useReducedMotion();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  /* 7 günlük pencere — bugünün başlangıcından itibaren */
  const { fromSec, toSec, days } = useMemo(() => {
    const today = startOfDay(new Date());
    const list: Date[] = [];
    for (let i = 0; i < 7; i++) {
      list.push(new Date(today.getTime() + i * DAY_MS));
    }
    return {
      fromSec: Math.floor(today.getTime() / 1000),
      toSec: Math.floor((today.getTime() + 7 * DAY_MS) / 1000),
      days: list,
    };
  }, []);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["airing-schedule", fromSec, toSec],
    queryFn: ({ signal }) =>
      anilistRequest<{ Page: AiringSchedulePage }>(
        AIRING_SCHEDULE,
        { from: fromSec, to: toSec, page: 1, perPage: 200 },
        { signal },
      ),
    staleTime: 15 * 60 * 1000,
  });

  /* Günlere göre grupla */
  const buckets: DayBucket[] = useMemo(() => {
    const todayKey = dayKey(new Date());
    const map = new Map<string, AiringScheduleEntry[]>();

    for (const d of days) {
      map.set(dayKey(d), []);
    }

    for (const entry of data?.Page.airingSchedules ?? []) {
      const d = new Date(entry.airingAt * 1000);
      const key = dayKey(d);
      if (map.has(key)) {
        map.get(key)!.push(entry);
      }
    }

    return days.map((d) => {
      const key = dayKey(d);
      const entries = map.get(key) ?? [];
      /* Saate göre sırala */
      entries.sort((a, b) => a.airingAt - b.airingAt);
      const isToday = key === todayKey;
      return {
        date: d,
        dayKey: key,
        label: `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
        shortLabel: WEEKDAYS_SHORT[d.getDay()],
        dayOfMonth: String(d.getDate()).padStart(2, "0"),
        isToday,
        entries,
      };
    });
  }, [data, days]);

  /* İlk açılışta bugünü seç */
  const activeKey = selectedDay ?? buckets[0]?.dayKey ?? null;
  const activeBucket = buckets.find((b) => b.dayKey === activeKey) ?? buckets[0];

  const totalCount = buckets.reduce((sum, b) => sum + b.entries.length, 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <PageHeader
        eyebrow="Yayın programı"
        title="Bu hafta"
        description={
          isPending
            ? "Yayın takvimi yükleniyor…"
            : totalCount > 0
              ? `Önümüzdeki 7 günde ${totalCount} bölüm yayınlanacak`
              : "Bu hafta için yayın bilgisi yok"
        }
      />

      {/* Gün sekmeleri */}
      <div className="mb-8">
        <div className="scrollbar-hide -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
          {buckets.map((b) => {
            const active = b.dayKey === activeKey;
            return (
              <button
                key={b.dayKey}
                onClick={() => setSelectedDay(b.dayKey)}
                className={cn(
                  "group relative flex min-w-[80px] shrink-0 flex-col items-center rounded-xl border px-3 py-3 transition-all",
                  active
                    ? "border-accent-400 bg-accent-400/10"
                    : "border-ink-800 bg-ink-900/30 hover:border-ink-700 hover:bg-ink-900/60",
                )}
                aria-pressed={active}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                    active ? "text-accent-700" : "text-muted-400",
                  )}
                >
                  {b.shortLabel}
                </span>
                <span
                  className={cn(
                    "mt-1 font-display text-xl font-semibold tabular-nums transition-colors",
                    active ? "text-cream-50" : "text-cream-200",
                  )}
                >
                  {b.dayOfMonth}
                </span>
                {b.isToday && (
                  <span
                    className={cn(
                      "mt-1 font-mono text-[9px] uppercase tracking-wider",
                      active ? "text-accent-700" : "text-muted-400",
                    )}
                  >
                    bugün
                  </span>
                )}
                {!b.isToday && b.entries.length > 0 && (
                  <span
                    className={cn(
                      "mt-1 font-mono text-[9px] tabular-nums",
                      active ? "text-accent-700" : "text-muted-400",
                    )}
                  >
                    {b.entries.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Yükleniyor */}
      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-ink-900/40"
            />
          ))}
        </div>
      )}

      {/* Hata */}
      {isError && (
        <EmptyState
          icon="!"
          title="Takvim yüklenemedi"
          description={(error as Error).message}
          action={{ onClick: () => refetch(), label: "Tekrar dene" }}
        />
      )}

      {/* İçerik */}
      {!isPending && !isError && activeBucket && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBucket.dayKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight md:text-xl">
                {activeBucket.label}
              </h2>
              <span className="font-mono text-[11px] tabular-nums text-muted-400">
                {activeBucket.entries.length} bölüm
              </span>
            </div>

            {activeBucket.entries.length === 0 ? (
              <EmptyState
                icon="—"
                title="Bu gün yayın yok"
                description="Seçili gün için planlanmış bölüm bulunmuyor."
              />
            ) : (
              <ul className="space-y-2">
                {activeBucket.entries.map((entry) => (
                  <ScheduleRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}

function ScheduleRow({ entry }: { entry: AiringScheduleEntry }) {
  const media = entry.media;
  const title = pickTitle(media.title);
  const cover = media.coverImage.large ?? media.coverImage.extraLarge;
  const time = new Date(entry.airingAt * 1000);

  const now = Date.now();
  const airingMs = entry.airingAt * 1000;
  const isAired = airingMs < now;
  const isSoon = !isAired && airingMs - now < 60 * 60 * 1000;

  return (
    <li>
      <Link
        href={`/anime/${media.id}`}
        className={cn(
          "group flex items-center gap-4 rounded-xl border p-3 transition-all",
          isAired
            ? "border-ink-800/60 bg-ink-900/20 opacity-70 hover:opacity-100"
            : isSoon
              ? "border-accent-400/50 bg-accent-400/[0.06]"
              : "border-ink-800 bg-ink-900/30 hover:border-ink-700 hover:bg-ink-900/60",
        )}
      >
        {/* Saat */}
        <div className="flex w-14 shrink-0 flex-col items-center">
          <span
            className={cn(
              "font-mono text-base font-semibold tabular-nums",
              isSoon ? "text-accent-700" : "text-cream-50",
            )}
          >
            {String(time.getHours()).padStart(2, "0")}:
            {String(time.getMinutes()).padStart(2, "0")}
          </span>
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
            {isAired ? "yayınlandı" : isSoon ? "birazdan" : "yakında"}
          </span>
        </div>

        {/* Kapak */}
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-800 ring-1 ring-ink-800">
          {cover && (
            <Image
              src={cover}
              alt={title}
              fill
              quality={85}
              sizes="56px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          )}
        </div>

        {/* Metin */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-medium text-cream-50 transition-colors group-hover:text-accent-700">
            {title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-400">
            <span className="text-accent-700">
              {entry.episode}. BÖLÜM
            </span>
            {media.format && (
              <>
                <span>·</span>
                <span>{media.format}</span>
              </>
            )}
            {media.averageScore != null && (
              <>
                <span>·</span>
                <span>★ {media.averageScore}</span>
              </>
            )}
          </p>
        </div>

        {/* Ok */}
        <span
          className="shrink-0 text-muted-400 transition-colors group-hover:text-accent-700"
          aria-hidden
        >
          →
        </span>
      </Link>
    </li>
  );
}