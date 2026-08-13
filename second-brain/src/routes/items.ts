import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { ITEM_TYPES, ItemModel } from "../models/Item";
import { queueItemEmbedding, queueItemProcessing } from "../services/processItem.service";
import { hybridSearchItems } from "../services/search.service";

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
    aiProcessed: false,
    processingStatus: "pending",
    embeddingStatus: "pending",
  });

  queueItemProcessing(String(item._id));

  res.status(201).json({ item });
});

router.get("/", authMiddleware, async (req, res) => {
  const { type, q, tag, semantic } = req.query;
  const filter: Record<string, unknown> = { userId: req.userId };

  if (typeof type === "string" && ITEM_TYPES.includes(type as typeof ITEM_TYPES[number])) {
    filter.type = type;
  }

  if (typeof q === "string" && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  if (typeof tag === "string" && tag.trim()) {
    filter.tags = tag.trim().toLowerCase();
  }

  if (semantic === "true" && typeof q === "string" && q.trim()) {
    const items = await hybridSearchItems(req.userId!, q.trim(), {
      type: typeof type === "string" && ITEM_TYPES.includes(type as typeof ITEM_TYPES[number])
        ? type as typeof ITEM_TYPES[number]
        : undefined,
      tag: typeof tag === "string" && tag.trim() ? tag.trim().toLowerCase() : undefined,
    });
    res.json({ items, semanticSearch: true });
    return;
  }

  const query = ItemModel.find(filter);
  if (filter.$text) {
    query.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" }, createdAt: -1 });
  } else {
    query.sort({ createdAt: -1 });
  }

  const items = await query;
  res.json({ items });
});

router.post("/embeddings/reprocess", authMiddleware, async (req, res) => {
  const items = await ItemModel.find({
    userId: req.userId,
    aiProcessed: true,
    embeddingStatus: { $ne: "completed" },
  }).select("_id");

  items.forEach((item) => queueItemEmbedding(String(item._id)));
  res.json({ queued: items.length });
});

router.post("/:id/reprocess", authMiddleware, async (req, res) => {
  const item = await ItemModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      aiProcessed: false,
      processingStatus: "pending",
      processingError: "",
      aiProvider: "",
    },
    { new: true }
  );

  if (!item) {
    res.status(404).json({ message: "Item not found" });
    return;
  }

  queueItemProcessing(String(item._id), true);
  res.json({ item });
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
