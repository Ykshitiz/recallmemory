import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";
import type { ItemType } from "../models/Item";

export interface IngestResult {
  extractedText: string;
  metadata: Record<string, string>;
}

const MAX_TEXT_LENGTH = 8000;

function truncate(text: string) {
  return text.slice(0, MAX_TEXT_LENGTH);
}

function extractYoutubeId(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/
  );
  return match?.[1];
}

async function fetchPageText(url: string): Promise<IngestResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MindVaultBot/1.0; +https://mindvault.local)",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, noscript").remove();

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim();
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";
  const bodyText = $("article, main, p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join("\n");

  const extractedText = truncate(
    [title, description, bodyText].filter(Boolean).join("\n\n")
  );

  return {
    extractedText: extractedText || url,
    metadata: {
      ...(title ? { pageTitle: title } : {}),
      ...(description ? { description } : {}),
    },
  };
}

async function fetchYoutubeText(url: string): Promise<IngestResult> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    return fetchPageText(url);
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = transcript.map((part) => part.text).join(" ");

    if (text.trim()) {
      return {
        extractedText: truncate(text),
        metadata: { videoId, source: "youtube-transcript" },
      };
    }
  } catch {
    // Fall back to page metadata if captions are unavailable.
  }

  const page = await fetchPageText(url);
  return {
    ...page,
    metadata: { ...page.metadata, videoId, source: "youtube-metadata" },
  };
}

async function fetchTwitterText(url: string): Promise<IngestResult> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        author_name?: string;
        html?: string;
      };
      const $ = cheerio.load(data.html || "");
      const tweetText = $("p").text().trim();

      return {
        extractedText: truncate(
          [tweetText, data.author_name ? `Author: ${data.author_name}` : ""]
            .filter(Boolean)
            .join("\n\n")
        ),
        metadata: {
          ...(data.author_name ? { author: data.author_name } : {}),
          source: "twitter-oembed",
        },
      };
    }
  } catch {
    // Fall through to generic fetch.
  }

  return fetchPageText(url);
}

export async function ingestContent(
  type: ItemType,
  rawContent: string
): Promise<IngestResult> {
  if (type === "note") {
    return { extractedText: truncate(rawContent), metadata: {} };
  }

  const url = rawContent.trim();

  switch (type) {
    case "youtube":
      return fetchYoutubeText(url);
    case "twitter":
      return fetchTwitterText(url);
    case "link":
    default:
      return fetchPageText(url);
  }
}
