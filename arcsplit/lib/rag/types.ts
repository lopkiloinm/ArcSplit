// ─── RAG / Multimodal Indexing Types ─────────────────────────────────────────

export type AssetKind = "text" | "image" | "video" | "audio" | "pdf";

export interface IndexedRecord {
  id: string;
  kind: AssetKind;
  title: string;
  textForRetrieval: string;
  embedding: number[];
  mimeType?: string;
  filePath?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SearchResult extends IndexedRecord {
  score: number;
}

// ─── Food Verification ────────────────────────────────────────────────────────

export type VerificationVerdict = "confirmed" | "unconfirmed" | "uncertain";

export interface FoodVerificationResult {
  verdict: VerificationVerdict;
  confidence: number;          // 0–1
  reasoning: string;
  foodItemsInImage: string[];
  foodItemsInVideo: string[];
  matchedItems: string[];
  discrepancies: string[];
  imageRecord: SearchResult | null;
  videoRecord: SearchResult | null;
  rawAnswer: string;
}
