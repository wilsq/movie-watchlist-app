import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Väliaikainen tietokanta
let watchedMovies = [];

// Helper funktio testejä varten
export function _resetWatchedMovies() {
  watchedMovies = [];
}

// Health-check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// DB-health: Kokeillaan yhteys postgresiin
app.get("/api/db-health", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ ok: false, error: "DB connection failed" });
  }
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
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(
      query
    )}&type=movie`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "False") {
      return res.status(404).json({ error: data.Error || "No movies found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error fetching OMDB:", err);
    return res.status(500).json({ error: "Failed to fetch from OMDB" });
  }
});

// Yksittäinen elokuva haku OMDB:stä
app.get("/api/movie/:id", async (req, res) => {
  const { id } = req.params;
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OMDB_API_KEY is not set in .env" });
  }

  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${id}&plot=short`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "False") {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error fetching detailed movie:", err);
    return res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// Hae katsotut
app.get("/api/watched", async (req, res) => {
  try {
    const userId = 1;

    const result = await query(
      `SELECT * FROM watched_movies WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error loading watched movies", err);
    res.status(500).json({ error: "Failed to load watched movies" });
  }
});

// Lisää katsottu
app.post("/api/watched", async (req, res) => {
  const userId = 1; // Myöhemmin authista.
  const { imdbID, title, year, poster } = req.body;

  if (!imdbID || !title) {
    return res.status(400).json({ error: "Missing imdbID or title" });
  }

  try {
    const exists = await query(
      `SELECT 1 FROM watched_movies WHERE user_id = $1 AND imdb_id = $2`,
      [userId, imdbID]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({ error: "Movie already exists" });
    }

    const result = await query(
      `INSERT INTO watched_movies (user_id, imdb_id, title, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, imdbID, title, year, poster]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting movie", err);
    res.status(500).json({ error: "Failed to add movie" });
  }
});

// Poista elokuva
app.delete("/api/watched/:id", async (req, res) => {
  const userId = 1;
  const movieId = req.params.id;

  try {
    const result = await query(
      "DELETE FROM watched_movies WHERE user_id = $1 AND imdb_id = $2",
      [userId, movieId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting movie", err);
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

export default app;
