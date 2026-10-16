"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";

const FAV_KEY = "anime.favorites.v1";
const LIB_KEY = "anime.library.v1";
const EP_KEY = "anime.episodes.v1";
const EP_RATING_KEY = "anime.episode-ratings.v1";
const SYNCED_AT_KEY = "sytheris.sync.lastPulledAt.v1";
const PULL_DONE_KEY = "sytheris.pull.done.v1";

const PUSH_DEBOUNCE_MS = 1500;

interface CloudData {
  favorites: unknown;
  library: unknown;
  episodes: unknown;
  episode_ratings: unknown;
  updated_at?: string;
}

function safeParse(raw: string | null, fallback: unknown) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function CloudSync() {
  const { user, loading } = useAuth();
  const [, setStatus] = useState<
    "idle" | "pulling" | "pushing" | "ready" | "error"
  >("idle");
  const pushTimerRef = useRef<number | null>(null);
  const lastPushedRef = useRef<string>("");
  const suppressUntilRef = useRef<number>(0);

  /* Pull — sadece oturum başına bir kez */
  useEffect(() => {
    if (loading) return;
    const supabase = getSupabase();
    if (!supabase || !user) {
      setStatus("idle");
      return;
    }

    /* Bu oturumda zaten pull yapıldıysa tekrar yapma */
    try {
      if (sessionStorage.getItem(PULL_DONE_KEY) === "1") {
        setStatus("ready");
        return;
      }
    } catch {
      /* yoksay */
    }

    let cancelled = false;

    (async () => {
      setStatus("pulling");
      try {
        const { data, error } = await supabase
          .from("user_data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setStatus("error");
          try {
            sessionStorage.setItem(PULL_DONE_KEY, "1");
          } catch {
            /* yoksay */
          }
          return;
        }

        if (!data) {
          /* Cloud boş → yerel verileri yukarı gönder */
          await pushToCloud(user.id, lastPushedRef, setStatus);
          if (!cancelled) {
            setStatus("ready");
            try {
              sessionStorage.setItem(PULL_DONE_KEY, "1");
            } catch {
              /* yoksay */
            }
          }
          return;
        }

        const cloud = data as CloudData;

        /* Cloud → local */
        suppressUntilRef.current = Date.now() + 3000;

        if (cloud.favorites !== undefined) {
          localStorage.setItem(FAV_KEY, JSON.stringify(cloud.favorites));
        }
        if (cloud.library !== undefined) {
          localStorage.setItem(LIB_KEY, JSON.stringify(cloud.library));
        }
        if (cloud.episodes !== undefined) {
          localStorage.setItem(EP_KEY, JSON.stringify(cloud.episodes));
        }
        if (cloud.episode_ratings !== undefined) {
          localStorage.setItem(
            EP_RATING_KEY,
            JSON.stringify(cloud.episode_ratings),
          );
        }
        localStorage.setItem(SYNCED_AT_KEY, String(Date.now()));

        /* Bu oturumda pull tamamlandı olarak işaretle */
        try {
          sessionStorage.setItem(PULL_DONE_KEY, "1");
        } catch {
          /* yoksay */
        }

        if (!cancelled) {
          setStatus("ready");
          /* Tek seferlik yenileme — bir daha tetiklenmeyecek */
          setTimeout(() => window.location.reload(), 300);
        }
      } catch {
        if (cancelled) return;
        setStatus("error");
        try {
          sessionStorage.setItem(PULL_DONE_KEY, "1");
        } catch {
          /* yoksay */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  /* Push — yerel değişiklikleri buluta gönder */
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const pushSoon = () => {
      if (Date.now() < suppressUntilRef.current) return;
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
      pushTimerRef.current = window.setTimeout(() => {
        pushToCloud(user.id, lastPushedRef, setStatus).catch(() => {});
      }, PUSH_DEBOUNCE_MS);
    };

    /* Farklı sekmeden yapılan değişiklikler */
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === FAV_KEY ||
        e.key === LIB_KEY ||
        e.key === EP_KEY ||
        e.key === EP_RATING_KEY
      ) {
        pushSoon();
      }
    };

    window.addEventListener("storage", onStorage);

    /* Aynı sekmede yapılan değişiklikler için periyodik kontrol */
    const interval = window.setInterval(() => {
      if (Date.now() < suppressUntilRef.current) return;
      const snapshot = buildSnapshot();
      const serialized = JSON.stringify(snapshot);
      if (serialized !== lastPushedRef.current) {
        pushSoon();
      }
    }, 5000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    };
  }, [user]);

  return null;
}

async function pushToCloud(
  userId: string,
  lastPushedRef: React.MutableRefObject<string>,
  setStatus: (s: "idle" | "pulling" | "pushing" | "ready" | "error") => void,
) {
  const supabase = getSupabase();
  if (!supabase) return;
  const snapshot = buildSnapshot();
  const serialized = JSON.stringify(snapshot);
  lastPushedRef.current = serialized;
  setStatus("pushing");
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      favorites: snapshot.favorites,
      library: snapshot.library,
      episodes: snapshot.episodes,
      episode_ratings: snapshot.episode_ratings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    setStatus("error");
  } else {
    setStatus("ready");
  }
}

function buildSnapshot() {
  return {
    favorites: safeParse(localStorage.getItem(FAV_KEY), []),
    library: safeParse(localStorage.getItem(LIB_KEY), []),
    episodes: safeParse(localStorage.getItem(EP_KEY), {}),
    episode_ratings: safeParse(localStorage.getItem(EP_RATING_KEY), {}),
  };
}