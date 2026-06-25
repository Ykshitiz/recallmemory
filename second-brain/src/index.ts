import express from "express";
import { ContenModel, LinkModel, UserModel } from "./db";
import jwt from "jsonwebtoken";
// import { mongo } from "mongoose";
import { JWT_PASSWORD } from "./config";
import { userMiddleWare } from "./middleware";
import random from "./utils";
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.json("startd go on bro !");
});
app.post("/api/v1/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    await UserModel.create({ username: username, password: password });
    res.json({ message: "User Signed Up!" });
  } catch (e) {
    res.status(411).json({
      message: "User already exists",
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const existingUser = await UserModel.findOne({
    username,
    password,
  });
  if (existingUser) {
    const token = jwt.sign({ id: existingUser._id }, JWT_PASSWORD);

    res.json({ token });
  } else {
    res.status(403).json({
      message: "Incorrect credentials!",
    });
  }
});

app.post("/api/v1/content", userMiddleWare, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;
  await ContenModel.create({
    link,
    type,
    title:req.body.title ,
    //@ts-ignore
    userId: req.userId,
    tags: [],
  });

  res.json({
    message: "Content added",
  });
});
app.get("/api/v1/content", userMiddleWare, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const content = await ContenModel.find({
    userId: userId,
  }).populate("userId", "username");

  res.json({
    content,
  });
});
app.post("/api/v1/brain/share", userMiddleWare, async (req, res) => {
  const share = req.body.share;

  if (share) {
    const existingLink = await LinkModel.findOne({
      userId: req.body.userId,
    });
    const hash = random(10);

    if (existingLink) {
      res.json({ hash: existingLink.hash });
      return;
    }

    await LinkModel.create({
      userId: req.body.userId,
      hash: hash,
    });

    res.json({
      message: "/share/" + hash,
    });
  } else {
    await LinkModel.deleteOne({
      userId: req.body.userid,
    });

    res.json({
      message: "Removed link",
    });
  }

  res.json({
    message: "Updated shareable link",
  });
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;

  const link = await LinkModel.findOne({
    hash,
  });

  if (!link) {
    res.status(411).json({
      message: "Sorry incorrect input",
    });
    return;
  }

  const content = await ContenModel.find({
    userId: link.userId,
  });

  const user = await UserModel.findOne({
    _id: link.userId,
  });

  if (!user) {
    res.status(411).json({
      message: "user not found , error should ideally not happen ",
    });
    return;
  }

  res.json({
    username: user.username,
    content: content,
  });
});

app.listen(3000);
