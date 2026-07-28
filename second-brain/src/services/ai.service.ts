import Groq from "groq-sdk";
import { GROQ_API_KEY } from "../config";

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export interface AiAnalysis {
  summary: string;
  tags: string[];
  suggestedTitle?: string;
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
  };
}

function fallbackAnalysis(title: string, extractedText: string): AiAnalysis {
  const preview = extractedText.trim().slice(0, 280);
  return {
    summary: preview ? `• ${preview}${extractedText.length > 280 ? "..." : ""}` : `• ${title}`,
    tags: [],
  };
}

export async function analyzeContent(
  title: string,
  type: string,
  extractedText: string
): Promise<AiAnalysis> {
  if (!groq) {
    return fallbackAnalysis(title, extractedText);
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
      return fallbackAnalysis(title, extractedText);
    }

    return parseAiResponse(content);
  } catch (error) {
    console.error("AI analysis failed:", error);
    return fallbackAnalysis(title, extractedText);
  }
}
