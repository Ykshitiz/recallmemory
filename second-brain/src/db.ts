import mongoose, { model, Schema } from "mongoose";

import 'dotenv/config'; 
const mongoUrl  = process.env.MONGO_URL || "";

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not defined");
}

mongoose

  .connect(
    mongoUrl
  )
  .then(() => {
    console.log("Connected mongo");
  });

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

const ContentSchema = new Schema({
  title: String,
  link: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",

    required: true,
  },
  authorId: {
    type: mongoose.Types.ObjectId,
    ref: "User",

    required: false,
  },
});
const LinkSchema = new Schema({
  hash: String,
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    require: true,
    unique: true,
  },
});

export const LinkModel = model("Links", LinkSchema);

export const ContenModel = model("Content", ContentSchema);

export const UserModel = model("User", UserSchema);
