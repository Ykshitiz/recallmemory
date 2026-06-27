import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { ItemModel } from "../models/Item";
import { LinkModel } from "../models/Link";
import { UserModel } from "../models/User";
import random from "../utils";

const router = Router();

router.post("/share", authMiddleware, async (req, res) => {
  const { share } = req.body;

  if (share) {
    const existingLink = await LinkModel.findOne({ userId: req.userId });

    if (existingLink) {
      res.json({ hash: existingLink.hash, path: `/share/${existingLink.hash}` });
      return;
    }

    const hash = random(10);
    await LinkModel.create({ userId: req.userId, hash });
    res.json({ hash, path: `/share/${hash}` });
    return;
  }

  await LinkModel.deleteOne({ userId: req.userId });
  res.json({ message: "Share link removed" });
});

router.get("/:shareLink", async (req, res) => {
  const link = await LinkModel.findOne({ hash: req.params.shareLink });

  if (!link) {
    res.status(404).json({ message: "Share link not found" });
    return;
  }

  const [items, user] = await Promise.all([
    ItemModel.find({ userId: link.userId }).sort({ createdAt: -1 }),
    UserModel.findById(link.userId),
  ]);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    username: user.username,
    items,
  });
});

export default router;
