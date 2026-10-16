"use client";

import { useSyncExternalStore } from "react";

const KEY = "sytheris.search-history.v1";
const MAX = 8;
const listeners = new Set<() => void>();
const EMPTY: readonly string[] = [];

let snapshot: string[] = [];
let initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        snapshot = parsed.filter((x): x is string => typeof x === "string").slice(0, MAX);
      }
    }
  } catch {
    snapshot = [];
  }

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      const parsed = JSON.parse(e.newValue ?? "[]");
      snapshot = Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX)
        : [];
    } catch {
      snapshot = [];
    }
    emit();
  });
}

function subscribe(cb: () => void) {
  init();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  init();
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useSearchHistory(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) as string[];
}

export function addSearchHistory(query: string) {
  init();
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;
  // Aynısı varsa öne al
  snapshot = [trimmed, ...snapshot.filter((q) => q !== trimmed)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* yoksay */
  }
  emit();
}

export function removeSearchHistory(query: string) {
  init();
  snapshot = snapshot.filter((q) => q !== query);
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* yoksay */
  }
  emit();
}

export function clearSearchHistory() {
  init();
  snapshot = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* yoksay */
  }
  emit();
}

export const POPULAR_SEARCHES = [
  "Jujutsu Kaisen",
  "One Piece",
  "Attack on Titan",
  "Chainsaw Man",
  "Frieren",
  "Solo Leveling",
  "Demon Slayer",
  "Dandadan",
  "Spy x Family",
  "Oshi no Ko",
];