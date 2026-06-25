import { NextFunction, Request, Response } from "express";
import jwt, { decode } from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";
export const userMiddleWare = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.header("authorization");
  const decoded = jwt.verify(header as string, JWT_PASSWORD);

  if (decoded) { 
    //@ts-ignore
    req.userId = decoded.id;
    next();
  } else {
    res.status(403).json({
      message: "You are not logged in ",
    });
  }
};
