"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import type { Payout } from "@/lib/types";

const OP_COLORS: Record<string, string> = {
  add: "#34d399",
  subtract: "#f87171",
  multiply: "#a78bfa",
  divide: "#fbbf24",
};

const OP_SYMBOLS: Record<string, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

interface SettlementSplitViewProps {
  payouts: Payout[];
  totalCharged: string;
  animating?: boolean;
}

export function SettlementSplitView({
  payouts,
  totalCharged,
  animating = false,
}: SettlementSplitViewProps) {
  const total = parseFloat(totalCharged);

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
          payment split
        </span>
        <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
          {payouts.length} providers
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Total pool */}
        <div
          className="rounded-lg p-3 text-center"
          style={{ background: "var(--bg-raised)" }}
        >
          <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
            total charged
          </p>
          <p className="text-2xl font-mono font-bold" style={{ color: "var(--accent)" }}>
            <AnimatedCounter
              value={total}
              decimals={6}
              suffix=" USDC"
              duration={1200}
            />
          </p>
        </div>

        {/* Split visualization */}
        <div className="space-y-2">
          {payouts.map((payout, i) => {
            const amount = parseFloat(payout.amount);
            const pct = total > 0 ? (amount / total) * 100 : 0;
            const color = OP_COLORS[payout.operator] ?? "var(--accent)";

            return (
              <motion.div
                key={payout.operator}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animating ? i * 0.15 : 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono"
                      style={{
                        background: `${color}18`,
                        color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      {OP_SYMBOLS[payout.operator]}
                    </span>
                    <div>
                      <p className="text-xs font-medium capitalize">
                        {payout.operator}
                      </p>
                      <p
                        className="text-xs font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {payout.owner}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono" style={{ color }}>
                      <AnimatedCounter
                        value={amount}
                        decimals={6}
                        suffix=" USDC"
                        duration={800 + i * 100}
                      />
                    </p>
                    <p
                      className="text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pct.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-raised)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: animating ? i * 0.15 + 0.2 : 0,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ERC-8183 hook note */}
        <div
          className="rounded-lg p-3 text-xs"
          style={{
            background: "rgba(52,211,153,0.05)",
            border: "1px solid rgba(52,211,153,0.15)",
          }}
        >
          <p className="font-mono mb-1" style={{ color: "#34d399" }}>
            ERC-8183 post-complete hook
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            After evaluator calls{" "}
            <span className="font-mono">complete()</span>, the optional
            IACPHook distributes escrow to each operator provider based on
            actual usage.
          </p>
        </div>
      </div>
    </div>
  );
}
