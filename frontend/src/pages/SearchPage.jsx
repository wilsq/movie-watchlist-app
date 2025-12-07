import { useEffect, useState } from "react";

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state-muuttujat:
  const [showModal, setShowModal] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setdetailsError] = useState("");

  useEffect(() => {
    if (!selectedMovieId) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      setdetailsError("");
      setMovieDetails(null);

      try {
        const res = await fetch(
          `http://localhost:5000/api/movie/${selectedMovieId}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load details");
        }

        setMovieDetails(data);
      } catch (err) {
        setdetailsError(err.message || "Unexpected error");
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedMovieId]);

  const handlesubmit = async (e) => {
    e.preventDefault(); // estetään formia reloadaamasta sivua

    const query = searchTerm.trim();
    if (!query) return; // tyhjällä ei haeta

    setLoading(true);
    setError(""); // Poistaa vanhat errorit jos oli
    setResults([]); // tyhjentää vanhat hakutulokset ennen uutta hakua

    try {
      const res = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.Search || []);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex justify-center px-4">
      <div className="w-full max-w-3xl py-8">
        <h1 className="text-2xl font-semibold text-slate-100 mb-4">
          Search Movies
        </h1>

        {/* Hakulomake */}
        <form onSubmit={handlesubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></input>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Virheviesti */}
        {error && (
          <div className="mb-4 rounded-md border border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Vihje kun ei tuloksia vielä */}
        {results.length === 0 && !loading && !error && (
          <p className="text-sm text-slate-400">
            Try searching for a movie title like{" "}
            <span className="font-medium text-slate-200">"Matrix"</span>{" "}
          </p>
        )}

        {/* Hakutulokset */}
        <section className="space-y-3">
          {results.map((movie) => (
            <article
              key={movie.imdbID}
              onClick={() => {
                setSelectedMovieId(movie.imdbID);
                setShowModal(true);
                setMovieDetails(null);
                setdetailsError("");
              }}
              className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 hover:outline-none hover:ring-2 hover:ring-emerald-500"
            >
              {/* Poster-kuva, jos saatavilla */}
              {movie.Poster && movie.Poster !== "N/A" && (
                <img
                  src={movie.Poster}
                  alt={movie.Title}
                  className="h-24 w-16 flex-shrink-0 rounded object-cover"
                />
              )}

              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    {movie.Title}
                  </h2>
                  <p className="text-xs text-slate-400">{movie.Year}</p>
                </div>

                {/* Tähän tulee myöhemmin "Add to watched" -nappi */}
              </div>
            </article>
          ))}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          {/* Modal-kortti */}
          <div
            className="relative w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-xl
"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedMovieId(null);
                setMovieDetails(null);
              }}
              className="absolute right-3 top-3 rounded-full p-2 bg-slate-800 hover:bg-emerald-600 transition text-slate-300 hover:text-slate-900"
            >
              X
            </button>

            {/* Loading-tila */}
            {loadingDetails && (
              <p className="text-slate-300 text-center py-6">
                Loading details...
              </p>
            )}

            {/* Error-tila */}
            {detailsError && (
              <p className="text-red-400 text-center py-6">{detailsError}</p>
            )}

            {/* Sisältö */}
            {movieDetails && (
              <>
                <div className="flex gap-4">
                  {movieDetails.Poster && movieDetails.Poster !== "N/A" && (
                    <img
                      src={movieDetails.Poster}
                      alt={movieDetails.Title}
                      className="h-56 w-40 rounded object-cover shadow-lg flex-shrink-0"
                    />
                  )}

                  <div>
                    <h2 className="text-xl font-semibold text-slate-100 truncate">
                      {movieDetails.Title}{" "}
                      <span className="inline-block flex-shrink-0 rounded bg-slate-800 px-2 py-0.5 text-sm text-emerald-300">
                        ⭐ {movieDetails.imdbRating}
                      </span>
                    </h2>

                    <p className="text-sm text-slate-400">
                      {movieDetails.Year} • {movieDetails.Genre}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-[15px] leading-relaxed text-slate-300 max-w-prose">
                  <p>{movieDetails.Plot}</p>
                </div>
                <div className="mt-6 space-y-1 text-sm text-slate-400">
                  <p>
                    <span className="font-medium text-slate-300">
                      Director:
                    </span>{" "}
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
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default SearchPage;
