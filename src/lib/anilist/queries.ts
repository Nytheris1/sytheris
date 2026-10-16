export const TRENDING_ANIME = /* GraphQL */ `
  query TrendingAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        status
        seasonYear
        genres
        format
      }
    }
  }
`;

export const POPULAR_THIS_SEASON = /* GraphQL */ `
  query PopularThisSeason($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(
        sort: POPULARITY_DESC
        type: ANIME
        isAdult: false
        season: $season
        seasonYear: $seasonYear
      ) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        status
        seasonYear
        genres
        format
      }
    }
  }
`;

export const ANIME_DETAIL = /* GraphQL */ `
  query AnimeDetail($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      coverImage { extraLarge large color }
      bannerImage
      description(asHtml: false)
      averageScore
      meanScore
      popularity
      favourites
      episodes
      duration
      status
      season
      seasonYear
      format
      source
      genres
      studios(isMain: true) { nodes { id name } }
      trailer { id site thumbnail }
      externalLinks { id url site type language color }
      streamingEpisodes { title thumbnail url site }
      nextAiringEpisode { episode airingAt timeUntilAiring }
      startDate { year month day }
      endDate { year month day }
      tags { name rank isMediaSpoiler }
      stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
      }
      rankings {
        rank
        type
        context
        year
        season
        allTime
      }
      relations {
        edges {
          relationType(version: 2)
          node {
            id
            type
            title { romaji english native }
            coverImage { extraLarge large color }
            format
            seasonYear
            averageScore
            status
            episodes
          }
        }
      }
      characters(sort: [ROLE, RELEVANCE], perPage: 8) {
        edges {
          role
          node {
            id
            name { full native }
            image { large }
          }
          voiceActors(language: JAPANESE) {
            id
            name { full }
            image { large }
          }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 8) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english native }
            coverImage { extraLarge large color }
            averageScore
            seasonYear
            format
          }
        }
      }
    }
  }
`;

export const SEARCH_ANIME = /* GraphQL */ `
  query SearchAnime(
    $page: Int
    $perPage: Int
    $search: String
    $genre_in: [String]
    $seasonYear: Int
    $format_in: [MediaFormat]
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(
        type: ANIME
        isAdult: false
        search: $search
        genre_in: $genre_in
        seasonYear: $seasonYear
        format_in: $format_in
        sort: $sort
      ) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        status
        seasonYear
        genres
        format
      }
    }
  }
`;

export const GENRE_COLLECTION = /* GraphQL */ `
  query GenreCollection {
    GenreCollection
  }
`;

export const RANDOM_ANIME = /* GraphQL */ `
  query RandomAnime(
    $page: Int
    $perPage: Int
    $genre_in: [String]
    $startDate_greater: FuzzyDateInt
    $startDate_lesser: FuzzyDateInt
    $format_in: [MediaFormat]
    $averageScore_greater: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage }
      media(
        type: ANIME
        isAdult: false
        genre_in: $genre_in
        startDate_greater: $startDate_greater
        startDate_lesser: $startDate_lesser
        format_in: $format_in
        averageScore_greater: $averageScore_greater
        sort: POPULARITY_DESC
      ) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        status
        seasonYear
        genres
        format
      }
    }
  }
`;

export const AIRING_SCHEDULE = /* GraphQL */ `
  query AiringSchedule($from: Int, $to: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      airingSchedules(
        airingAt_greater: $from
        airingAt_lesser: $to
        sort: TIME
      ) {
        id
        episode
        airingAt
        media {
          id
          title { romaji english native }
          coverImage { extraLarge large color }
          format
          seasonYear
          averageScore
          episodes
        }
      }
    }
  }
`;

export const RECENT_EPISODES = /* GraphQL */ `
  query RecentEpisodes($from: Int, $to: Int, $mediaIds: [Int], $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      airingSchedules(
        airingAt_greater: $from
        airingAt_lesser: $to
        mediaId_in: $mediaIds
        sort: TIME_DESC
      ) {
        id
        episode
        airingAt
        media {
          id
          title { romaji english native }
          coverImage { extraLarge large color }
          format
          seasonYear
          averageScore
          episodes
        }
      }
    }
  }
`;

export const STUDIO_DETAIL = /* GraphQL */ `
  query StudioDetail($id: Int) {
    Studio(id: $id) {
      id
      name
      isAnimationStudio
      favourites
      media(page: 1, perPage: 40, sort: POPULARITY_DESC, isMain: true) {
        pageInfo { total currentPage lastPage hasNextPage }
        nodes {
          id
          title { romaji english native }
          coverImage { extraLarge large color }
          averageScore
          seasonYear
          format
          episodes
          status
        }
      }
    }
  }
`;

export const CHARACTER_DETAIL = /* GraphQL */ `
  query CharacterDetail($id: Int) {
    Character(id: $id) {
      id
      name { full native alternative }
      image { large }
      description(asHtml: false)
      favourites
      media(page: 1, perPage: 30, sort: POPULARITY_DESC) {
        pageInfo { total currentPage lastPage hasNextPage }
        edges {
          characterRole
          node {
            id
            title { romaji english native }
            coverImage { extraLarge large color }
            averageScore
            seasonYear
            format
          }
        }
      }
    }
  }
`;

export const STAFF_DETAIL = /* GraphQL */ `
  query StaffDetail($id: Int) {
    Staff(id: $id) {
      id
      name { full native alternative }
      image { large }
      description(asHtml: false)
      favourites
      languageV2
      primaryOccupations
      gender
      age
      homeTown
      characterMedia(page: 1, perPage: 30, sort: START_DATE_DESC) {
        pageInfo { total currentPage lastPage hasNextPage }
        edges {
          characterRole
          node {
            id
            title { romaji english native }
            coverImage { extraLarge large color }
            averageScore
            seasonYear
            format
          }
          characters {
            id
            name { full native }
            image { large }
          }
        }
      }
    }
  }
`;


export const SEARCH_CHARACTER = /* GraphQL */ `
  query SearchCharacter($search: String) {
    Page(page: 1, perPage: 1) {
      characters(search: $search, sort: FAVOURITES_DESC) {
        id
        name { full native }
        image { large }
        description(asHtml: false)
        favourites
        media(page: 1, perPage: 3, sort: POPULARITY_DESC) {
          nodes {
            id
            title { romaji english native }
            coverImage { large extraLarge }
          }
        }
      }
    }
  }
`;

export const SEARCH_STUDIO = /* GraphQL */ `
  query SearchStudio($search: String) {
    Page(page: 1, perPage: 1) {
      studios(search: $search, sort: FAVOURITES_DESC) {
        id
        name
        isAnimationStudio
        favourites
        media(page: 1, perPage: 5, sort: POPULARITY_DESC, isMain: true) {
          nodes {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            seasonYear
            format
          }
        }
      }
    }
  }
`;

export const TOP_ANIME = /* GraphQL */ `
  query TopAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, isAdult: false, sort: SCORE_DESC) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        averageScore
        seasonYear
        format
        episodes
        genres
      }
    }
  }
`;

export const CURRENT_SEASON = /* GraphQL */ `
  query CurrentSeason($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(
        type: ANIME
        isAdult: false
        season: $season
        seasonYear: $seasonYear
        sort: POPULARITY_DESC
      ) {
        id
        title { romaji english native }
        coverImage { extraLarge large color }
        averageScore
        format
        episodes
        genres
      }
    }
  }
`;