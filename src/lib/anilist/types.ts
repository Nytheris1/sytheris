export interface AnimeTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface AnimeCover {
  extraLarge: string | null;
  large: string | null;
  color: string | null;
}

export interface Anime {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCover;
  bannerImage: string | null;
  description: string | null;
  averageScore: number | null;
  episodes: number | null;
  status: string | null;
  seasonYear: number | null;
  genres: string[];
  format: string | null;
}

export interface Page<T> {
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
  media: T[];
}

export interface ExternalLink {
  id: number;
  url: string;
  site: string;
  type: string | null;
  language: string | null;
  color: string | null;
}

export interface StreamingEpisode {
  title: string;
  thumbnail: string | null;
  url: string;
  site: string;
}

export interface AnimeTag {
  name: string;
  rank: number;
  isMediaSpoiler: boolean;
}

export interface ScoreBucket {
  score: number;
  amount: number;
}

export interface StatusBucket {
  status: string;
  amount: number;
}

export interface RankingEntry {
  rank: number;
  type: string;
  context: string;
  year: number | null;
  season: string | null;
  allTime: boolean;
}

export interface AnimeStats {
  scoreDistribution: ScoreBucket[];
  statusDistribution: StatusBucket[];
}

export interface CharacterEdge {
  role: string;
  node: {
    id: number;
    name: { full: string; native: string | null };
    image: { large: string | null };
  };
  voiceActors: {
    id: number;
    name: { full: string };
    image: { large: string | null };
  }[];
}

export interface Recommendation {
  mediaRecommendation: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCover;
    averageScore: number | null;
    seasonYear: number | null;
    format: string | null;
  } | null;
}

export interface RelationNode {
  id: number;
  type: string;
  title: AnimeTitle;
  coverImage: AnimeCover;
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  status: string | null;
  episodes: number | null;
}

export interface RelationEdge {
  relationType: string;
  node: RelationNode;
}

export interface AnimeDetail extends Anime {
  idMal: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  duration: number | null;
  season: string | null;
  source: string | null;
  studios: { nodes: { id: number; name: string }[] };
  trailer: { id: string; site: string; thumbnail: string | null } | null;
  externalLinks: ExternalLink[];
  streamingEpisodes: StreamingEpisode[];
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  tags: AnimeTag[];
  stats: AnimeStats;
  rankings: RankingEntry[];
  relations: { edges: RelationEdge[] };
  characters: { edges: CharacterEdge[] };
  recommendations: { nodes: Recommendation[] };
}

export interface AiringMedia {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCover;
  format: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  episodes: number | null;
}

export interface AiringScheduleEntry {
  id: number;
  episode: number;
  airingAt: number;
  media: AiringMedia;
}

export interface AiringSchedulePage {
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
  airingSchedules: AiringScheduleEntry[];
}

export interface StudioMediaNode {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCover;
  averageScore: number | null;
  seasonYear: number | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
}

export interface StudioDetail {
  id: number;
  name: string;
  isAnimationStudio: boolean;
  favourites: number | null;
  media: {
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
    };
    nodes: StudioMediaNode[];
  };
}

export interface CharacterMediaEdge {
  characterRole: string;
  node: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCover;
    averageScore: number | null;
    seasonYear: number | null;
    format: string | null;
  };
}

export interface CharacterDetail {
  id: number;
  name: {
    full: string;
    native: string | null;
    alternative: string[];
  };
  image: { large: string | null };
  description: string | null;
  favourites: number | null;
  media: {
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
    };
    edges: CharacterMediaEdge[];
  };
}

export interface StaffCharacter {
  id: number;
  name: { full: string; native: string | null };
  image: { large: string | null };
}

export interface StaffMediaEdge {
  characterRole: string;
  node: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCover;
    averageScore: number | null;
    seasonYear: number | null;
    format: string | null;
  };
  characters: StaffCharacter[];
}

export interface StaffDetail {
  id: number;
  name: {
    full: string;
    native: string | null;
    alternative: string[];
  };
  image: { large: string | null };
  description: string | null;
  favourites: number | null;
  languageV2: string | null;
  primaryOccupations: string[] | null;
  gender: string | null;
  age: number | null;
  homeTown: string | null;
  characterMedia: {
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
    };
    edges: StaffMediaEdge[];
  };
}