import { useEffect, useState } from "react";
import MovieModal from "../components/MovieModal";
import { useToast } from "../components/ToastContext";
import { WatchedMovie } from "../types/movies";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function WatchedPage() {
  const [watched, setWatched] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchWatched = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`${API_BASE}/api/watched`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: WatchedMovie[] | { error: string } = await res.json();

        if (!res.ok) {
          const message =
            "error" in data ? data.error : "Failed to load watched movies";
          throw new Error(message);
        }

        setWatched(data as WatchedMovie[]);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unexpected error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWatched();
  }, []);

  const removeMovie = async (id: string, title: string) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/watched/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to remove movie");
      }

      setWatched((prev) => prev.filter((m) => m.id !== id));
      showToast(`Removed "${title}" from watched`, "success");
    } catch (err) {
      console.error(err);

      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove movie";
      showToast(errorMessage, "error");
    }
  };

  if (loading) return <p className="text-slate-400 p-6">Loading...</p>;
  if (error) return <p className="text-red-400 p-6">{error}</p>;

  return (
    <main className="px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">
        Watched Movies
      </h1>

      {watched.length === 0 && (
        <p className="text-slate-400">You haven't added any movies yet.</p>
      )}

      <section className="space-y-4">
        {watched.map((movie) => (
          <article
            key={movie.id}
            onClick={() => {
              setSelectedMovieId(movie.id);
            }}
            className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded hover:outline-none hover:ring-2 hover:ring-emerald-500"
          >
            {/* Poster */}
            <img
              src={movie.poster ?? undefined}
              alt={movie.title}
              className="h-24 w-16 object-cover rounded"
            />

            <div className="flex-1">
              <h2 className="text-slate-100">{movie.title}</h2>
              <p className="text-slate-400 text-sm">{movie.year}</p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeMovie(movie.id, movie.title);
              }}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
            >
              Remove
            </button>
          </article>
        ))}
      </section>

      <MovieModal
        movieId={selectedMovieId}
        onClose={() => setSelectedMovieId(null)}
      />
    </main>
  );
}

export default WatchedPage;
