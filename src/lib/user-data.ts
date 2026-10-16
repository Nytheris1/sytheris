"use client";

import { useSyncExternalStore } from "react";

const FAV_KEY = "anime.favorites.v1";
const LIB_KEY = "anime.library.v1";
const EP_KEY = "anime.episodes.v1";
const EP_RATING_KEY = "anime.episode-ratings.v1";
const EP_NOTES_KEY = "anime.episode-notes.v1";
const REWATCH_KEY = "anime.rewatch.v1";
const LEGACY_HIST_KEY = "anime.history.v1";

export interface SavedAnime {
  id: number;
  title: string;
  cover: string | null;
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  genres?: string[];
}

export interface FavoriteEntry extends SavedAnime {
  addedAt: number;
}

export type WatchStatus = "watching" | "planned" | "completed" | "dropped";

export interface LibraryEntry extends SavedAnime {
  status: WatchStatus;
  updatedAt: number;
  rating?: number;
  notes?: string;
}

export const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "İzliyorum",
  planned: "İzleyeceğim",
  completed: "İzledim",
  dropped: "Bıraktım",
};

export const STATUS_ICONS: Record<WatchStatus, string> = {
  watching: "◐",
  planned: "◇",
  completed: "✓",
  dropped: "✕",
};

export const STATUS_ORDER: WatchStatus[] = [
  "watching",
  "planned",
  "completed",
  "dropped",
];

type EpisodeMap = Record<string, number[]>;
type EpisodeRatingMap = Record<string, Record<string, number>>;
type EpisodeNotesMap = Record<string, Record<string, string>>;
type RewatchMap = Record<string, number>;

const EMPTY_FAV: FavoriteEntry[] = [];
const EMPTY_LIB: LibraryEntry[] = [];
const EMPTY_EP_MAP: EpisodeMap = {};
const EMPTY_EP_RATINGS: EpisodeRatingMap = {};
const EMPTY_EP_NOTES: EpisodeNotesMap = {};
const EMPTY_REWATCH: RewatchMap = {};
const EMPTY_EPISODES: number[] = [];
const EMPTY_RATINGS: Record<string, number> = {};
const EMPTY_NOTES: Record<string, string> = {};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let favSnapshot: FavoriteEntry[] = [];
let libSnapshot: LibraryEntry[] = [];
let epSnapshot: EpisodeMap = {};
let epRatingSnapshot: EpisodeRatingMap = {};
let epNoteSnapshot: EpisodeNotesMap = {};
let rewatchSnapshot: RewatchMap = {};
let initialized = false;

