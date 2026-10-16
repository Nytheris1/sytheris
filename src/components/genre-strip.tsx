"use client";

import Link from "next/link";

const POPULAR_GENRES = [
  { value: "Action", label: "Aksiyon" },
  { value: "Adventure", label: "Macera" },
  { value: "Comedy", label: "Komedi" },
  { value: "Drama", label: "Dram" },
  { value: "Fantasy", label: "Fantastik" },
  { value: "Horror", label: "Korku" },
  { value: "Mystery", label: "Gizem" },
  { value: "Psychological", label: "Psikolojik" },
  { value: "Romance", label: "Romantik" },
  { value: "Sci-Fi", label: "Bilim Kurgu" },
  { value: "Slice of Life", label: "Günlük Yaşam" },
  { value: "Sports", label: "Spor" },
  { value: "Supernatural", label: "Doğaüstü" },
  { value: "Thriller", label: "Gerilim" },
];

export function GenreStrip() {
  return (
    <section>
      <header className="mb-5">
        <h2 className="text-section font-display font-semibold tracking-[-0.025em]">
          Türe göre <em className="editorial-em font-normal">keşfet</em>
        </h2>
        <p className="mt-1 text-sm text-muted-400">
          Sevdiğin türe dokun, o türdeki animeler listelensin.
        </p>
      </header>

      <div className="flex flex-wrap gap-2.5">
        {POPULAR_GENRES.map((g) => (
          <Link
            key={g.value}
            href={`/search?genre=${encodeURIComponent(g.value)}`}
            className="rounded-full border border-ink-700 bg-ink-900/40 px-4 py-2 text-sm text-cream-200 transition-all hover:-translate-y-0.5 hover:border-accent-400 hover:bg-accent-400/5 hover:text-accent-400"
          >
            {g.label}
          </Link>
        ))}
      </div>
    </section>
  );
}