import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { ITEM_TYPES, ItemModel } from "../models/Item";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { type, title, rawContent, link } = req.body;

  if (!type || !ITEM_TYPES.includes(type)) {
    res.status(400).json({ message: "Valid type is required" });
    return;
  }

  if (!title?.trim()) {
    res.status(400).json({ message: "Title is required" });
    return;
  }

  const content = rawContent?.trim() || link?.trim();
  if (!content) {
    res.status(400).json({ message: "Content or link is required" });
    return;
  }

  const item = await ItemModel.create({
    userId: req.userId,
    type,
    title: title.trim(),
    rawContent: content,
    link: link?.trim() || (type !== "note" ? content : undefined),
    extractedText: type === "note" ? content : "",
    aiProcessed: false,
  });

  res.status(201).json({ item });
});

router.get("/", authMiddleware, async (req, res) => {
  const { type, q } = req.query;
  const filter: Record<string, unknown> = { userId: req.userId };

  if (typeof type === "string" && ITEM_TYPES.includes(type as typeof ITEM_TYPES[number])) {
    filter.type = type;
  }

  if (typeof q === "string" && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  const items = await ItemModel.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});

router.get("/:id", authMiddleware, async (req, res) => {
  const item = await ItemModel.findOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!item) {
    res.status(404).json({ message: "Item not found" });
    return;
  }

  res.json({ item });
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const result = await ItemModel.deleteOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (result.deletedCount === 0) {
    res.status(404).json({ message: "Item not found" });
    return;
  }

  res.json({ message: "Item deleted" });
});

export default router;
