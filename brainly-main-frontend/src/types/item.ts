export type ItemType = "note" | "link" | "youtube" | "twitter";

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
  createdAt: string;
  updatedAt: string;
}
