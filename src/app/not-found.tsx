import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-accent-400">404</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight md:text-6xl">
        Sayfa bulunamadı
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-400">
        Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-amber-500"
        >
          Ana sayfaya dön
        </Link>
        <Link
          href="/search"
          className="rounded-full border border-ink-600 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50"
        >
          Anime ara
        </Link>
      </div>
    </main>
  );
}