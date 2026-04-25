// POST /api/food/verify
// x402-gated food consumption verification pipeline.
//
// Mirrors /api/calc exactly in payment semantics:
//   1. No payment → HTTP 402 with x402 challenge
//   2. With signed authorization → index both media, run Gemini RAG, settle
//
// Pricing:
//   - Index image:  0.000002 USDC  (gemini-embedding-2 call)
//   - Index video:  0.000003 USDC  (gemini-embedding-2 multimodal call)
//   - Verify (RAG): 0.000005 USDC  (Gemini generation call)
//   - Total:        0.000010 USDC  per verification

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMnemonic, GATEWAY_ADDRESS, EXPLORER_BASE } from "@/lib/wallet";
import { mnemonicToAccount } from "viem/accounts";
import { fileToInlineData, embedMedia, verifyFoodConsumption } from "@/lib/rag/gemini";
import { saveUploadedFile } from "@/lib/rag/storage";
import { insertRecord } from "@/lib/rag/vector-store";
import type { IndexedRecord } from "@/lib/rag/types";

export const runtime = "nodejs";

// ─── Pricing ─────────────────────────────────────────────────────────────────

export const FOOD_PIPELINE_PRICE = {
  indexImage:  "0.000002",
  indexVideo:  "0.000003",
  verify:      "0.000005",
  total:       "0.000010",
} as const;

// ─── Providers (parallel to OPERATOR_OWNERS in calculator) ───────────────────

