"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletPanel } from "@/components/WalletPanel";
import { PaymentChallengeCard } from "@/components/PaymentChallengeCard";
import { ExecutionTimeline } from "@/components/ExecutionTimeline";
import { FoodDropZones } from "./FoodDropZones";
import { FoodQuoteCard } from "./FoodQuoteCard";
import { FoodPipelineGraph } from "./FoodPipelineGraph";
import { FoodSettlementView } from "./FoodSettlementView";
import { FoodReceiptDrawer } from "./FoodReceiptDrawer";
import type { JobStatus } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FoodPhase =
  | "idle"
  | "quoting"       // indexing files to get quote
  | "quoted"
  | "executing"     // first /api/food/verify call
  | "challenged"    // 402 received
  | "signing"       // EIP-712 signing
  | "funded"        // escrow funded
  | "indexing-image"
  | "indexing-video"
  | "verifying"
  | "settling"
  | "complete"
  | "error";

interface TimelineStep {
  status: JobStatus;
  timestamp: string;
  reason?: string;
}

interface FoodX402Response {
  error: "payment_required";
  x402: {
    scheme: string; network: string; asset: string;
    amount: string; payTo: string; jobId: string; resource: string;
    extra?: Record<string, string>;
  };
  quote: {
    services: Array<{ service: string; owner: string; amount: string }>;
    totalUSDC: string;
    breakdown: Record<string, string>;
  };
  wallet?: { address: string; explorerUrl: string | null };
}

export interface FoodResult {
  jobId: string;
  status: string;
  verdict: "confirmed" | "unconfirmed" | "uncertain";
  confidence: number;
  reasoning: string;
  foodItemsInImage: string[];
  foodItemsInVideo: string[];
  matchedItems: string[];
  discrepancies: string[];
  pipelineSteps: Array<{ step: string; status: string; durationMs: number }>;
  chargedUSDC: string;
  payouts: Array<{ service: string; owner: string; amount: string }>;
  receipt: { paymentAuthorizationId: string; gatewayBatchId: string; escrowStateTransitions: string[] };
  imageRecordId: string;
  videoRecordId: string;
  onChain: {
    network: string; chainId: number;
    walletAddress: string; walletExplorerUrl: string;
    gatewayAddress: string; gatewayExplorerUrl: string;
    paymentNonce: string;
  };
}

function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

// ─── Component ────────────────────────────────────────────────────────────────

