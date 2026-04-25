// POST /api/rag/verify-food
// The core food verification workflow:
//   1. Accepts imageId + videoId (already indexed records)
//   2. Loads both files from disk
//   3. Passes both inline to Gemini generation model
//   4. Parses the structured JSON verdict
//   5. Returns FoodVerificationResult
//
// Also supports direct upload mode: pass image + video as multipart files
// without pre-indexing (for the interactive demo).

import { NextResponse } from "next/server";
import { z } from "zod";
import { pathToInlineData, verifyFoodConsumption, fileToInlineData } from "@/lib/rag/gemini";
import { listRecords } from "@/lib/rag/vector-store";
import type { FoodVerificationResult, SearchResult } from "@/lib/rag/types";

export const runtime = "nodejs";

// ─── JSON body mode: use already-indexed record IDs ──────────────────────────

const jsonSchema = z.object({
  imageId: z.string().uuid(),
  videoId: z.string().uuid(),
});

// ─── Parse Gemini's JSON response ────────────────────────────────────────────

function parseVerdict(raw: string): Omit<FoodVerificationResult, "imageRecord" | "videoRecord"> {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      verdict: parsed.verdict ?? "uncertain",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning ?? "",
      foodItemsInImage: Array.isArray(parsed.foodItemsInImage) ? parsed.foodItemsInImage : [],
      foodItemsInVideo: Array.isArray(parsed.foodItemsInVideo) ? parsed.foodItemsInVideo : [],
      matchedItems: Array.isArray(parsed.matchedItems) ? parsed.matchedItems : [],
      discrepancies: Array.isArray(parsed.discrepancies) ? parsed.discrepancies : [],
      rawAnswer: raw,
    };
  } catch {
    // Gemini didn't return valid JSON — extract what we can
    const verdictMatch = raw.match(/"verdict"\s*:\s*"(confirmed|unconfirmed|uncertain)"/);
    const confidenceMatch = raw.match(/"confidence"\s*:\s*([\d.]+)/);
    return {
      verdict: (verdictMatch?.[1] as FoodVerificationResult["verdict"]) ?? "uncertain",
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
      reasoning: raw.slice(0, 500),
      foodItemsInImage: [],
      foodItemsInVideo: [],
      matchedItems: [],
      discrepancies: ["Could not parse structured response"],
      rawAnswer: raw,
    };
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // ── Mode A: multipart upload (direct files, no pre-indexing) ─────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const imageFile = form.get("image");
      const videoFile = form.get("video");

      if (!(imageFile instanceof File) || !(videoFile instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "Both 'image' and 'video' files are required" },
          { status: 400 }
        );
      }

      const imageData = await fileToInlineData(imageFile);
      const videoData = await fileToInlineData(videoFile);

      const rawAnswer = await verifyFoodConsumption({
        imageData,
        videoData,
        imageDescription: String(form.get("imageDescription") ?? ""),
        videoDescription: String(form.get("videoDescription") ?? ""),
      });

      const verdict = parseVerdict(rawAnswer);
      const result: FoodVerificationResult = {
        ...verdict,
        imageRecord: null,
        videoRecord: null,
      };

      return NextResponse.json({ ok: true, result });
    }

    // ── Mode B: JSON with pre-indexed record IDs ──────────────────────────────
    const body = jsonSchema.parse(await req.json());
    const records = await listRecords();

    const imageRec = records.find((r) => r.id === body.imageId);
    const videoRec = records.find((r) => r.id === body.videoId);

    if (!imageRec) {
      return NextResponse.json({ ok: false, error: `Image record not found: ${body.imageId}` }, { status: 404 });
    }
    if (!videoRec) {
      return NextResponse.json({ ok: false, error: `Video record not found: ${body.videoId}` }, { status: 404 });
    }
    if (!imageRec.filePath || !imageRec.mimeType) {
      return NextResponse.json({ ok: false, error: "Image record has no file path" }, { status: 400 });
    }
    if (!videoRec.filePath || !videoRec.mimeType) {
      return NextResponse.json({ ok: false, error: "Video record has no file path" }, { status: 400 });
    }

    const imageData = await pathToInlineData(imageRec.filePath, imageRec.mimeType);
    const videoData = await pathToInlineData(videoRec.filePath, videoRec.mimeType);

    const rawAnswer = await verifyFoodConsumption({
      imageData,
      videoData,
      imageDescription: imageRec.textForRetrieval,
      videoDescription: videoRec.textForRetrieval,
    });

    const verdict = parseVerdict(rawAnswer);

    // Attach records (without embeddings — too large)
    const imageRecord: SearchResult = { ...imageRec, score: 1, embedding: [] };
    const videoRecord: SearchResult = { ...videoRec, score: 1, embedding: [] };

    const result: FoodVerificationResult = {
      ...verdict,
      imageRecord,
      videoRecord,
    };

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[/api/rag/verify-food]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
