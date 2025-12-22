export type WatchedMovie = {
  id: string;
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
