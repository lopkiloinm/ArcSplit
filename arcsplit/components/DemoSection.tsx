"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExpressionInput } from "./ExpressionInput";
import { QuoteCard } from "./QuoteCard";
import { AstGraph } from "./AstGraph";
import { PaymentChallengeCard } from "./PaymentChallengeCard";
import { ExecutionTimeline } from "./ExecutionTimeline";
import { SettlementSplitView } from "./SettlementSplitView";
import { ReceiptDrawer } from "./ReceiptDrawer";
import { WalletPanel } from "./WalletPanel";
import type {
  Quote,
  X402PaymentRequired,
  CalcSuccessResponse,
  JobStatus,
  ExecutionStep,
} from "@/lib/types";

// ─── Demo state machine ───────────────────────────────────────────────────────

type DemoPhase =
  | "idle"
  | "quoting"
  | "quoted"
  | "executing"
  | "challenged"   // 402 received
  | "signing"      // real EIP-712 signing in progress
  | "funded"       // escrow funded
  | "running"      // execution animating
  | "settling"     // split animation
  | "complete";

interface TimelineStep {
  status: JobStatus;
  timestamp: string;
  reason?: string;
}

// Extended 402 response with wallet info from real signing
interface RealX402Response extends X402PaymentRequired {
  wallet?: { address: string; explorerUrl: string | null };
}

