import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let watchedMovies = [];

// Hae kaikki katsotut elokuvat
app.get("/api/watched", (req, res) => {
  res.json(watchedMovies);
});

// Lisää elokuva katsottuihin
app.post("/api/watched", (req, res) => {
  const { imdbID, title, year, poster } = req.body;

  if (!imdbID || !title) {
    return res.status(400).json({ error: "imdbID ja title ovat pakollisia" });
  }

  const exists = watchedMovies.some((movie) => movie.id === imdbID);

  if (exists) {
    return res.status(400).json({ error: "Movie already in watched list" });
  }

  const newMovie = {
    id: imdbID,
    title,
    year,
    poster,
    addedAt: new Date().toISOString(),
  };

  watchedMovies.push(newMovie);

  return res.status(201).json(newMovie);
});

// Poista elokuva katsotuista ID:n perusteella
app.delete("/api/watched/:id", (req, res) => {
  const { id } = req.params;

  const index = watchedMovies.findIndex((movie) => movie.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Movie not found" });
  }

  watchedMovies.splice(index, 1);

  return res.status(204).send();
});

// OMDB-hakureitti
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.OMDB_API_KEY;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter q" });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "OMDB_API_KEY is not set in .env" });
  }

  try {
    const url = `http://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(
      query
    )}&type=movie`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "False") {
      return res.status(404).json({ error: data.Error || "No movies found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error fetching from OMDB", err);
    return res.status(500).json({ error: "Failed to fetch from OMDB" });
  }
});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