function migrate() {
  try {
    const legacy = localStorage.getItem(LEGACY_HIST_KEY);
    if (!legacy) return;
    type OldEntry = {
      id: number;
      title: string;
      cover: string | null;
      format: string | null;
      seasonYear: number | null;
      averageScore: number | null;
      watchedAt: number;
    };
    const arr = JSON.parse(legacy) as OldEntry[];
    if (Array.isArray(arr) && arr.length > 0) {
      const migrated: LibraryEntry[] = arr.map((h) => ({
        id: h.id,
        title: h.title,
        cover: h.cover,
        format: h.format,
        seasonYear: h.seasonYear,
        averageScore: h.averageScore,
        status: "completed",
        updatedAt: h.watchedAt ?? Date.now(),
      }));
      let existing: LibraryEntry[] = [];
      try {
        existing = JSON.parse(localStorage.getItem(LIB_KEY) ?? "[]") as LibraryEntry[];
      } catch {
        existing = [];
      }
      const existingIds = new Set(existing.map((e) => e.id));
      const merged = [
        ...existing,
        ...migrated.filter((m) => !existingIds.has(m.id)),
      ];
      localStorage.setItem(LIB_KEY, JSON.stringify(merged));
    }
    localStorage.removeItem(LEGACY_HIST_KEY);
  } catch {
    /* yoksay */
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  migrate();

  try {
    favSnapshot = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as FavoriteEntry[];
  } catch {
    favSnapshot = [];
  }
  try {
    libSnapshot = JSON.parse(localStorage.getItem(LIB_KEY) ?? "[]") as LibraryEntry[];
  } catch {
    libSnapshot = [];
  }
  try {
    epSnapshot = JSON.parse(localStorage.getItem(EP_KEY) ?? "{}") as EpisodeMap;
  } catch {
    epSnapshot = {};
  }
  try {
    epRatingSnapshot = JSON.parse(
      localStorage.getItem(EP_RATING_KEY) ?? "{}",
    ) as EpisodeRatingMap;
  } catch {
    epRatingSnapshot = {};
  }
  try {
    epNoteSnapshot = JSON.parse(
      localStorage.getItem(EP_NOTES_KEY) ?? "{}",
    ) as EpisodeNotesMap;
  } catch {
    epNoteSnapshot = {};
  }
  try {
    rewatchSnapshot = JSON.parse(
      localStorage.getItem(REWATCH_KEY) ?? "{}",
    ) as RewatchMap;
  } catch {
    rewatchSnapshot = {};
  }

  window.addEventListener("storage", (e) => {
    if (e.key === FAV_KEY) {
      try {
        favSnapshot = JSON.parse(e.newValue ?? "[]") as FavoriteEntry[];
      } catch {
        favSnapshot = [];
      }
      emit();
    } else if (e.key === LIB_KEY) {
      try {
        libSnapshot = JSON.parse(e.newValue ?? "[]") as LibraryEntry[];
      } catch {
        libSnapshot = [];
      }
      emit();
    } else if (e.key === EP_KEY) {
      try {
        epSnapshot = JSON.parse(e.newValue ?? "{}") as EpisodeMap;
      } catch {
        epSnapshot = {};
      }
      emit();
    } else if (e.key === EP_RATING_KEY) {
      try {
        epRatingSnapshot = JSON.parse(
          e.newValue ?? "{}",
        ) as EpisodeRatingMap;
      } catch {
        epRatingSnapshot = {};
      }
      emit();
    } else if (e.key === EP_NOTES_KEY) {
      try {
        epNoteSnapshot = JSON.parse(e.newValue ?? "{}") as EpisodeNotesMap;
      } catch {
        epNoteSnapshot = {};
      }
      emit();
    } else if (e.key === REWATCH_KEY) {
      try {
        rewatchSnapshot = JSON.parse(e.newValue ?? "{}") as RewatchMap;
      } catch {
        rewatchSnapshot = {};
      }
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  init();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getFavSnapshot(): FavoriteEntry[] {
  init();
  return favSnapshot;
}
function getLibSnapshot(): LibraryEntry[] {
  init();
  return libSnapshot;
}
function getEpSnapshot(): EpisodeMap {
  init();
  return epSnapshot;
}
function getEpRatingSnapshot(): EpisodeRatingMap {
  init();
  return epRatingSnapshot;
}
function getEpNoteSnapshot(): EpisodeNotesMap {
  init();
  return epNoteSnapshot;
}
function getRewatchSnapshot(): RewatchMap {
  init();
  return rewatchSnapshot;
}

export function useFavorites(): FavoriteEntry[] {
  return useSyncExternalStore(subscribe, getFavSnapshot, () => EMPTY_FAV);
}

export function useLibrary(): LibraryEntry[] {
  return useSyncExternalStore(subscribe, getLibSnapshot, () => EMPTY_LIB);
}

export const useHistory = useLibrary;

export function useWatchedEpisodes(animeId: number): number[] {
  const map = useSyncExternalStore(subscribe, getEpSnapshot, () => EMPTY_EP_MAP);
  return map[String(animeId)] ?? EMPTY_EPISODES;
}

export function useEpisodeRatings(animeId: number): Record<string, number> {
  const map = useSyncExternalStore(
    subscribe,
    getEpRatingSnapshot,
    () => EMPTY_EP_RATINGS,
  );
  return map[String(animeId)] ?? EMPTY_RATINGS;
}

export function useEpisodeNotes(animeId: number): Record<string, string> {
  const map = useSyncExternalStore(
    subscribe,
    getEpNoteSnapshot,
    () => EMPTY_EP_NOTES,
  );
  return map[String(animeId)] ?? EMPTY_NOTES;
}

export function useRewatchCount(animeId: number): number {
  const map = useSyncExternalStore(
    subscribe,
    getRewatchSnapshot,
    () => EMPTY_REWATCH,
  );
  return map[String(animeId)] ?? 0;
}

function persistFav() {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAV_KEY, JSON.stringify(favSnapshot));
}
function persistLib() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIB_KEY, JSON.stringify(libSnapshot));
}
function persistEp() {
  if (typeof window === "undefined") return;
  localStorage.setItem(EP_KEY, JSON.stringify(epSnapshot));
}
function persistEpRating() {
  if (typeof window === "undefined") return;
  localStorage.setItem(EP_RATING_KEY, JSON.stringify(epRatingSnapshot));
}
function persistEpNote() {
  if (typeof window === "undefined") return;
  localStorage.setItem(EP_NOTES_KEY, JSON.stringify(epNoteSnapshot));
}
function persistRewatch() {
  if (typeof window === "undefined") return;
  localStorage.setItem(REWATCH_KEY, JSON.stringify(rewatchSnapshot));
}

export function toggleFavorite(anime: SavedAnime) {
  init();
  const exists = favSnapshot.some((f) => f.id === anime.id);
  if (exists) {
    favSnapshot = favSnapshot.filter((f) => f.id !== anime.id);
  } else {
    favSnapshot = [{ ...anime, addedAt: Date.now() }, ...favSnapshot];
  }
  persistFav();
  emit();
}

export function setStatus(anime: SavedAnime, status: WatchStatus) {
  init();
  const existing = libSnapshot.find((l) => l.id === anime.id);
  if (existing && existing.status === status) {
    libSnapshot = libSnapshot.filter((l) => l.id !== anime.id);
  } else if (existing) {
    libSnapshot = libSnapshot.map((l) =>
      l.id === anime.id ? { ...l, ...anime, status, updatedAt: Date.now() } : l,
    );
  } else {
    const entry: LibraryEntry = { ...anime, status, updatedAt: Date.now() };
    libSnapshot = [entry, ...libSnapshot];
  }
  persistLib();
  emit();
}

export function setRating(id: number, rating: number | null) {
  init();
  libSnapshot = libSnapshot.map((l) =>
    l.id === id
      ? { ...l, rating: rating == null ? undefined : rating, updatedAt: Date.now() }
      : l,
  );
  persistLib();
  emit();
}

export function setNotes(id: number, notes: string) {
  init();
  const trimmed = notes.trim();
  libSnapshot = libSnapshot.map((l) =>
    l.id === id
      ? { ...l, notes: trimmed || undefined, updatedAt: Date.now() }
      : l,
  );
  persistLib();
  emit();
}

export function getLibraryEntry(id: number): LibraryEntry | null {
  init();
  return libSnapshot.find((l) => l.id === id) ?? null;
}

export function removeFromLibrary(id: number) {
  init();
  libSnapshot = libSnapshot.filter((l) => l.id !== id);
  persistLib();
  emit();
}

export function clearLibrary() {
  init();
  libSnapshot = [];
  persistLib();
  emit();
}

export function toggleEpisodeWatched(animeId: number, episodeNumber: number) {
  init();
  const key = String(animeId);
  const current = epSnapshot[key] ?? [];
  const exists = current.includes(episodeNumber);
  const next = exists
    ? current.filter((n) => n !== episodeNumber)
    : [...current, episodeNumber].sort((a, b) => a - b);

  if (next.length === 0) {
    const { [key]: _omit, ...rest } = epSnapshot;
    epSnapshot = rest;
  } else {
    epSnapshot = { ...epSnapshot, [key]: next };
  }
  persistEp();
  emit();
}

export function setWatchedUpTo(animeId: number, upTo: number) {
  init();
  const key = String(animeId);
  const next = Array.from({ length: upTo }, (_, i) => i + 1);
  epSnapshot = { ...epSnapshot, [key]: next };
  persistEp();
  emit();
}

export function markAllEpisodes(animeId: number, total: number) {
  setWatchedUpTo(animeId, total);
}

export function resetEpisodes(animeId: number) {
  init();
  const key = String(animeId);
  const { [key]: _omit, ...rest } = epSnapshot;
  epSnapshot = rest;
  persistEp();
  emit();
}

/* ==== Bölüm puanlama ==== */
export function setEpisodeRating(
  animeId: number,
  episodeNumber: number,
  rating: number | null,
) {
  init();
  const animeKey = String(animeId);
  const epKey = String(episodeNumber);
  const current = epRatingSnapshot[animeKey] ?? {};
  const next = { ...current };

  if (rating == null) {
    delete next[epKey];
  } else {
    next[epKey] = Math.max(1, Math.min(10, Math.round(rating)));
  }

  if (Object.keys(next).length === 0) {
    const { [animeKey]: _omit, ...rest } = epRatingSnapshot;
    epRatingSnapshot = rest;
  } else {
    epRatingSnapshot = { ...epRatingSnapshot, [animeKey]: next };
  }
  persistEpRating();
  emit();
}

export function resetEpisodeRatings(animeId: number) {
  init();
  const key = String(animeId);
  const { [key]: _omit, ...rest } = epRatingSnapshot;
  epRatingSnapshot = rest;
  persistEpRating();
  emit();
}

/* ==== Bölüm notları ==== */
export function setEpisodeNote(
  animeId: number,
  episodeNumber: number,
  note: string,
) {
  init();
  const animeKey = String(animeId);
  const epKey = String(episodeNumber);
  const current = epNoteSnapshot[animeKey] ?? {};
  const next = { ...current };
  const trimmed = note.trim();

  if (!trimmed) {
    delete next[epKey];
  } else {
    next[epKey] = trimmed;
  }

  if (Object.keys(next).length === 0) {
    const { [animeKey]: _omit, ...rest } = epNoteSnapshot;
    epNoteSnapshot = rest;
  } else {
    epNoteSnapshot = { ...epNoteSnapshot, [animeKey]: next };
  }
  persistEpNote();
  emit();
}

export function resetEpisodeNotes(animeId: number) {
  init();
  const key = String(animeId);
  const { [key]: _omit, ...rest } = epNoteSnapshot;
  epNoteSnapshot = rest;
  persistEpNote();
  emit();
}

/* ==== İzleme sayacı ==== */
export function incrementRewatch(animeId: number) {
  init();
  const key = String(animeId);
  const current = rewatchSnapshot[key] ?? 0;
  rewatchSnapshot = { ...rewatchSnapshot, [key]: current + 1 };
  persistRewatch();
  emit();
}

export function decrementRewatch(animeId: number) {
  init();
  const key = String(animeId);
  const current = rewatchSnapshot[key] ?? 0;
  if (current <= 1) {
    const { [key]: _omit, ...rest } = rewatchSnapshot;
    rewatchSnapshot = rest;
  } else {
    rewatchSnapshot = { ...rewatchSnapshot, [key]: current - 1 };
  }
  persistRewatch();
  emit();
}

export function resetRewatch(animeId: number) {
  init();
  const key = String(animeId);
  const { [key]: _omit, ...rest } = rewatchSnapshot;
  rewatchSnapshot = rest;
  persistRewatch();
  emit();
}

export function markWatched(anime: SavedAnime) {
  init();
  const existing = libSnapshot.find((l) => l.id === anime.id);
  if (existing?.status === "completed") {
    removeFromLibrary(anime.id);
  } else {
    setStatus(anime, "completed");
  }
}
export const removeFromHistory = removeFromLibrary;
export const clearHistory = clearLibrary;