import { Types } from "mongoose";
import { ItemModel } from "../models/Item";
import { analyzeContent } from "./ai.service";
import { ingestContent } from "./ingest.service";

export function queueItemProcessing(itemId: string) {
  setImmediate(() => {
    processItem(itemId).catch((error) => {
      console.error(`Failed to process item ${itemId}:`, error);
    });
  });
}

export async function processItem(itemId: string) {
  const item = await ItemModel.findById(itemId);
  if (!item || item.aiProcessed) {
    return;
  }

  try {
    const ingested = await ingestContent(item.type, item.rawContent);
    const analysis = await analyzeContent(
      item.title,
      item.type,
      ingested.extractedText
    );

    await ItemModel.findByIdAndUpdate(itemId, {
      extractedText: ingested.extractedText,
      summary: analysis.summary,
      tags: analysis.tags,
      title: analysis.suggestedTitle || item.title,
      metadata: { ...item.metadata, ...ingested.metadata },
      aiProcessed: true,
    });
  } catch (error) {
    console.error(`Processing error for item ${itemId}:`, error);

    await ItemModel.findByIdAndUpdate(itemId, {
      summary: `• Saved as ${item.type}. AI processing could not complete.`,
      aiProcessed: true,
    });
  }
}

export async function reprocessPendingItems(userId: Types.ObjectId) {
  const pendingItems = await ItemModel.find({ userId, aiProcessed: false });
  pendingItems.forEach((item) => queueItemProcessing(String(item._id)));
}
