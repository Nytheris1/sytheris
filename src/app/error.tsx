"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-crimson-500">
        Beklenmeyen hata
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        Bir şeyler ters gitti
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-400">
        Sayfayı yeniden deneyebilir ya da ana sayfaya dönebilirsin.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-500">Hata kodu: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-amber-500"
        >
          Tekrar dene
        </button>
        <Link
          href="/"
          className="rounded-full border border-ink-600 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50"
        >
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}