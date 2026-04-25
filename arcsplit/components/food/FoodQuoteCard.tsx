"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";

// ─── Service registry — mirrors OPERATOR_OWNERS in calculator ─────────────────

const SERVICES = [
  {
    key: "image-indexer",
    label: "image-indexer",
    owner: "wallet_img_indexer",
    color: "#a78bfa",
    symbol: "⊕",
    amount: 0.000002,
    desc: "embedding · image",
  },
  {
    key: "video-indexer",
    label: "video-indexer",
    owner: "wallet_vid_indexer",
    color: "#fbbf24",
    symbol: "⊕",
    amount: 0.000003,
    desc: "embedding · video",
  },
  {
    key: "rag-verifier",
    label: "rag-verifier",
    owner: "wallet_rag_verifier",
    color: "#34d399",
    symbol: "✦",
    amount: 0.000005,
    desc: "RAG generation",
  },
];

const TOTAL = 0.000010;
const UNIT_PRICE = "0.000001";

interface FoodQuoteCardProps {
  isLoading: boolean;
}

export function FoodQuoteCard({ isLoading }: FoodQuoteCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      {/* Header — identical to QuoteCard */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          quote
        </span>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00d4ff" }} />
              <span className="text-xs font-mono" style={{ color: "#00d4ff" }}>indexing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 flex justify-center"
            >
              <div className="space-y-2 w-full">
                {[80, 60, 70, 50].map((w, i) => (
                  <div key={i} className="h-3 rounded animate-pulse"
                    style={{ width: `${w}%`, background: "var(--bg-raised)" }} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quote" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Total cost — identical to QuoteCard */}
              <div className="rounded-lg p-4 text-center" style={{ background: "var(--bg-raised)" }}>
                <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
                  max collateral required
                </p>
                <p className="text-3xl font-mono font-bold" style={{ color: "#00d4ff" }}>
                  <AnimatedCounter value={TOTAL} decimals={6} suffix=" USDC" />
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  3 providers · fixed per-call pricing
                </p>
              </div>

              {/* Provider breakdown — mirrors "operator breakdown" */}
              <div className="space-y-2">
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  provider breakdown
                </p>
                {SERVICES.map((s, i) => (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: "var(--bg-raised)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold font-mono"
                        style={{
                          background: `${s.color}18`,
                          color: s.color,
                          border: `1px solid ${s.color}40`,
                        }}
                      >
                        {s.symbol}
                      </span>
                      <div>
                        <p className="text-sm font-medium font-mono">{s.label}</p>
                        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {s.owner}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono" style={{ color: s.color }}>
                        ×1
                      </p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {s.amount.toFixed(6)} USDC
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Template — mirrors QuoteCard template row */}
              <div
                className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}
              >
                <span>template</span>
                <span style={{ color: "var(--text-secondary)" }}>multimodal-rag-v1</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
