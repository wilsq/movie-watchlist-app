import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth } from "./middleware/auth.js";
import {
  LoginResponse,
  RegisterRequestBody,
  RegisterResponse,
  LoginRequestBody,
} from "./types/auth";
import { RequestHandler } from "express";
import {
  WatchedMovie,
  AddWatchedMovieBody,
  WatchedMovieRow,
} from "./types/movies.js";
import { OmdbMovieResponse, OmdbSearchResponse } from "./types/omdb.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://movie-watchlist.com",
      "https://www.movie-watchlist.com",
    ],

    credentials: true,
  })
);

app.use(express.json());

const DEMO_USER_ID = 1;

// // Helper funktio testejä varten
// export function _resetWatchedMovies() {
//   watchedMovies = [];
// }

// Health-check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// DB-health: Kokeillaan yhteys postgresiin
// app.get("/api/db-health", async (req, res) => {
//   try {
//     const result = await query("SELECT NOW() as now");
//     res.json({ ok: true, now: result.rows[0].now });
//   } catch (err) {
//     console.error("DB health check failed:", err);
//     res.status(500).json({ ok: false, error: err.message, code: err.code });
//   }
// });

// REGISTER

const registerHandler: RequestHandler = async (req, res) => {
  const { email, password } = req.body as RegisterRequestBody;

  // Validointi
  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const existing = await query(`SELECT 1 FROM users WHERE email = $1`, [
      email,
    ]);
    if (existing?.rowCount && existing.rowCount > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    //     // Hashataan salasana
    const passwordHash = await bcrypt.hash(password, 10);

    //     // Tallennetaan tietokantaan
    const result = await query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    res.status(201).json(result.rows[0]);
    return;
  } catch (err) {
    console.error("Register error: ", err);
    res.status(500).json({ error: "Failed to register" });
    return;
  }
};

app.post("/api/auth/register", registerHandler);

// LOGIN
const loginHandler: RequestHandler = async (req, res) => {
  const { email, password } = req.body as LoginRequestBody;

  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  try {
    // Haetaan käyttäjä
    const result = await query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Tallennetaan user variableen
    const user = result.rows[0] as { id: number; password_hash: string };

    // Verrataan salasanaa hashin kanssa
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Luodaan JWT Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT_SECRET is not set" });
      return;
    }

    const token = jwt.sign({ id: user.id }, secret, {
      expiresIn: "7d",
    });

    res.json({ token });
    return;
  } catch (err) {
    console.error("Login error: ", err);
    res.status(500).json({ error: "Failed to login" });
    return;
  }
};

app.post("/api/auth/login", loginHandler);

// OMDB-hakureitti
const omdbSearchHandler: RequestHandler = async (req, res) => {
  const q = req.query.q as string | undefined;
  const apiKey = process.env.OMDB_API_KEY;

  if (!q) {
    res.status(400).json({ error: "Missing query parameter q" });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: "OMDB_API_KEY is not set in .env" });
    return;
  }

  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(
      q
    )}&type=movie`;

    const response = await fetch(url);
    const data = (await response.json()) as OmdbSearchResponse;

    if (data.Response === "False") {
      res.status(404).json({ error: data.Error || "No movies found" });
      return;
    }

    res.json(data);
    return;
  } catch (err) {
    console.error("Error fetching OMDB:", err);
    res.status(500).json({ error: "Failed to fetch from OMDB" });
    return;
  }
};

app.get("/api/search", omdbSearchHandler);

// // Yksittäinen elokuva haku OMDB:stä
const omdbMovieHandler: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "OMDB_API_KEY is not set in .env" });
    return;
  }

  if (!id) {
    res.status(400).json({ error: "Missing movie id" });
    return;
  }

  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${id}&plot=short`;

    const response = await fetch(url);
    const data = (await response.json()) as OmdbSearchResponse;

    if (data.Response === "False") {
      res.status(404).json({ error: data.Error ?? "Movie not found" });
      return;
    }

    res.json(data);
    return;
  } catch (err) {
    console.error("Error fetching detailed movie:", err);
    res.status(500).json({ error: "Failed to fetch movie details" });
    return;
  }
};

app.get("/api/movie/:id", omdbMovieHandler);

// Hae katsotut
const getWatchedHandler: RequestHandler = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = (await query(
      `SELECT * FROM watched_movies WHERE user_id = $1 ORDER BY added_at DESC`,
      [userId]
    )) as { rows: WatchedMovieRow[] };

    const movies: WatchedMovie[] = result.rows.map((row) => ({
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
};

app.get("/api/watched", requireAuth, getWatchedHandler);

// Lisää katsottu
const addWatchedHandler: RequestHandler = async (req, res) => {
  const userId = req.user?.id; // Myöhemmin authista.

  const { imdbID, title, year, poster } = req.body as AddWatchedMovieBody;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!imdbID || !title) {
    res.status(400).json({ error: "Missing imdbID or title" });
    return;
  }

  try {
    const exists = await query(
      `SELECT 1 FROM watched_movies WHERE user_id = $1 AND imdb_id = $2`,
      [userId, imdbID]
    );

    if (exists?.rowCount && exists.rowCount > 0) {
      res.status(409).json({ error: "Movie already exists" });
      return;
    }

    const result = (await query(
      `INSERT INTO watched_movies (user_id, imdb_id, title, year, poster) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, imdbID, title, year ?? null, poster ?? null]
    )) as { rows: WatchedMovieRow[] };

    const row = result.rows[0];

    const movie: WatchedMovie = {
      id: row.imdb_id,
      title: row.title,
      year: row.year,
      poster: row.poster,
      addedAt: row.added_at,
    };
    res.status(201).json(movie);
    return;
  } catch (err) {
    console.error("Error inserting movie", err);
    res.status(500).json({ error: "Failed to add movie" });
    return;
  }
};

app.post("/api/watched", requireAuth, addWatchedHandler);

// Poista elokuva
const deleteWatchedHandler: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  const movieId = req.params.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!movieId) {
    res.status(400).json({ error: "Missing movie id" });
    return;
  }

  try {
    const result = await query(
      "DELETE FROM watched_movies WHERE user_id = $1 AND imdb_id = $2",
      [userId, movieId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }
    res.status(204).send();
    return;
  } catch (err) {
    console.error("Error deleting movie", err);
    res.status(500).json({ error: "Failed to delete movie" });
    return;
  }
};

app.delete("/api/watched/:id", requireAuth, deleteWatchedHandler);

export default app;
