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
