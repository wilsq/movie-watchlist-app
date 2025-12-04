import express from "express";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Testireitti

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Movie watchlist backend is running",
  });
});

// Käynnistä serveri
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
