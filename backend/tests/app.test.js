import request from "supertest";
import app, { _resetWatchedMovies } from "../app";

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
  const res = await request(app).get("/api/watched");
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
    .set("Content-Type", "application/json");

  expect(res.status).toBe(201);
  expect(res.body.id).toBe("tt1234567");

  const list = await request(app).get("/api/watched");
  expect(list.body.length).toBe(1);
});

// DUPLICATE MOVIE
test("POST /api/watched returns 409 for duplicate movie", async () => {
  const movie = { imdbID: "tt1234567", title: "Test Movie" };

  await request(app).post("/api/watched").send(movie);
  const res = await request(app).post("/api/watched").send(movie);

  expect(res.status).toBe(409);
});

// DELETE MOVIE
test("DELETE /api/watched/:id removes a movie", async () => {
  const movie = { imdbID: "tt1111111", title: "Delete Me" };
  await request(app).post("/api/watched").send(movie);

  const del = await request(app).delete("/api/watched/tt1111111");
  expect(del.status).toBe(204);

  const list = await request(app).get("/api/watched");
  expect(list.body).toEqual([]);
});
