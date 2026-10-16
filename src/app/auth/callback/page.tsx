"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      router.replace("/settings");
      return;
    }

    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace("/settings");
    };

    // Supabase OAuth callback'i otomatik işler (detectSessionInUrl: true)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setTimeout(go, 100);
      }
    });

    // Hemen session var mı diye kontrol et
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setTimeout(go, 100);
    });

    // Fallback: 4 saniye sonra zorla yönlendir
    const t = setTimeout(go, 4000);

    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-ink-700 border-t-accent-400" />
      <p className="mt-4 text-sm text-muted-400">Giriş tamamlanıyor…</p>
    </main>
  );
}
