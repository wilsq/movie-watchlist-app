export type WatchedMovie = {
  id: string; // imdb_id
  title: string;
  year: string;
  poster: string | null;
  addedAt: string;
};

export type AddWatchedMovieBody = {
  imdbID: string;
  title: string;
  year?: string;
  poster?: string;
};

export type WatchedMovieRow = {
  imdb_id: string;
  title: string;
  year: string;
  poster: string | null;
  added_at: string;
};
