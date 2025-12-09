import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, WATCHED_TABLE, DEMO_USER_ID } from "./dynamoClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Helper funktio testejä varten
export function _resetWatchedMovies() {
  watchedMovies = [];
}

// Health-check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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

// Hae katsotut DynamoDB:stä
app.get("/api/watched", async (req, res) => {
  try {
    const command = new QueryCommand({
      TableName: WATCHED_TABLE,
      KeyConditionExpression: "userid = :uid",
      ExpressionAttributeValues: {
        ":uid": DEMO_USER_ID,
      },
    });

    const result = await docClient.send(command);
    res.json(result.Items || []);
  } catch (err) {
    console.error("Error querying watched movies:", err);
    res.status(500).json({ error: "Failed to load watched movies" });
  }
});

// Lisää katsottu
app.post("/api/watched", (req, res) => {
  const { imdbID, title, year, poster } = req.body;

  if (!imdbID || !title) {
    return res.status(400).json({ error: "Missing imdbID or title" });
  }

  const exists = watchedMovies.some((m) => m.id === imdbID);
  if (exists) {
    return res.status(409).json({ error: "Movie already exists" });
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

// Poista elokuva
app.delete("/api/watched/:id", (req, res) => {
  const { id } = req.params;

  const index = watchedMovies.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Movie not found" });
  }

  watchedMovies.splice(index, 1);
  return res.status(204).send();
});

export default app;
