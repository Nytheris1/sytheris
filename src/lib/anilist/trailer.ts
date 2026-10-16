import { anilistRequest } from "./client";

const TRAILER_QUERY = /* GraphQL */ `
  query AnimeTrailer($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      trailer {
        id
        site
      }
    }
  }
`;

export interface TrailerInfo {
  id: string;
  site: string;
}

interface TrailerResponse {
  Media: {
    id: number;
    trailer: { id: string; site: string } | null;
  } | null;
}

export async function fetchTrailer(
  animeId: number,
  options?: { signal?: AbortSignal },
): Promise<TrailerInfo | null> {
  try {
    const data = await anilistRequest<TrailerResponse>(
      TRAILER_QUERY,
      { id: animeId },
      { signal: options?.signal },
    );
    const trailer = data.Media?.trailer;
    if (!trailer) return null;

    const site = trailer.site.toLowerCase();
    if (site !== "youtube" && site !== "dailymotion") {
      return null;
    }

    return { id: trailer.id, site };
  } catch {
    return null;
  }
}