"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";

// ─── Provider registry — mirrors OP_COLORS / OP_SYMBOLS in SettlementSplitView

const PROVIDER_COLORS: Record<string, string> = {
  "image-indexer":  "#a78bfa",
  "video-indexer":  "#fbbf24",
  "rag-verifier":   "#34d399",
};

const PROVIDER_SYMBOLS: Record<string, string> = {
  "image-indexer":  "⊕",
  "video-indexer":  "⊕",
  "rag-verifier":   "✦",
};

interface FoodSettlementViewProps {
  payouts: Array<{ service: string; owner: string; amount: string }>;
  totalCharged: string;
  animating?: boolean;
}

// Structurally identical to SettlementSplitView — only the data shape differs.
export function FoodSettlementView({
  payouts, totalCharged, animating = false,
}: FoodSettlementViewProps) {
  const total = parseFloat(totalCharged);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          payment split
        </span>
        <span className="text-xs font-mono" style={{ color: "#00d4ff" }}>
          {payouts.length} providers
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Total pool */}
        <div className="rounded-lg p-3 text-center" style={{ background: "var(--bg-raised)" }}>
          <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
            total charged
          </p>
          <p className="text-2xl font-mono font-bold" style={{ color: "#00d4ff" }}>
            <AnimatedCounter value={total} decimals={6} suffix=" USDC" duration={1200} />
          </p>
        </div>

        {/* Split visualization — identical to SettlementSplitView */}
        <div className="space-y-2">
          {payouts.map((payout, i) => {
            const amount = parseFloat(payout.amount);
            const pct = total > 0 ? (amount / total) * 100 : 0;
            const color = PROVIDER_COLORS[payout.service] ?? "#00d4ff";

            return (
              <motion.div
                key={payout.service}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animating ? i * 0.15 : 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                    >
                      {PROVIDER_SYMBOLS[payout.service] ?? "·"}
                    </span>
                    <div>
                      <p className="text-xs font-medium font-mono">{payout.service}</p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {payout.owner}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono" style={{ color }}>
                      <AnimatedCounter value={amount} decimals={6} suffix=" USDC" duration={800 + i * 100} />
                    </p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {pct.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                  <motion.div
                    className="h-full rounded-full" style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: animating ? i * 0.15 + 0.2 : 0, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ERC-8183 hook note — identical to SettlementSplitView */}
        <div
          className="rounded-lg p-3 text-xs"
          style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}
        >
          <p className="font-mono mb-1" style={{ color: "#34d399" }}>
            ERC-8183 post-complete hook
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            After evaluator calls{" "}
            <span className="font-mono">complete()</span>, the optional
            IACPHook distributes escrow to each provider based on actual usage.
          </p>
        </div>
      </div>
    </div>
  );
}
