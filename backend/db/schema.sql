CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE watched_movies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  imdb_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT,
  poster TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, imdb_id)
);

CREATE TABLE IF NOT EXISTS watchlist_movies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  imdb_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT,
  poster TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, imdb_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id
  ON watchlist_movies(user_id);

