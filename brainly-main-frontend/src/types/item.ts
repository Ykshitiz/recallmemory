export type ItemType = "note" | "link" | "youtube" | "twitter";
export type ProcessingStatus = "pending" | "completed" | "fallback" | "failed";

export interface Item {
  _id: string;
  userId: string;
  type: ItemType;
  title: string;
  rawContent: string;
  link?: string;
  extractedText?: string;
  summary?: string;
  tags: string[];
  aiProcessed: boolean;
  processingStatus?: ProcessingStatus;
  aiProvider?: "groq" | "fallback" | "";
  processingError?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}
