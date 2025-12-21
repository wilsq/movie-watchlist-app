import request from "supertest";
import app, { _resetWatchedMovies } from "../src/app";
import jwt from "jsonwebtoken";

const testToken = jwt.sign(
  { id: "test-user" },
  process.env.JWT_SECRET || "test-secret"
);

beforeEach(() => {
  _resetWatchedMovies();
});

// HEALTH
test("GET /api/health returns status ok", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});

// EMPTY ARRAY
test("GET /api/watched returns empty array", async () => {
  const res = await request(app)
    .get("/api/watched")
    .set("Authorization", `Bearer ${testToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

// ADD MOVIE
test("POST /api/watched adds a movie", async () => {
  const movie = {
    imdbID: "tt1234567",
    title: "Test Movie",
    year: "2024",
    poster: "poster.jpg",
  };

  const res = await request(app)
    .post("/api/watched")
    .send(movie)
    .set("Content-Type", "application/json")
    .set("Authorization", `Bearer ${testToken}`);

  expect(res.status).toBe(201);
  expect(res.body.id).toBe("tt1234567");

  const list = await request(app)
    .get("/api/watched")
    .set("Authorization", `Bearer ${testToken}`);
  expect(list.body.length).toBe(1);
});

// DUPLICATE MOVIE
test("POST /api/watched returns 409 for duplicate movie", async () => {
  const movie = { imdbID: "tt1234567", title: "Test Movie" };

  await request(app)
    .post("/api/watched")
    .send(movie)
    .set("Authorization", `Bearer ${testToken}`);
  const res = await request(app)
    .post("/api/watched")
    .send(movie)
    .set("Authorization", `Bearer ${testToken}`);

  expect(res.status).toBe(409);
});

// DELETE MOVIE
test("DELETE /api/watched/:id removes a movie", async () => {
  const movie = { imdbID: "tt1111111", title: "Delete Me" };
  await request(app)
    .post("/api/watched")
    .send(movie)
    .set("Authorization", `Bearer ${testToken}`);

  const del = await request(app)
    .delete("/api/watched/tt1111111")
    .set("Authorization", `Bearer ${testToken}`);
  expect(del.status).toBe(204);

  const list = await request(app)
    .get("/api/watched")
    .set("Authorization", `Bearer ${testToken}`);
  expect(list.body).toEqual([]);
});