export function FoodPipelineSection() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageDesc, setImageDesc] = useState("");
  const [videoDesc, setVideoDesc] = useState("");

  const [phase, setPhase] = useState<FoodPhase>("idle");
  const [hasQuote, setHasQuote] = useState(false);
  const [challenge, setChallenge] = useState<FoodX402Response | null>(null);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [currentStatus, setCurrentStatus] = useState<JobStatus | null>(null);
  const [signedNonce, setSignedNonce] = useState<string | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function addTimeline(status: JobStatus, reason?: string) {
    setTimelineSteps((p) => [...p, { status, timestamp: new Date().toISOString(), reason }]);
    setCurrentStatus(status);
  }

  function resetDemo() {
    setImageFile(null); setVideoFile(null);
    setImageDesc(""); setVideoDesc("");
    setPhase("idle"); setHasQuote(false);
    setChallenge(null); setResult(null); setError(null);
    setTimelineSteps([]); setCurrentStatus(null);
    setSignedNonce(undefined); setActiveStep(null); setCompletedSteps(new Set());
  }

  // ── Step 1: Quote — mirrors handleQuote in DemoSection ────────────────────
  // "Quoting" for the food pipeline means doing a dry-run 402 to get pricing.
  // We just show the static quote card (pricing is fixed), so this is instant.
  const handleQuote = useCallback(async () => {
    if (!imageFile || !videoFile) return;
    setPhase("quoting");
    setError(null);
    // Simulate a brief parse delay so the UI feels like DemoSection
    await delay(400);
    setHasQuote(true);
    setPhase("quoted");
  }, [imageFile, videoFile]);

  // ── Step 2: Execute — mirrors handleExecute in DemoSection ────────────────
  const handleExecute = useCallback(async () => {
    if (!imageFile || !videoFile) return;

    if (!hasQuote) await handleQuote();

    setPhase("executing");
    setError(null);
    setTimelineSteps([]);
    setCurrentStatus(null);
    addTimeline("Open", "Job created. Budget set. Awaiting payment.");

    try {
      const form = new FormData();
      form.set("image", imageFile);
      form.set("video", videoFile);
      form.set("imageDescription", imageDesc);
      form.set("videoDescription", videoDesc);

      const res = await fetch("/api/food/verify", { method: "POST", body: form });

      if (res.status === 402) {
        const data: FoodX402Response = await res.json();
        setChallenge(data);
        setPhase("challenged");
        return;
      }

      const data = await res.json();
      if (res.ok) await animateResult(data);
      else { setError(data.message ?? data.error ?? "Failed"); setPhase("error"); }
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, [imageFile, videoFile, imageDesc, videoDesc, hasQuote, handleQuote]);

  // ── Step 3: Sign — mirrors handleSign in DemoSection ─────────────────────
  const handleSign = useCallback(async () => {
    if (!challenge) return;
    setPhase("signing");
    setError(null);

    try {
      const payRes = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: challenge.x402.jobId,
          paymentRequirements: {
            scheme: challenge.x402.scheme,
            network: challenge.x402.network,
            asset: challenge.x402.asset,
            amount: challenge.x402.amount,
            payTo: challenge.x402.payTo,
            maxTimeoutSeconds: 300,
            extra: challenge.x402.extra,
          },
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) { setError(payData.message ?? "Signing failed"); setPhase("challenged"); return; }

      setSignedNonce(payData.authorization?.nonce);
      await delay(800);

      const form = new FormData();
      form.set("image", imageFile!);
      form.set("video", videoFile!);
      form.set("imageDescription", imageDesc);
      form.set("videoDescription", videoDesc);
      form.set("paymentAuthorization", JSON.stringify({
        type: "eip3009-demo",
        from: payData.authorization.from,
        amount: payData.authorization.amount,
        nonce: payData.authorization.nonce,
        signature: payData.authorization.signature,
      }));

      const calcRes = await fetch("/api/food/verify", { method: "POST", body: form });
      const calcData = await calcRes.json();

      if (!calcRes.ok) { setError(calcData.message ?? calcData.error ?? "Execution failed"); setPhase("challenged"); return; }
      await animateResult(calcData);
    } catch (e) {
      setError((e as Error).message);
      setPhase("challenged");
    }
  }, [challenge, imageFile, videoFile, imageDesc, videoDesc]);

  // ── Animate — mirrors animateExecution in DemoSection ────────────────────
  async function animateResult(data: FoodResult) {
    setResult(data);
    setChallenge(null);

    setPhase("funded");
    addTimeline("Funded", "EIP-712 authorization signed. Escrow funded.");
    await delay(800);

    // Animate each pipeline step (mirrors AST node animation)
    const steps: FoodPhase[] = ["indexing-image", "indexing-video", "verifying"];
    for (const step of steps) {
      setPhase(step);
      setActiveStep(step);
      await delay(900);
      setCompletedSteps((p) => new Set([...p, step]));
      setActiveStep(null);
      await delay(200);
    }

    setPhase("settling");
    addTimeline("Submitted", `Pipeline complete. Verdict: ${data.verdict}. Charged: ${data.chargedUSDC} USDC`);
    await delay(600);

    addTimeline("Completed", "Evaluator attested. Escrow released to providers.");
    await delay(400);

    setPhase("complete");
  }

  const isQuoting   = phase === "quoting";
  const isExecuting = ["executing", "signing", "funded", "indexing-image", "indexing-video", "verifying", "settling"].includes(phase);
  const canAct      = !!imageFile && !!videoFile;
  const showChallenge  = phase === "challenged" || phase === "signing";
  const showTimeline   = timelineSteps.length > 0;
  const showSettlement = phase === "settling" || phase === "complete";
  const showReceipt    = phase === "complete" && !!result;

  return (
    <section
      id="food-pipeline"
      className="py-16 px-6"
    >
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Section header — mirrors DemoSection header exactly */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono mb-1" style={{ color: "#00d4ff" }}>
              payment routing demo
            </p>
            <h2 className="text-2xl font-bold">Multimodal verification pipeline</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Each service is a billable provider. One payment in. Three providers paid out.
            </p>
          </div>
          {phase !== "idle" && (
            <button
              onClick={resetDemo}
              className="px-4 py-2 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              ↺ reset
            </button>
          )}
        </div>

        {/* Wallet panel */}
        <WalletPanel />

        {/* Top row: inputs + quote — mirrors DemoSection grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <FoodDropZones
            imageFile={imageFile} videoFile={videoFile}
            imageDesc={imageDesc} videoDesc={videoDesc}
            onImageFile={(f) => { setImageFile(f); if (phase !== "idle") resetDemo(); }}
            onVideoFile={(f) => { setVideoFile(f); if (phase !== "idle") resetDemo(); }}
            onImageDesc={setImageDesc} onVideoDesc={setVideoDesc}
            onQuote={handleQuote} onExecute={handleExecute}
            isQuoting={isQuoting} isExecuting={isExecuting}
            hasQuote={hasQuote} error={error}
            disabled={isExecuting}
          />
          <FoodQuoteCard isLoading={isQuoting} />
        </div>

        {/* Pipeline graph — mirrors AstGraph placement */}
        <AnimatePresence>
          {(canAct || result) && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <FoodPipelineGraph
                activeStep={activeStep}
                completedSteps={completedSteps}
                animating={isExecuting}
                pipelineSteps={result?.pipelineSteps}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment challenge — reuses PaymentChallengeCard unchanged */}
        <AnimatePresence>
          {showChallenge && challenge && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <PaymentChallengeCard
                challenge={challenge as any}
                onSign={handleSign}
                isSigning={phase === "signing"}
                signedNonce={signedNonce}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline + settlement — mirrors DemoSection grid */}
        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <ExecutionTimeline steps={timelineSteps} currentStatus={currentStatus} />
              {showSettlement && result && (
                <FoodSettlementView
                  payouts={result.payouts}
                  totalCharged={result.chargedUSDC}
                  animating={phase === "settling"}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Receipt */}
        <AnimatePresence>
          {showReceipt && result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <FoodReceiptDrawer result={result} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
