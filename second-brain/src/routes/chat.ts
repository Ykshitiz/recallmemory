import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { answerFromBrain } from "../services/ai.service";
import { hybridSearchItems } from "../services/search.service";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ message: "A question is required" });
    return;
  }
  if (message.length > 1000) {
    res.status(400).json({ message: "Questions must be 1000 characters or fewer" });
    return;
  }

  const retrieved = await hybridSearchItems(req.userId!, message, {});
  const sources = retrieved.slice(0, 5).map((item: any) => ({
    _id: String(item._id),
    title: item.title,
    type: item.type,
    summary: item.summary,
    rawContent: item.rawContent,
    extractedText: item.extractedText,
  }));
  const result = await answerFromBrain(message, sources);

  res.json({
    answer: result.answer,
    provider: result.provider,
    sources: sources.map(({ _id, title, type }) => ({ _id, title, type })),
  });
});

export default router;
