"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { anilistRequest, pickTitle } from "@/lib/anilist/client";
import { RECENT_EPISODES } from "@/lib/anilist/queries";
import { useLibrary } from "@/lib/user-data";
import type {
  AiringScheduleEntry,
  AiringSchedulePage,
} from "@/lib/anilist/types";

const ENABLED_KEY = "sytheris.notifications.enabled.v1";
const LAST_CHECK_KEY = "sytheris.notifications.lastCheck.v1";
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function getNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (v) localStorage.setItem(ENABLED_KEY, "1");
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* yoksay */
  }
}

export async function requestNotificationsPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

export function NotificationsManager() {
  const library = useLibrary();
  const lastCheckRef = useRef<number>(0);

  const watchingIds = library
    .filter((l) => l.status === "watching")
    .map((l) => l.id);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_CHECK_KEY);
      if (stored) {
        const n = Number(stored);
        if (Number.isFinite(n)) lastCheckRef.current = n;
      }
      if (lastCheckRef.current === 0) {
        lastCheckRef.current = Date.now();
        localStorage.setItem(LAST_CHECK_KEY, String(lastCheckRef.current));
      }
    } catch {
      /* yoksay */
    }
  }, []);

  const enabled = getNotificationsEnabled();
  const permissionOk =
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted";

  const { data } = useQuery({
    queryKey: ["notifications-check", watchingIds.sort().join(",")],
    enabled:
      enabled &&
      permissionOk &&
      watchingIds.length > 0 &&
      typeof window !== "undefined",
    queryFn: async ({ signal }) => {
      const now = Math.floor(Date.now() / 1000);
      const since = Math.floor(
        Math.max(
          lastCheckRef.current,
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ) / 1000,
      );

      const res = await anilistRequest<{ Page: AiringSchedulePage }>(
        RECENT_EPISODES,
        {
          from: since,
          to: now,
          mediaIds: watchingIds,
          perPage: 30,
        },
        { signal },
      );
      return res.Page.airingSchedules ?? [];
    },
    refetchInterval: CHECK_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!enabled || !permissionOk) return;
    if (!data || data.length === 0) return;

    const lastCheck = lastCheckRef.current;
    const newOnes = data.filter((ep: AiringScheduleEntry) => {
      return ep.airingAt * 1000 > lastCheck;
    });

    if (newOnes.length === 0) return;

    const seen = new Set<number>();
    for (const ep of newOnes.slice(0, 5)) {
      if (seen.has(ep.media.id)) continue;
      seen.add(ep.media.id);

      const title = pickTitle(ep.media.title);
      try {
        new Notification("Yeni bölüm!", {
          body: `${title} · ${ep.episode}. bölüm yayında`,
          icon: "/icon-192.png",
          tag: `ep-${ep.media.id}-${ep.episode}`,
        });
      } catch {
        /* yoksay */
      }
    }

    lastCheckRef.current = Date.now();
    try {
      localStorage.setItem(LAST_CHECK_KEY, String(lastCheckRef.current));
    } catch {
      /* yoksay */
    }
  }, [data, enabled, permissionOk]);

  return null;
}