import express from "express";
import cors from "cors";
import "./db";
import { GROQ_API_KEY, PORT } from "./config";
import authRoutes from "./routes/auth";
import itemsRoutes from "./routes/items";
import brainRoutes from "./routes/brain";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "MindVault API is running" });
});

app.use("/api/v1", authRoutes);
app.use("/api/v1/items", itemsRoutes);
app.use("/api/v1/brain", brainRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not set — AI will use basic fallback summaries.");
  }
});
