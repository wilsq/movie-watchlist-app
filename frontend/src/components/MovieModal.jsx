import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function MovieModal({ movieId, onClose }) {
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!movieId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      setMovieDetails(null);

      try {
        const res = await fetch(`${API_BASE}/api/movie/${movieId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load movie details");
        }

        setMovieDetails(data);
      } catch (err) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [movieId]);

  if (!movieId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-xl">
        {/* Close button */}

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full px-2 py-1 
             text-slate-300 hover:text-white 
             hover:bg-emerald-600/70 
             transition-colors duration-200"
        >
          X
        </button>

        {/* Loading */}
        {loading && (
          <p className="text-slate-300 text-center py-10">Loading details...</p>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-center py-10">{error}</p>}

        {/* Movie content */}
        {movieDetails && (
          <div className="flex gap-6">
            {/* LEFT SIDE – POSTER */}
            <div className="flex-shrink-0">
              <img
                src={movieDetails.Poster}
                alt={movieDetails.Title}
                className="h-56 w-40 rounded object-cover shadow-lg"
              />
            </div>

            {/* TEXT */}
            <div className="flex flex-col justify-start w-full">
              {/* Title + Rating */}
              <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                {movieDetails.Title}
                <span className="rounded bg-slate-800 px-2 py-0.5 text-sm text-emerald-300">
                  ⭐ {movieDetails.imdbRating}
                </span>
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                {movieDetails.Year} • {movieDetails.Genre}
              </p>

              {/* Plot */}
              <p className="text-slate-300 mt-8 text-[15px] leading-relaxed">
                {movieDetails.Plot}
              </p>

              {/* Extra info */}
              <div className="mt-6 space-y-1 text-sm text-slate-400">
                <p>
                  <span className="font-medium text-slate-300">Director:</span>{" "}
                  {movieDetails.Director}
                </p>
                <p>
                  <span className="font-medium text-slate-300">Runtime:</span>{" "}
                  {movieDetails.Runtime}
                </p>
                <p>
                  <span className="font-medium text-slate-300">Actors:</span>{" "}
                  {movieDetails.Actors}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieModal;
