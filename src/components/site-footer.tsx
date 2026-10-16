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

          {/* Topluluk */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-400">
              Topluluk
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={
                    process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-cream-200 transition-colors hover:text-accent-400"
                >
                  <DiscordIcon />
                  Discord ↗
                </a>
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
function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.029.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}
