export interface SearchItem {
  title: string;
  poster: string;
  episodes: number;
  status: string;
  id: string;
  type: string;
  year: string;
  score: string;
  session: string;
}

export interface Episode {
  episode: string;
  session: string;
  snapshot: string;
}

export interface EpisodeResult {
  episodes: Episode[];
}

export interface DownloadLink {
  link: string;
  name: string;
}

export type DownloadLinks = DownloadLink[];

export interface DirectLink {
  content: {
    url: string;
  };
}

export interface FetchedEpisodes {
  [seriesId: string]: {
    [page: number]: Episode[];
  };
}

export interface FetchedEpisodesDlinks {
  [seriesId: string]: {
    [session: string]: DownloadLinks;
  };
}
