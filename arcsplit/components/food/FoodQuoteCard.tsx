"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import type { FoodPhase } from "./types";

const SERVICES = [
  { key: "image-indexer",   label: "Image indexer",   color: "#a78bfa", icon: "🖼", amount: 0.000002, desc: "gemini-embedding-2 image" },
  { key: "video-indexer",   label: "Video indexer",   color: "#fbbf24", icon: "🎬", amount: 0.000003, desc: "gemini-embedding-2 video" },
  { key: "gemini-verifier", label: "Gemini verifier", color: "#34d399", icon: "🤖", amount: 0.000005, desc: "RAG generation" },
];

const TOTAL = 0.000010;

interface FoodQuoteCardProps {
  canRun: boolean;
  onExecute: () => void;
  isRunning: boolean;
  phase: string;
}

export function FoodQuoteCard({ canRun, onExecute, isRunning, phase }: FoodQuoteCardProps) {
  return (
    <div className="space-y-4">
      {/* Quote panel */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>quote</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
            3 providers
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Total */}
          <div className="rounded-lg p-4 text-center" style={{ background: "var(--bg-raised)" }}>
            <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>max collateral required</p>
            <p className="text-3xl font-mono font-bold" style={{ color: "var(--accent)" }}>
              <AnimatedCounter value={TOTAL} decimals={6} suffix=" USDC" />
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>3 services · fixed pricing</p>
          </div>

          {/* Service breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>service breakdown</p>
            {SERVICES.map((s, i) => (
              <motion.div key={s.key}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: "var(--bg-raised)" }}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-xs font-medium">{s.label}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                  </div>
                </div>
                <p className="text-xs font-mono" style={{ color: s.color }}>
                  {s.amount.toFixed(6)} USDC
                </p>
              </motion.div>
            ))}
          </div>

          {/* Pipeline note */}
          <div className="rounded-lg p-3 text-xs"
            style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
            <p className="font-mono mb-1" style={{ color: "var(--accent)" }}>x402 · ERC-8183</p>
            <p style={{ color: "var(--text-muted)" }}>
              One payment. Three providers paid out via ERC-8183 post-complete hook.
            </p>
          </div>
        </div>
      </div>

      {/* Execute button */}
      <button
        onClick={onExecute}
        disabled={!canRun || isRunning}
        className="w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        style={{
          background: canRun && !isRunning ? "#a78bfa" : "var(--bg-raised)",
          color: canRun && !isRunning ? "#fff" : "var(--text-muted)",
          border: canRun && !isRunning ? "none" : "1px solid var(--border-mid)",
          boxShadow: canRun && !isRunning ? "0 0 30px rgba(167,139,250,0.25)" : "none",
        }}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            {phase === "signing" ? "Signing EIP-712…" : "Running pipeline…"}
          </span>
        ) : (
          "Execute & settle →"
        )}
      </button>
    </div>
  );
}