export function DemoSection() {
  const [expression, setExpression] = useState("((3+5)*2-4)/7");
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [challenge, setChallenge] = useState<RealX402Response | null>(null);
  const [result, setResult] = useState<CalcSuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());
  const [visibleTrace, setVisibleTrace] = useState<ExecutionStep[]>([]);
  const [currentStatus, setCurrentStatus] = useState<JobStatus | null>(null);
  const [signedNonce, setSignedNonce] = useState<string | undefined>(undefined);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  function addTimelineStep(status: JobStatus, reason?: string) {
    setTimelineSteps((prev) => [
      ...prev,
      { status, timestamp: new Date().toISOString(), reason },
    ]);
    setCurrentStatus(status);
  }

  function resetDemo() {
    if (animationRef.current) clearTimeout(animationRef.current);
    setPhase("idle");
    setQuote(null);
    setChallenge(null);
    setResult(null);
    setError(null);
    setTimelineSteps([]);
    setActiveNodeId(null);
    setCompletedNodeIds(new Set());
    setVisibleTrace([]);
    setCurrentStatus(null);
    setSignedNonce(undefined);
  }

  // ── Step 1: Quote ──────────────────────────────────────────────────────────
  const handleQuote = useCallback(async () => {
    if (!expression.trim()) return;
    resetDemo();
    setPhase("quoting");
    setError(null);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Quote failed");
        setPhase("idle");
        return;
      }

      setQuote(data);
      setPhase("quoted");
    } catch {
      setError("Network error. Is the server running?");
      setPhase("idle");
    }
  }, [expression]);

  // ── Step 2: Execute → triggers real 402 ───────────────────────────────────
  const handleExecute = useCallback(async () => {
    if (!expression.trim()) return;

    if (!quote) {
      await handleQuote();
    }

    setPhase("executing");
    setError(null);
    setTimelineSteps([]);
    setCurrentStatus(null);

    addTimelineStep("Open", "Job created. Budget set. Awaiting payment.");

    try {
      // First call — expect real 402 with x402 payment requirements
      const res = await fetch("/api/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression }),
      });

      if (res.status === 402) {
        const data: RealX402Response = await res.json();
        setChallenge(data);
        setPhase("challenged");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        await animateExecution(data);
      } else {
        setError(data.message ?? "Execution failed");
        setPhase("quoted");
      }
    } catch {
      setError("Network error.");
      setPhase("quoted");
    }
  }, [expression, quote, handleQuote]);

  // ── Step 3: Real EIP-712 signing via /api/pay ─────────────────────────────
  const handleSign = useCallback(async () => {
    if (!challenge) return;
    setPhase("signing");
    setError(null);

    try {
      // Call /api/pay — this does REAL EIP-712 signing on Arc Testnet
      // Stateless: just signs the authorization, no job lookup needed
      const payRes = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: challenge.x402.jobId, // informational only
          paymentRequirements: {
            scheme: challenge.x402.scheme,
            network: challenge.x402.network,
            asset: challenge.x402.asset,
            amount: challenge.x402.amount,
            payTo: challenge.x402.payTo,
            maxTimeoutSeconds: 300,
            extra: (challenge.x402 as any).extra,
          },
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        setError(payData.message ?? "Payment signing failed");
        setPhase("challenged");
        return;
      }

      // Show the real nonce in the UI
      setSignedNonce(payData.authorization?.nonce);

      // Small delay so user sees the signed state
      await delay(800);

      // Retry /api/calc with the real signed authorization
      const calcRes = await fetch("/api/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression,
          paymentAuthorization: {
            type: "eip3009-demo",
            from: payData.authorization.from,
            amount: payData.authorization.amount,
            nonce: payData.authorization.nonce,
            signature: payData.authorization.signature,
          },
        }),
      });

      const calcData = await calcRes.json();

      if (!calcRes.ok) {
        setError(calcData.message ?? "Execution failed after payment");
        setPhase("challenged");
        return;
      }

      await animateExecution(calcData);
    } catch (e) {
      setError((e as Error).message ?? "Signing error");
      setPhase("challenged");
    }
  }, [challenge, expression]);

  // ── Animate execution storytelling ────────────────────────────────────────
  async function animateExecution(data: CalcSuccessResponse) {
    setResult(data);
    setChallenge(null);

    setPhase("funded");
    addTimelineStep("Funded", "EIP-712 authorization signed. Escrow funded.");
    await delay(800);

    setPhase("running");
    const trace = data.executionTrace;

    for (let i = 0; i < trace.length; i++) {
      const step = trace[i];
      setActiveNodeId(step.nodeId);
      setVisibleTrace((prev) => [...prev, step]);
      await delay(600);
      setCompletedNodeIds((prev) => new Set([...prev, step.nodeId]));
      setActiveNodeId(null);
      await delay(200);
    }

    setPhase("settling");
    addTimelineStep(
      "Submitted",
      `Execution complete. Result: ${data.result}. Charged: ${data.chargedUSDC} USDC`
    );
    await delay(600);

    addTimelineStep("Completed", "Evaluator attested. Escrow released to providers.");
    await delay(400);

    setPhase("complete");
  }

  const isQuoting = phase === "quoting";
  const isExecuting = ["executing", "signing", "funded", "running", "settling"].includes(phase);
  const hasQuote = quote !== null;
  const showChallenge = phase === "challenged" || phase === "signing";
  const showTimeline = timelineSteps.length > 0;
  const showSettlement = phase === "settling" || phase === "complete";
  const showReceipt = phase === "complete" && result !== null;

  return (
    <section
      id="demo"
      className="py-16 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-xs font-mono mb-1"
              style={{ color: "var(--accent)" }}
            >
              interactive demo
            </p>
            <h2 className="text-2xl font-bold">Calculator pipeline</h2>
          </div>
          {phase !== "idle" && (
            <button
              onClick={resetDemo}
              className="px-4 py-2 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              ↺ reset
            </button>
          )}
        </div>

        {/* Wallet panel — real Arc Testnet wallet */}
        <WalletPanel />

        {/* Top row: input + quote */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ExpressionInput
              value={expression}
              onChange={(v) => {
                setExpression(v);
                if (phase !== "idle") resetDemo();
              }}
              onQuote={handleQuote}
              onExecute={handleExecute}
              isQuoting={isQuoting}
              isExecuting={isExecuting}
              hasQuote={hasQuote}
              error={error}
            />
          </div>
          <QuoteCard quote={quote} isLoading={isQuoting} />
        </div>

        {/* AST graph */}
        <AnimatePresence>
          {(quote || result) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AstGraph
                ast={quote?.ast ?? null}
                activeNodeId={activeNodeId}
                completedNodeIds={completedNodeIds}
                executionTrace={visibleTrace}
                animating={phase === "running"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment challenge — real 402 with EIP-712 signing */}
        <AnimatePresence>
          {showChallenge && challenge && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <PaymentChallengeCard
                challenge={challenge}
                onSign={handleSign}
                isSigning={phase === "signing"}
                signedNonce={signedNonce}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline + settlement */}
        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <ExecutionTimeline
                steps={timelineSteps}
                currentStatus={currentStatus}
              />
              {showSettlement && result && (
                <SettlementSplitView
                  payouts={result.payouts}
                  totalCharged={result.chargedUSDC}
                  animating={phase === "settling"}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Receipt with real on-chain links */}
        <AnimatePresence>
          {showReceipt && result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ReceiptDrawer result={result as any} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
