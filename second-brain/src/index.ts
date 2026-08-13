import express from "express";
import cors from "cors";
import "./db";
import { CLIENT_ORIGIN, IS_GEMINI_CONFIGURED, IS_GROQ_CONFIGURED, PORT } from "./config";
import authRoutes from "./routes/auth";
import itemsRoutes from "./routes/items";
import brainRoutes from "./routes/brain";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "MindVault API is running",
    ai: { provider: "groq", configured: IS_GROQ_CONFIGURED },
    embeddings: { provider: "gemini", configured: IS_GEMINI_CONFIGURED },
  });
});

app.use("/api/v1", authRoutes);
app.use("/api/v1/items", itemsRoutes);
app.use("/api/v1/brain", brainRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!IS_GROQ_CONFIGURED) {
    console.warn("A valid GROQ_API_KEY is not configured — items will use fallback previews.");
  }
});
