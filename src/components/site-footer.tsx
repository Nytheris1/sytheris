import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-800/70">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marka */}
          <div>
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-tight"
            >
              Anime<span className="text-accent-400">.</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-400">
              Kişisel anime keşif ve araştırma aracı. Favorilerini ve izleme
              geçmişini tarayıcında saklar; hesap açarsan Supabase üzerinden cihazlar arası senkronize edilir.
            </p>
          </div>

          {/* Gezinme */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
              Gezinme
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-cream-200 transition-colors hover:text-accent-400"
                >
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-cream-200 transition-colors hover:text-accent-400"
                >
                  Ara
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-cream-200 transition-colors hover:text-accent-400"
                >
                  Favoriler
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-cream-200 transition-colors hover:text-accent-400"
                >
                  Ayarlar
                </Link>
              </li>
            </ul>
          </div>

          {/* Kaynaklar */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
              Kaynaklar
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://anilist.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream-200 transition-colors hover:text-accent-400"
                >
                  AniList ↗
                </a>
              </li>
              <li>
                <a
                  href="https://graphql.anilist.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream-200 transition-colors hover:text-accent-400"
                >
                  AniList GraphQL ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ink-800/70 pt-6 text-xs text-muted-500 sm:flex-row sm:items-center">
          <p>
            Anime verileri{" "}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-cream-200 hover:underline"
            >
              AniList
            </a>{" "}
            tarafından sağlanır.
          </p>
          <p>Kişisel kullanım için yapıldı.</p>
        </div>
      </div>
    </footer>
  );
}