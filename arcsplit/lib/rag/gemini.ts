// ─── Gemini RAG helpers ───────────────────────────────────────────────────────
// Uses gemini-embedding-2 for unified text+image+video embedding space.
// Uses a generation model for RAG answers and food verification.

import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env.local");

const GENERATION_MODEL =
  process.env.GEMINI_GENERATION_MODEL ?? "gemini-2.0-flash";
const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 768);

export const ai = new GoogleGenAI({ apiKey });

// ─── Formatting helpers (gemini-embedding-2 task-prefix convention) ───────────

export function formatSearchQuery(query: string) {
  return `task: search result | query: ${query}`;
}

export function formatDocument(title: string | undefined, text: string) {
  return `title: ${title?.trim() || "none"} | text: ${text}`;
}

// ─── Text embeddings ──────────────────────────────────────────────────────────

export async function embedTextQuery(query: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: formatSearchQuery(query),
    config: { outputDimensionality: EMBEDDING_DIM },
  });
  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("No embedding returned for query");
  return values;
}

export async function embedTextDocument(input: {
  title?: string;
  text: string;
}): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: formatDocument(input.title, input.text),
    config: { outputDimensionality: EMBEDDING_DIM },
  });
  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("No embedding returned for document");
  return values;
}

// ─── Media helpers ────────────────────────────────────────────────────────────

export async function fileToInlineData(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    mimeType: file.type || "application/octet-stream",
    data: buffer.toString("base64"),
  };
}

export async function pathToInlineData(filePath: string, mimeType: string) {
  const buffer = await readFile(filePath);
  return { mimeType, data: buffer.toString("base64") };
}

// ─── Multimodal embedding ─────────────────────────────────────────────────────
// Passes image/video + optional description into one embedding request.
// gemini-embedding-2 maps all modalities into a single shared vector space.

export async function embedMedia(input: {
  inlineData: { mimeType: string; data: string };
  description?: string;
}): Promise<number[]> {
  const contents: unknown[] = input.description
    ? [
        input.description,
        { inlineData: { mimeType: input.inlineData.mimeType, data: input.inlineData.data } },
      ]
    : [{ inlineData: { mimeType: input.inlineData.mimeType, data: input.inlineData.data } }];

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: contents as unknown as string,
    config: { outputDimensionality: EMBEDDING_DIM },
  });
  const values = response.embeddings?.[0]?.values;
  if (!values) throw new Error("No embedding returned for media");
  return values;
}

// ─── RAG answer ───────────────────────────────────────────────────────────────

export async function answerWithRag(input: {
  query: string;
  textContext: string;
  media?: Array<{ mimeType: string; data: string }>;
}): Promise<string> {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [
    {
      text: [
        "Answer the user using only the retrieved context.",
        "If the retrieved context is insufficient, say that clearly.",
        "",
        `User query: ${input.query}`,
        "",
        "Retrieved text context:",
        input.textContext || "No text context available.",
      ].join("\n"),
    },
  ];

  for (const media of input.media ?? []) {
    parts.push({ inlineData: { mimeType: media.mimeType, data: media.data } });
  }

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [{ role: "user", parts }],
  });
  return response.text ?? "";
}

// ─── Food verification ────────────────────────────────────────────────────────
// Passes both the image and video inline to Gemini and asks it to confirm
// whether the food shown in the image is being consumed in the video.

export async function verifyFoodConsumption(input: {
  imageData: { mimeType: string; data: string };
  videoData: { mimeType: string; data: string };
  imageDescription?: string;
  videoDescription?: string;
}): Promise<string> {
  const systemPrompt = `You are a food consumption verification assistant.
You will be given one image and one video clip.
Your job is to determine whether the food shown in the image is being consumed in the video.

Respond in this exact JSON format (no markdown, no code fences):
{
  "verdict": "confirmed" | "unconfirmed" | "uncertain",
  "confidence": <number 0.0–1.0>,
  "reasoning": "<one paragraph explanation>",
  "foodItemsInImage": ["<item1>", "<item2>"],
  "foodItemsInVideo": ["<item1>", "<item2>"],
  "matchedItems": ["<items that appear in both>"],
  "discrepancies": ["<any mismatches or concerns>"]
}

Rules:
- "confirmed" means you can clearly see the same food being eaten in the video
- "unconfirmed" means the food in the video is clearly different from the image
- "uncertain" means you cannot determine with confidence
- Be specific about food items (e.g. "pepperoni pizza" not just "food")`;

  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: systemPrompt },
    { text: `Image description: ${input.imageDescription ?? "food image"}` },
    { inlineData: { mimeType: input.imageData.mimeType, data: input.imageData.data } },
    { text: `Video description: ${input.videoDescription ?? "eating video"}` },
    { inlineData: { mimeType: input.videoData.mimeType, data: input.videoData.data } },
    {
      text: "Now analyze both and respond with the JSON verdict.",
    },
  ];

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [{ role: "user", parts }],
  });

  return response.text ?? "{}";
}
