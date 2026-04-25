// POST /api/rag/search
import { NextResponse } from "next/server";
import { z } from "zod";
import { embedTextQuery } from "@/lib/rag/gemini";
import { searchSimilar, listRecords } from "@/lib/rag/vector-store";

export const runtime = "nodejs";

const bodySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().min(1).max(20).optional(),
  kind: z.enum(["text", "image", "video", "audio", "pdf"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const queryEmbedding = await embedTextQuery(body.query);
    const results = await searchSimilar(queryEmbedding, body.topK ?? 5, body.kind);
    return NextResponse.json({
      ok: true,
      query: body.query,
      count: results.length,
      results: results.map((r) => ({ ...r, embedding: undefined })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

// GET /api/rag/search — list all indexed records
export async function GET() {
  try {
    const records = await listRecords();
    return NextResponse.json({
      ok: true,
      count: records.length,
      records: records.map((r) => ({ ...r, embedding: undefined })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
