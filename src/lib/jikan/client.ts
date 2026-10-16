import type { Episode } from "./types";

interface FetchOptions {
  signal?: AbortSignal;
}

interface ApiResponse {
  episodes?: Episode[];
  error?: string;
}

export async function fetchEpisodes(
  malId: number,
  options?: FetchOptions,
): Promise<Episode[]> {
  const res = await fetch(`/api/episodes/${malId}`, {
    signal: options?.signal,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as ApiResponse;
      if (json.error) detail = json.error;
    } catch {
      /* yoksay */
    }
    throw new Error(`Bölümler alınamadı: ${detail}`);
  }

  const json = (await res.json()) as ApiResponse;
  return json.episodes ?? [];
}