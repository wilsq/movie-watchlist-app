export type OmdbSearchItem = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};

export type OmdbSearchResponse = {
  Search: OmdbSearchItem[];
  totalResults: string;
  Response: "True" | "False";
  Error?: string;
};

export type OmdbMovieResponse = {
  Title: string;
  Year: string;
  imdbID: string;
  Plot: string;
  Poster: string;
  Response: "True" | "False";
  Error?: string;
};
