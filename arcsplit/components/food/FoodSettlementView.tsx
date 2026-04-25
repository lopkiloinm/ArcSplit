"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";

const SERVICE_COLORS: Record<string, string> = {
  "image-indexer":   "#a78bfa",
  "video-indexer":   "#fbbf24",
  "gemini-verifier": "#34d399",
};

const SERVICE_ICONS: Record<string, string> = {
  "image-indexer":   "🖼",
  "video-indexer":   "🎬",
  "gemini-verifier": "🤖",
};

const VERDICT_CONFIG = {
  confirmed:   { color: "#34d399", label: "✓ Confirmed",   bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)" },
  unconfirmed: { color: "#f87171", label: "✗ Unconfirmed", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
  uncertain:   { color: "#fbbf24", label: "? Uncertain",   bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)" },
};

interface FoodSettlementViewProps {
  payouts: Array<{ service: string; owner: string; amount: string }>;
  totalCharged: string;
  verdict: "confirmed" | "unconfirmed" | "uncertain";
  animating?: boolean;
}

export function FoodSettlementView({ payouts, totalCharged, verdict, animating }: FoodSettlementViewProps) {
  const total = parseFloat(totalCharged);
  const vc = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.uncertain;

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>payment split</span>
        <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>{payouts.length} providers</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Verdict badge */}
        <div className="rounded-lg p-3 flex items-center gap-3"
          style={{ background: vc.bg, border: `1px solid ${vc.border}` }}>
          <p className="text-xl font-bold" style={{ color: vc.color }}>{vc.label}</p>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
            <motion.div className="h-full rounded-full" style={{ background: vc.color }}
              initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} />
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg p-3 text-center" style={{ background: "var(--bg-raised)" }}>
          <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>total charged</p>
          <p className="text-2xl font-mono font-bold" style={{ color: "var(--accent)" }}>
            <AnimatedCounter value={total} decimals={6} suffix=" USDC" duration={1200} />
          </p>
        </div>

        {/* Payouts */}
        <div className="space-y-2">
          {payouts.map((p, i) => {
            const amount = parseFloat(p.amount);
            const pct = total > 0 ? (amount / total) * 100 : 0;
            const color = SERVICE_COLORS[p.service] ?? "var(--accent)";
            return (
              <motion.div key={p.service}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animating ? i * 0.15 : 0 }}
                className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded flex items-center justify-center text-xs"
                      style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                      {SERVICE_ICONS[p.service] ?? "⚙"}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{p.service}</p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{p.owner}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono" style={{ color }}>
                      <AnimatedCounter value={amount} decimals={6} suffix=" USDC" duration={800 + i * 100} />
                    </p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: animating ? i * 0.15 + 0.2 : 0, ease: "easeOut" }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-lg p-3 text-xs"
          style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <p className="font-mono mb-1" style={{ color: "#34d399" }}>ERC-8183 post-complete hook</p>
          <p style={{ color: "var(--text-muted)" }}>
            After evaluator calls <span className="font-mono">complete()</span>, IACPHook distributes
            escrow to each service provider based on actual usage.
          </p>
        </div>
      </div>
    </div>
  );
}
