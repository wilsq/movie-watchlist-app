import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

const DEMO_USER_ID = 1;

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

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  // Validointi
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existing = await query(`SELECT 1 FROM users WHERE email = $1`, [
      email,
    ]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hashataan salasana
    const passwordHash = await bcrypt.hash(password, 10);

    // Tallennetaan tietokantaan
    const result = await query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Register error: ", err);
    return res.status(500).json({ error: "Failed to register" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    // Haetaan käyttäjä
    const result = await query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Tallennetaan user variableen
    const user = result.rows[0];

    // Verrataan salasanaa hashin kanssa
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Luodaan JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET is not set" });
    }

    const token = jwt.sign({ id: user.id }, secret, {
      expiresIn: "7d",
    });

    return res.json({ token });
  } catch (err) {
    console.error("Login error: ", err);
    return res.status(500).json({ error: "Failed to login" });
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
app.get("/api/watched", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT * FROM watched_movies WHERE user_id = $1 ORDER BY added_at DESC`,
      [userId]
    );

    const movies = result.rows.map((row) => ({
      id: row.imdb_id,
      title: row.title,
      year: row.year,
      poster: row.poster,
      addedAt: row.added_at,
    }));

    res.json(movies);
  } catch (err) {
    console.error("Error loading watched movies", err);
    res.status(500).json({ error: "Failed to load watched movies" });
  }
});

// Lisää katsottu
app.post("/api/watched", requireAuth, async (req, res) => {
  const userId = req.user.id; // Myöhemmin authista.

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
app.delete("/api/watched/:id", requireAuth, async (req, res) => {
  const userId = req.user.id;
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
