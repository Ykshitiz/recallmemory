import mongoose, { model, Schema } from "mongoose";

const LinkSchema = new Schema({
  hash: { type: String, required: true, unique: true },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

export const LinkModel = model("Links", LinkSchema);
