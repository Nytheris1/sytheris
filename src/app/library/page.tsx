"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LibraryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings");
  }, [router]);
  return (
    <main className="mx-auto max-w-7xl px-6 py-24 text-center">
      <p className="text-muted-400">Ayarlara yönlendiriliyor…</p>
    </main>
  );
}