import type { FavoriteEntry, LibraryEntry } from "./user-data";

export interface UserPreferences {
  topGenres: string[];
  minYear: number | null;
  excludeIds: number[];
}

/**
 * Kullanıcının kitaplığından en sık geçen türleri ve ortalama yılı çıkarır.
 * Kitaplık en az 3 anime içermiyorsa null döner.
 */
export function derivePreferences(
  favorites: FavoriteEntry[],
  library: LibraryEntry[],
): UserPreferences | null {
  /* Aynı animeyi iki kere saymamak için id ile birleştir */
  const map = new Map<
    number,
    FavoriteEntry | LibraryEntry
  >();
  for (const f of favorites) map.set(f.id, f);
  for (const l of library) map.set(l.id, l);

  const all = Array.from(map.values());
  if (all.length < 3) return null;

  const genreCount = new Map<string, number>();
  const years: number[] = [];

  for (const item of all) {
    if (item.genres && Array.isArray(item.genres)) {
      for (const g of item.genres) {
        genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
      }
    }
    if (item.seasonYear && item.seasonYear >= 1990) {
      years.push(item.seasonYear);
    }
  }

  const topGenres = Array.from(genreCount.entries())
    .filter(([, count]) => count >= 2) // en az 2 animeye giren türler
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const excludeIds = all.map((a) => a.id);

  let minYear: number | null = null;
  if (years.length > 0) {
    const avgYear =
      years.reduce((sum, y) => sum + y, 0) / Math.max(1, years.length);
    minYear = Math.max(1990, Math.floor(avgYear) - 8);
  }

  return { topGenres, minYear, excludeIds };
}