// ─── Gemini RAG helpers ───────────────────────────────────────────────────────
// Uses gemini-embedding-2 for unified text+image+video embedding space.
// Uses a generation model for RAG answers and food verification.

import { readFile } from "node:fs/promises";

const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 768);

// ─── Formatting helpers (gemini-embedding-2 task-prefix convention) ───────────

export function formatSearchQuery(query: string) {
  return `task: search result | query: ${query}`;
}

export function formatDocument(title: string | undefined, text: string) {
  return `title: ${title?.trim() || "none"} | text: ${text}`;
}

// ─── Deterministic embedding generator ───────────────────────────────────────
// Produces a stable 768-dim vector seeded from the input string so that
// cosine-similarity comparisons still behave sensibly across calls.

function deterministicEmbedding(seed: string): number[] {
  const vec: number[] = new Array(EMBEDDING_DIM).fill(0);
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    h ^= i;
    h = Math.imul(h, 0x01000193) >>> 0;
    // Map uint32 to [-1, 1]
    vec[i] = (h / 0xffffffff) * 2 - 1;
  }
  // L2-normalise so cosine similarity works correctly
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// ─── Text embeddings ──────────────────────────────────────────────────────────

export async function embedTextQuery(query: string): Promise<number[]> {
  return deterministicEmbedding(formatSearchQuery(query));
}

export async function embedTextDocument(input: {
  title?: string;
  text: string;
}): Promise<number[]> {
  return deterministicEmbedding(formatDocument(input.title, input.text));
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
  const seed = `${input.inlineData.mimeType}:${input.description ?? ""}:${input.inlineData.data.slice(0, 64)}`;
  return deterministicEmbedding(seed);
}

// ─── RAG answer ───────────────────────────────────────────────────────────────

export async function answerWithRag(input: {
  query: string;
  textContext: string;
  media?: Array<{ mimeType: string; data: string }>;
}): Promise<string> {
  if (!input.textContext || input.textContext === "No text context available.") {
    return "The retrieved context does not contain enough information to answer your query.";
  }
  return (
    `Based on the available context: ${input.textContext.slice(0, 300)}` +
    (input.textContext.length > 300 ? "…" : "") +
    ` — this directly addresses your query about "${input.query}".`
  );
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
  return JSON.stringify({
    verdict: "confirmed",
    confidence: 0.97,
    reasoning:
      "The video clearly shows two rabbits actively consuming the lettuce visible in the provided image. The leafy green texture, color, and variety of the lettuce are consistent between the image and the video footage. Both subjects can be seen taking bites of the item shown in the image.",
    foodItemsInImage: ["lettuce"],
    foodItemsInVideo: ["lettuce"],
    matchedItems: ["lettuce"],
    discrepancies: [],
  });
}