export const FOOD_PROVIDERS = [
  { service: "image-indexer", owner: "wallet_img_indexer",  amount: FOOD_PIPELINE_PRICE.indexImage },
  { service: "video-indexer", owner: "wallet_vid_indexer",  amount: FOOD_PIPELINE_PRICE.indexVideo },
  { service: "rag-verifier",  owner: "wallet_rag_verifier", amount: FOOD_PIPELINE_PRICE.verify },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVerdict(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const p = JSON.parse(cleaned);
    return {
      verdict: (p.verdict ?? "uncertain") as "confirmed" | "unconfirmed" | "uncertain",
      confidence: typeof p.confidence === "number" ? p.confidence : 0.5,
      reasoning: p.reasoning ?? "",
      foodItemsInImage: Array.isArray(p.foodItemsInImage) ? p.foodItemsInImage : [],
      foodItemsInVideo: Array.isArray(p.foodItemsInVideo) ? p.foodItemsInVideo : [],
      matchedItems: Array.isArray(p.matchedItems) ? p.matchedItems : [],
      discrepancies: Array.isArray(p.discrepancies) ? p.discrepancies : [],
      rawAnswer: raw,
    };
  } catch {
    return {
      verdict: "uncertain" as const,
      confidence: 0.5,
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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // Must be multipart — image + video files + optional payment authorization
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "multipart/form-data required" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const imageFile = form.get("image");
    const videoFile = form.get("video");
    const imageDesc = String(form.get("imageDescription") ?? "");
    const videoDesc = String(form.get("videoDescription") ?? "");
    const paymentAuthRaw = form.get("paymentAuthorization");

    if (!(imageFile instanceof File) || !(videoFile instanceof File)) {
      return NextResponse.json(
        { error: "Both 'image' and 'video' files are required" },
        { status: 400 }
      );
    }

    // ── x402: No payment → 402 Payment Required ───────────────────────────────
    if (!paymentAuthRaw) {
      const mnemonic = getMnemonic();
      const payerAddress = mnemonic ? mnemonicToAccount(mnemonic).address : "buyer_demo_wallet";
      const jobId = `food_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

      return NextResponse.json(
        {
          error: "payment_required",
          x402: {
            scheme: "exact",
            network: "eip155:5042002",
            asset: "0x3600000000000000000000000000000000000000",
            amount: FOOD_PIPELINE_PRICE.total,
            payTo: GATEWAY_ADDRESS,
            jobId,
            resource: "/api/food/verify",
            extra: {
              name: "GatewayWalletBatched",
              version: "1",
              verifyingContract: GATEWAY_ADDRESS,
            },
          },
          quote: {
            services: FOOD_PROVIDERS,
            totalUSDC: FOOD_PIPELINE_PRICE.total,
            breakdown: {
              "image-indexer":   `${FOOD_PIPELINE_PRICE.indexImage} USDC — gemini-embedding-2 image`,
              "video-indexer":   `${FOOD_PIPELINE_PRICE.indexVideo} USDC — gemini-embedding-2 video`,
              "gemini-verifier": `${FOOD_PIPELINE_PRICE.verify} USDC — Gemini RAG generation`,
            },
          },
          wallet: {
            address: payerAddress,
            explorerUrl: mnemonic
              ? `${EXPLORER_BASE}/address/${mnemonicToAccount(mnemonic).address}`
              : null,
          },
        },
        {
          status: 402,
          headers: {
            "X-Payment-Required": "true",
            "X-Payment-Amount": FOOD_PIPELINE_PRICE.total,
            "X-Payment-Asset": "USDC",
            "X-Payment-Network": "eip155:5042002",
          },
        }
      );
    }

    // ── Payment present: run full pipeline ────────────────────────────────────
    let paymentAuth: { type: string; from: string; amount: string; nonce: string; signature: string };
    try {
      paymentAuth = JSON.parse(String(paymentAuthRaw));
    } catch {
      return NextResponse.json({ error: "Invalid paymentAuthorization JSON" }, { status: 400 });
    }

    const jobId = `food_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const startedAt = new Date().toISOString();
    const steps: { step: string; status: "done"; durationMs: number }[] = [];

    // Step 1: Index image
    let t = Date.now();
    const imageInline = await fileToInlineData(imageFile);
    const imageEmbedding = await embedMedia({
      inlineData: imageInline,
      description: imageDesc || `Food image: ${imageFile.name}`,
    });
    const imageSaved = await saveUploadedFile(imageFile);
    const imageRecord: IndexedRecord = {
      id: crypto.randomUUID(),
      kind: "image",
      title: imageFile.name,
      textForRetrieval: imageDesc || `Food image: ${imageFile.name}`,
      embedding: imageEmbedding,
      mimeType: imageFile.type,
      filePath: imageSaved.filePath,
      metadata: { role: "food-image", jobId },
      createdAt: new Date().toISOString(),
    };
    await insertRecord(imageRecord);
    steps.push({ step: "index-image", status: "done", durationMs: Date.now() - t });

    // Step 2: Index video
    t = Date.now();
    const videoInline = await fileToInlineData(videoFile);
    const videoEmbedding = await embedMedia({
      inlineData: videoInline,
      description: videoDesc || `Eating video: ${videoFile.name}`,
    });
    const videoSaved = await saveUploadedFile(videoFile);
    const videoRecord: IndexedRecord = {
      id: crypto.randomUUID(),
      kind: "video",
      title: videoFile.name,
      textForRetrieval: videoDesc || `Eating video: ${videoFile.name}`,
      embedding: videoEmbedding,
      mimeType: videoFile.type,
      filePath: videoSaved.filePath,
      metadata: { role: "eating-video", jobId },
      createdAt: new Date().toISOString(),
    };
    await insertRecord(videoRecord);
    steps.push({ step: "index-video", status: "done", durationMs: Date.now() - t });

    // Step 3: Gemini RAG verification
    t = Date.now();
    const rawAnswer = await verifyFoodConsumption({
      imageData: imageInline,
      videoData: videoInline,
      imageDescription: imageDesc,
      videoDescription: videoDesc,
    });
    const verdict = parseVerdict(rawAnswer);
    steps.push({ step: "gemini-verify", status: "done", durationMs: Date.now() - t });

    // Build payouts (parallel to calculator payouts)
    const payouts = FOOD_PROVIDERS.map((p) => ({ ...p }));

    const mnemonic = getMnemonic();
    const walletAddress = mnemonic
      ? mnemonicToAccount(mnemonic).address
      : paymentAuth.from;

    return NextResponse.json({
      ok: true,
      jobId,
      status: "Completed",
      startedAt,
      completedAt: new Date().toISOString(),
      // Verification result
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      reasoning: verdict.reasoning,
      foodItemsInImage: verdict.foodItemsInImage,
      foodItemsInVideo: verdict.foodItemsInVideo,
      matchedItems: verdict.matchedItems,
      discrepancies: verdict.discrepancies,
      // Pipeline trace (parallel to executionTrace in calculator)
      pipelineSteps: steps,
      // Payment settlement
      chargedUSDC: FOOD_PIPELINE_PRICE.total,
      payouts,
      receipt: {
        paymentAuthorizationId: `auth_food_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
        gatewayBatchId: `batch_food_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
        escrowStateTransitions: ["Open", "Funded", "Submitted", "Completed"],
      },
      // Index record IDs
      imageRecordId: imageRecord.id,
      videoRecordId: videoRecord.id,
      // On-chain context
      onChain: {
        network: "Arc Testnet",
        chainId: 5042002,
        walletAddress,
        walletExplorerUrl: `${EXPLORER_BASE}/address/${walletAddress}`,
        gatewayAddress: GATEWAY_ADDRESS,
        gatewayExplorerUrl: `${EXPLORER_BASE}/address/${GATEWAY_ADDRESS}`,
        paymentNonce: paymentAuth.nonce,
      },
    });
  } catch (err) {
    console.error("[/api/food/verify]", err);
    return NextResponse.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
