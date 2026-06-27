import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { JWT_SECRET } from "../config";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.header("authorization");
  if (!header) {
    res.status(403).json({ message: "You are not logged in" });
    return;
  }

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.userId = new Types.ObjectId(decoded.id);
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
}
