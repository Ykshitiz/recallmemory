import { Types } from "mongoose";
import { ItemModel } from "../models/Item";
import { analyzeContent } from "./ai.service";
import { ingestContent } from "./ingest.service";

export function queueItemProcessing(itemId: string, force = false) {
  setImmediate(() => {
    processItem(itemId, force).catch((error) => {
      console.error(`Failed to process item ${itemId}:`, error);
    });
  });
}

export async function processItem(itemId: string, force = false) {
  const item = await ItemModel.findById(itemId);
  if (!item || (item.aiProcessed && !force)) {
    return;
  }

  try {
    await ItemModel.findByIdAndUpdate(itemId, {
      aiProcessed: false,
      processingStatus: "pending",
      processingError: "",
      aiProvider: "",
    });

    const ingested = await ingestContent(item.type, item.rawContent);
    const analysis = await analyzeContent(
      item.title,
      item.type,
      ingested.extractedText
    );

    const usedGroq = analysis.provider === "groq";
    await ItemModel.findByIdAndUpdate(itemId, {
      extractedText: ingested.extractedText,
      summary: analysis.summary,
      tags: analysis.tags,
      title: analysis.suggestedTitle || item.title,
      metadata: { ...item.metadata, ...ingested.metadata },
      aiProcessed: true,
      processingStatus: usedGroq ? "completed" : "fallback",
      aiProvider: analysis.provider,
      processingError: analysis.failureReason || "",
      processedAt: new Date(),
    });
    console.log(`[AI] Item ${itemId} processed with ${analysis.provider}`);
  } catch (error) {
    console.error(`Processing error for item ${itemId}:`, {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    await ItemModel.findByIdAndUpdate(itemId, {
      summary: "",
      tags: [],
      aiProcessed: true,
      processingStatus: "failed",
      aiProvider: "",
      processingError: "Content ingestion or AI processing failed",
      processedAt: new Date(),
    });
  }
}

export async function reprocessPendingItems(userId: Types.ObjectId) {
  const pendingItems = await ItemModel.find({ userId, aiProcessed: false });
  pendingItems.forEach((item) => queueItemProcessing(String(item._id)));
}
