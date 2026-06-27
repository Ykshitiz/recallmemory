import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { UserModel } from "../models/User";

const router = Router();

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ username, password: hashedPassword });
    res.json({ message: "User signed up" });
  } catch {
    res.status(411).json({ message: "User already exists" });
  }
});

router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  const existingUser = await UserModel.findOne({ username });
  if (!existingUser) {
    res.status(403).json({ message: "Incorrect credentials" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordMatch) {
    res.status(403).json({ message: "Incorrect credentials" });
    return;
  }

  const token = jwt.sign({ id: existingUser._id }, JWT_SECRET);
  res.json({ token });
});

export default router;
