"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import type { Quote } from "@/lib/types";

const OP_COLORS: Record<string, string> = {
  add: "var(--op-add)",
  subtract: "var(--op-subtract)",
  multiply: "var(--op-multiply)",
  divide: "var(--op-divide)",
};

const OP_SYMBOLS: Record<string, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

interface QuoteCardProps {
  quote: Quote | null;
  isLoading: boolean;
}

export function QuoteCard({ quote, isLoading }: QuoteCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#00d4ff" }}
              />
              <span className="text-xs font-mono" style={{ color: "#00d4ff" }}>
                parsing
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {!quote && !isLoading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Enter an expression to see the quote.
              </p>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 flex justify-center"
            >
              <div className="space-y-2 w-full">
                {[80, 60, 70, 50].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded animate-pulse"
                    style={{
                      width: `${w}%`,
                      background: "var(--bg-raised)",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ) : quote ? (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Total cost */}
              <div
                className="rounded-lg p-4 text-center"
                style={{ background: "var(--bg-raised)" }}
              >
                <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
                  max collateral required
                </p>
                <p className="text-3xl font-mono font-bold" style={{ color: "#00d4ff" }}>
                  <AnimatedCounter
                    value={parseFloat(quote.maxCostUSDC)}
                    decimals={6}
                    suffix=" USDC"
                  />
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {quote.totalOperations} ops × {quote.unitPriceUSDC} USDC each
                </p>
              </div>

              {/* Operation breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  operator breakdown
                </p>
                {(["add", "subtract", "multiply", "divide"] as const).map((op) => {
                  const count = quote.operationCounts[op];
                  if (count === 0) return null;
                  return (
                    <motion.div
                      key={op}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ background: "var(--bg-raised)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold font-mono"
                          style={{
                            background: `${OP_COLORS[op]}18`,
                            color: OP_COLORS[op],
                            border: `1px solid ${OP_COLORS[op]}40`,
                          }}
                        >
                          {OP_SYMBOLS[op]}
                        </span>
                        <div>
                          <p className="text-sm font-medium capitalize">{op}</p>
                          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                            wallet_{op}_demo
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono" style={{ color: OP_COLORS[op] }}>
                          ×{count}
                        </p>
                        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {(count * parseFloat(quote.unitPriceUSDC)).toFixed(6)} USDC
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Template */}
              <div
                className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-lg"
                style={{
                  background: "var(--bg-raised)",
                  color: "var(--text-muted)",
                }}
              >
                <span>template</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {quote.jobTemplate}
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
