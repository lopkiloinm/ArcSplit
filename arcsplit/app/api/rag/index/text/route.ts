// POST /api/rag/index/text
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { embedTextDocument } from "@/lib/rag/gemini";
import { insertRecord } from "@/lib/rag/vector-store";
import type { IndexedRecord } from "@/lib/rag/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().optional(),
  text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const embedding = await embedTextDocument({ title: body.title, text: body.text });
    const record: IndexedRecord = {
      id: crypto.randomUUID(),
      kind: "text",
      title: body.title ?? "untitled",
      textForRetrieval: body.text,
      embedding,
      metadata: body.metadata ?? {},
      createdAt: new Date().toISOString(),
    };
    await insertRecord(record);
    return NextResponse.json({ ok: true, record: { ...record, embedding: undefined } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
