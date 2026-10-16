const ANILIST_ENDPOINT = "https://graphql.anilist.co";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; status?: number }[];
}

export async function anilistRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: options?.signal,
  });

  const raw = await res.text();
  let json: GraphQLResponse<T> | null = null;
  try {
    json = JSON.parse(raw) as GraphQLResponse<T>;
  } catch {
    // JSON değilse aşağıda ham metni gösteririz
  }

  if (res.status === 429) {
    throw new Error("AniList hız sınırına takıldık. Birkaç saniye sonra tekrar dene.");
  }

  if (!res.ok) {
    const detail = json?.errors?.[0]?.message ?? raw.slice(0, 300);
    throw new Error(`AniList ${res.status}: ${detail}`);
  }

  if (json?.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "AniList GraphQL hatası");
  }
  if (!json?.data) {
    throw new Error("AniList boş yanıt döndü.");
  }

  return json.data;
}

export function pickTitle(title: {
  romaji: string | null;
  english: string | null;
  native: string | null;
}): string {
  return title.english ?? title.romaji ?? title.native ?? "Bilinmeyen";
}