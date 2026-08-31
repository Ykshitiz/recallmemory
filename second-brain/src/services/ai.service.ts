import Groq from "groq-sdk";
import { GROQ_API_KEY, IS_GROQ_CONFIGURED } from "../config";

const groq = IS_GROQ_CONFIGURED ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export interface AiAnalysis {
  summary: string;
  tags: string[];
  suggestedTitle?: string;
  provider: "groq" | "fallback";
  failureReason?: string;
}

const SYSTEM_PROMPT = `You are a personal knowledge assistant. Analyze saved content and return ONLY valid JSON with this shape:
{
  "summary": "3-5 concise bullet points as a single string, each bullet on its own line starting with •",
  "tags": ["3 to 5 lowercase topic tags, no # symbol"],
  "suggestedTitle": "short descriptive title if the provided title is vague, otherwise omit"
}
Do not include markdown fences or extra text.`;

function parseAiResponse(content: string): AiAnalysis {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as AiAnalysis;

  return {
    summary: parsed.summary?.trim() || "",
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.map((tag) => String(tag).toLowerCase().trim()).filter(Boolean).slice(0, 5)
      : [],
    suggestedTitle: parsed.suggestedTitle?.trim(),
    provider: "groq",
  };
}

function fallbackAnalysis(title: string, extractedText: string, failureReason?: string): AiAnalysis {
  const preview = extractedText.trim().slice(0, 280);
  return {
    summary: preview ? `• ${preview}${extractedText.length > 280 ? "..." : ""}` : `• ${title}`,
    tags: [],
    provider: "fallback",
    failureReason,
  };
}

export async function analyzeContent(
  title: string,
  type: string,
  extractedText: string
): Promise<AiAnalysis> {
  if (!groq) {
    return fallbackAnalysis(title, extractedText, "A valid GROQ_API_KEY is not configured");
  }

  const userPrompt = `Title: ${title}
Type: ${type}
Content:
${extractedText.slice(0, 6000)}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return fallbackAnalysis(title, extractedText, "Groq returned an empty response");
    }

    return parseAiResponse(content);
  } catch (error) {
    console.error("Groq analysis request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return fallbackAnalysis(title, extractedText, "Groq request failed");
  }
}

export interface ChatSource {
  _id: string;
  title: string;
  type: string;
  summary?: string;
  rawContent?: string;
  extractedText?: string;
}

export async function answerFromBrain(question: string, sources: ChatSource[]) {
  if (!groq) {
    return {
      answer: "Ask My Brain needs a valid GROQ_API_KEY before it can answer questions.",
      provider: "unavailable" as const,
    };
  }

  if (!sources.length) {
    return {
      answer: "I couldn't find relevant saved content for that question. Try adding more context or saving related material first.",
      provider: "none" as const,
    };
  }

  const context = sources.map((item, index) => {
    const content = item.summary || item.extractedText || item.rawContent || "";
    return `[${index + 1}] ${item.title} (${item.type})\n${content.slice(0, 1800)}`;
  }).join("\n\n");

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You answer questions only from the user's saved MindVault context. If the context does not support an answer, say so plainly. Do not invent facts. Cite relevant sources inline using [1], [2], and so on. Be concise and helpful.",
        },
        { role: "user", content: `Saved context:\n${context}\n\nQuestion: ${question}` },
      ],
    });
    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) throw new Error("Groq returned an empty chat response");
    return { answer, provider: "groq" as const };
  } catch (error) {
    console.error("Groq chat request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      answer: "I couldn't generate an answer right now. Please try again.",
      provider: "failed" as const,
    };
  }
}
