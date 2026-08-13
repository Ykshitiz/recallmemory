import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, IS_GEMINI_CONFIGURED } from "../config";

export const EMBEDDING_MODEL = "gemini-embedding-2";
export const EMBEDDING_DIMENSIONS = 768;

const gemini = IS_GEMINI_CONFIGURED
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

export interface EmbeddingResult {
  values: number[];
  provider: "gemini" | "unavailable";
  failureReason?: string;
}

function normalize(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? values.map((value) => value / magnitude) : values;
}

export async function embedDocument(text: string, title?: string): Promise<EmbeddingResult> {
  if (!gemini) {
    return {
      values: [],
      provider: "unavailable",
      failureReason: "GEMINI_API_KEY is not configured",
    };
  }

  try {
    const response = await gemini.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 24000),
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
        title,
      },
    });
    const values = response.embeddings?.[0]?.values || [];

    if (values.length !== EMBEDDING_DIMENSIONS) {
      return {
        values: [],
        provider: "unavailable",
        failureReason: "Gemini returned an invalid embedding",
      };
    }

    return { values: normalize(values), provider: "gemini" };
  } catch (error) {
    console.error("Gemini embedding request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      values: [],
      provider: "unavailable",
      failureReason: "Gemini embedding request failed",
    };
  }
}

export async function embedQuery(text: string): Promise<EmbeddingResult> {
  if (!gemini) {
    return {
      values: [],
      provider: "unavailable",
      failureReason: "GEMINI_API_KEY is not configured",
    };
  }

  try {
    const response = await gemini.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 24000),
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_QUERY",
      },
    });
    const values = response.embeddings?.[0]?.values || [];
    if (values.length !== EMBEDDING_DIMENSIONS) {
      return { values: [], provider: "unavailable", failureReason: "Gemini returned an invalid embedding" };
    }
    return { values: normalize(values), provider: "gemini" };
  } catch (error) {
    console.error("Gemini query embedding request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { values: [], provider: "unavailable", failureReason: "Gemini embedding request failed" };
  }
}
