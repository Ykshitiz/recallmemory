import { Types } from "mongoose";
import { ItemModel } from "../models/Item";
import { embedQuery } from "./embed.service";
import type { ItemType } from "../models/Item";

interface SearchFilters {
  type?: ItemType;
  tag?: string;
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length || left.length === 0) return 0;
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

export async function hybridSearchItems(
  userId: Types.ObjectId,
  query: string,
  filters: SearchFilters
) {
  const baseFilter: Record<string, unknown> = { userId };
  if (filters.type) baseFilter.type = filters.type;
  if (filters.tag) baseFilter.tags = filters.tag;

  const [queryEmbedding, keywordItems, embeddedItems] = await Promise.all([
    embedQuery(query),
    ItemModel.find({ ...baseFilter, $text: { $search: query } })
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .lean(),
    ItemModel.find({ ...baseFilter, embeddingStatus: "completed", "embedding.0": { $exists: true } })
      .select("embedding")
      .limit(500)
      .lean(),
  ]);

  const ranked = new Map<string, { item: any; score: number }>();
  keywordItems.forEach((item: any, index) => {
    ranked.set(String(item._id), { item, score: 0.3 + 0.7 / (index + 1) });
  });

  if (queryEmbedding.values.length) {
    embeddedItems.forEach((item: any) => {
      const semanticScore = cosineSimilarity(queryEmbedding.values, item.embedding || []);
      if (semanticScore <= 0) return;
      const id = String(item._id);
      const existing = ranked.get(id);
      ranked.set(id, {
        item: existing?.item || item,
        score: Math.max(existing?.score || 0, semanticScore),
      });
    });
  }

  const ranking = Array.from(ranked.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, 30);
  const ids = ranking.map(({ item }) => item._id);
  const documents = await ItemModel.find({ _id: { $in: ids } }).lean();
  const documentsById = new Map(documents.map((item: any) => [String(item._id), item]));

  return ranking
    .map(({ item, score }) => {
      const document = documentsById.get(String(item._id));
      return document ? { ...document, searchScore: Number(score.toFixed(3)) } : null;
    })
    .filter(Boolean);
}
