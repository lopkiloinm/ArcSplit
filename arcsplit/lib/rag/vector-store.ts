// ─── In-process vector store ──────────────────────────────────────────────────
// JSON file on disk for dev. Replace with a real vector DB for production.

import { readFile, writeFile } from "node:fs/promises";
import { vectorStorePath, ensureDataDirs } from "./storage";
import type { IndexedRecord, SearchResult } from "./types";

async function readAll(): Promise<IndexedRecord[]> {
  await ensureDataDirs();
  const raw = await readFile(vectorStorePath(), "utf8");
  return JSON.parse(raw) as IndexedRecord[];
}

async function writeAll(records: IndexedRecord[]) {
  await writeFile(vectorStorePath(), JSON.stringify(records, null, 2), "utf8");
}

export async function insertRecord(record: IndexedRecord): Promise<IndexedRecord> {
  const records = await readAll();
  records.push(record);
  await writeAll(records);
  return record;
}

export async function listRecords(): Promise<IndexedRecord[]> {
  return readAll();
}

export async function deleteRecord(id: string): Promise<boolean> {
  const records = await readAll();
  const next = records.filter((r) => r.id !== id);
  if (next.length === records.length) return false;
  await writeAll(next);
  return true;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Embedding length mismatch");
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function searchSimilar(
  embedding: number[],
  topK = 5,
  filterKind?: string
): Promise<SearchResult[]> {
  const records = await readAll();
  return records
    .filter((r) => !filterKind || r.kind === filterKind)
    .map((record) => ({
      ...record,
      score: cosineSimilarity(embedding, record.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
