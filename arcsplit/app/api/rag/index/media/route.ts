// POST /api/rag/index/media
// Accepts multipart/form-data: file, optional title, description, metadata JSON.
// Embeds the media (image or video) using gemini-embedding-2 multimodal.
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { embedMedia, fileToInlineData } from "@/lib/rag/gemini";
import { saveUploadedFile } from "@/lib/rag/storage";
import { insertRecord } from "@/lib/rag/vector-store";
import type { AssetKind, IndexedRecord } from "@/lib/rag/types";

export const runtime = "nodejs";

function mimeToKind(mime: string): AssetKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "text";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const title = String(form.get("title") ?? file.name ?? "untitled");
    const description = String(form.get("description") ?? "");
    const metadataRaw = String(form.get("metadata") ?? "{}");

    const inlineData = await fileToInlineData(file);
    const embedding = await embedMedia({ inlineData, description: description || undefined });
    const saved = await saveUploadedFile(file);

    const record: IndexedRecord = {
      id: crypto.randomUUID(),
      kind: mimeToKind(file.type),
      title,
      textForRetrieval: description || title,
      embedding,
      mimeType: file.type,
      filePath: saved.filePath,
      metadata: JSON.parse(metadataRaw),
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
