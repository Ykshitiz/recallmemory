import mongoose, { model, Schema } from "mongoose";

export const ITEM_TYPES = ["note", "link", "youtube", "twitter"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

const ItemSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ITEM_TYPES,
      required: true,
    },
    title: { type: String, required: true },
    rawContent: { type: String, required: true },
    link: { type: String },
    extractedText: { type: String, default: "" },
    summary: { type: String, default: "" },
    tags: { type: [String], default: [] },
    embedding: { type: [Number], default: [] },
    aiProcessed: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ItemSchema.index({ title: "text", summary: "text", tags: "text" });

export const ItemModel = model("Item", ItemSchema);
