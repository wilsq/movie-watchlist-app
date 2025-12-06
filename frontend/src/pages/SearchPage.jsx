import { useState } from "react";

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlesubmit = async (e) => {
    e.preventDefault(); // estetään formia reloadaamasta sivua

    const query = searchTerm.trim();
    if (!query) return; // tyhjällä ei haeta

    setLoading(true);
    setError("");
    setResults([]);

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
              className="flex gap-4 rounded-1g border border-slate-800 bg-slate-900/60 p-3"
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
    </main>
  );
}

export default SearchPage;
