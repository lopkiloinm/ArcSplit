// ─── File-backed storage for RAG records ─────────────────────────────────────
// Stores uploaded media files and the vector-store.json index.
// Production: swap vector-store.json for pgvector / Qdrant / Pinecone.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STORE_PATH = path.join(DATA_DIR, "vector-store.json");

export async function ensureDataDirs() {
  await mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, "[]", "utf8");
  }
}

export async function saveUploadedFile(file: File): Promise<{ filePath: string; fileName: string }> {
  await ensureDataDirs();
  const id = crypto.randomUUID();
  const original = file.name || "upload.bin";
  const ext = original.includes(".") ? `.${original.split(".").pop()}` : "";
  const fileName = `${id}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return { filePath, fileName };
}

export function vectorStorePath() {
  return STORE_PATH;
}
