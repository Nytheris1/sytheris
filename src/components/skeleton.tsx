import { cn } from "@/lib/utils";

export function AnimeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)} aria-hidden="true">
      <div className="aspect-[2/3] rounded-[var(--radius-card)] bg-ink-800" />
      <div className="mt-3 h-3.5 w-4/5 rounded bg-ink-800" />
      <div className="mt-2 h-3 w-3/5 rounded bg-ink-800/70" />
    </div>
  );
}

export function CardGridSkeleton({
  count = 10,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        className,
      )}
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section
      className="relative h-[88vh] min-h-[640px] w-full overflow-hidden bg-night-900"
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-night-800 to-night-900" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/15" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/50 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-12 md:pb-16">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-32 rounded bg-ink-800" />
          <div className="h-16 w-4/5 rounded bg-ink-800 md:h-24" />
          <div className="h-4 w-3/5 rounded bg-ink-800/70" />
          <div className="h-4 w-2/3 rounded bg-ink-800/60" />
          <div className="h-4 w-1/2 rounded bg-ink-800/60" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-40 rounded-full bg-ink-800" />
            <div className="h-12 w-44 rounded-full bg-ink-800/60" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AnimeDetailSkeleton() {
  return (
    <main className="pb-24" aria-busy="true" aria-label="Yükleniyor">
      <div className="relative h-[52vh] min-h-[380px] w-full overflow-hidden bg-night-900">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-night-800 to-night-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/10" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="-mt-44 flex flex-col gap-8 md:-mt-56 md:flex-row md:items-end">
          <div className="aspect-[2/3] w-40 shrink-0 animate-pulse rounded-[var(--radius-card)] bg-ink-800 shadow-2xl md:w-56" />

          <div className="flex-1 animate-pulse space-y-4 pb-2">
            <div className="h-10 w-4/5 rounded bg-ink-800 md:h-14" />
            <div className="h-4 w-1/3 rounded bg-ink-800/70" />
            <div className="flex gap-3">
              <div className="h-4 w-20 rounded bg-ink-800/60" />
              <div className="h-4 w-16 rounded bg-ink-800/60" />
              <div className="h-4 w-24 rounded bg-ink-800/60" />
            </div>
            <div className="h-8 w-48 rounded bg-ink-800/70" />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <div className="h-12 w-40 animate-pulse rounded-full bg-ink-800" />
          <div className="h-12 w-44 animate-pulse rounded-full bg-ink-800/70" />
          <div className="h-12 w-36 animate-pulse rounded-full bg-ink-800/70" />
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 rounded bg-ink-800" />
            <div className="h-4 w-full rounded bg-ink-800/70" />
            <div className="h-4 w-11/12 rounded bg-ink-800/70" />
            <div className="h-4 w-full rounded bg-ink-800/70" />
            <div className="h-4 w-3/4 rounded bg-ink-800/70" />
          </div>

          <div className="animate-pulse space-y-4">
            <div className="h-4 w-20 rounded bg-ink-800" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-16 rounded-full bg-ink-800/70" />
              <div className="h-7 w-20 rounded-full bg-ink-800/70" />
              <div className="h-7 w-14 rounded-full bg-ink-800/70" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}