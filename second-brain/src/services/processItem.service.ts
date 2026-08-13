import { Types } from "mongoose";
import { ItemModel } from "../models/Item";
import { analyzeContent } from "./ai.service";
import { embedDocument } from "./embed.service";
import { ingestContent } from "./ingest.service";

function buildEmbeddingText(item: { title: string; summary?: string; tags?: string[]; extractedText?: string; rawContent: string }) {
  return [
    item.title,
    item.summary,
    item.tags?.join(", "),
    item.extractedText || item.rawContent,
  ].filter(Boolean).join("\n\n");
}

async function storeEmbedding(itemId: string) {
  const item = await ItemModel.findOneAndUpdate(
    {
      _id: itemId,
      embeddingStatus: { $nin: ["completed", "processing"] },
    },
    {
      embeddingStatus: "processing",
      embeddingError: "",
    },
    { new: true }
  );

  // A completed embedding, or another active embedding job, must never be duplicated.
  if (!item) return;

  const embedding = await embedDocument(buildEmbeddingText(item), item.title);
  await ItemModel.findByIdAndUpdate(itemId, {
    embedding: embedding.values,
    embeddingModel: embedding.provider === "gemini" ? "gemini-embedding-2" : "",
    embeddingStatus: embedding.provider === "gemini" ? "completed" : "unavailable",
    embeddingError: embedding.failureReason || "",
    embeddedAt: new Date(),
  });
  console.log(`[Embeddings] Item ${itemId} processed with ${embedding.provider}`);
}

export function queueItemEmbedding(itemId: string) {
  setImmediate(() => {
    storeEmbedding(itemId).catch((error) => {
      console.error(`Failed to embed item ${itemId}:`, error);
    });
  });
}

export function queueItemProcessing(itemId: string, force = false) {
  setImmediate(() => {
    processItem(itemId, force).catch((error) => {
      console.error(`Failed to process item ${itemId}:`, error);
    });
  });
}

export async function processItem(itemId: string, force = false) {
  const item = await ItemModel.findById(itemId);
  if (!item || (item.aiProcessed && !force)) return;

  try {
    await ItemModel.findByIdAndUpdate(itemId, {
      aiProcessed: false,
      processingStatus: "pending",
      processingError: "",
      aiProvider: "",
      embeddingStatus: "pending",
      embeddingError: "",
    });

    const ingested = await ingestContent(item.type, item.rawContent);
    const analysis = await analyzeContent(item.title, item.type, ingested.extractedText);
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
    queueItemEmbedding(itemId);
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
      embeddingStatus: "failed",
      embeddingError: "AI processing must complete before embedding",
    });
  }
}

export async function reprocessPendingItems(userId: Types.ObjectId) {
  const pendingItems = await ItemModel.find({ userId, aiProcessed: false });
  pendingItems.forEach((item) => queueItemProcessing(String(item._id)));
}
