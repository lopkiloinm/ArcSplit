"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FoodResult } from "./FoodPipelineSection";

const EXPLORER_BASE = "https://testnet.arcscan.app";

const VERDICT_CONFIG = {
  confirmed:   { color: "#34d399", label: "✓ Confirmed" },
  unconfirmed: { color: "#f87171", label: "✗ Unconfirmed" },
  uncertain:   { color: "#fbbf24", label: "? Uncertain" },
};

export function FoodReceiptDrawer({ result }: { result: FoodResult }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const vc = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.uncertain;
  const json = JSON.stringify(result, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: `1px solid ${vc.color}50`, boxShadow: `0 0 40px ${vc.color}08` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `${vc.color}25`, background: `${vc.color}06` }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${vc.color}20`, border: `1px solid ${vc.color}40` }}>
            <span style={{ fontSize: 14 }}>{result.verdict === "confirmed" ? "✓" : result.verdict === "unconfirmed" ? "✗" : "?"}</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: vc.color }}>
              {vc.label} · Settlement complete
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{result.jobId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: copied ? "#34d399" : "var(--text-muted)" }}>
            {copied ? "✓ copied" : "copy JSON"}
          </button>
          <button onClick={() => setOpen(!open)} className="px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            {open ? "hide log ↑" : "view log ↓"}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "verdict",    value: result.verdict,                    color: vc.color },
          { label: "confidence", value: `${(result.confidence * 100).toFixed(0)}%`, color: "#a78bfa" },
          { label: "charged",    value: `${result.chargedUSDC} USDC`,      color: "#34d399" },
          { label: "providers",  value: String(result.payouts.length),     color: "#fbbf24" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: "var(--bg-raised)" }}>
            <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
            <p className="text-sm font-mono font-bold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      <div className="px-4 pb-3">
        <div className="rounded-lg p-3" style={{ background: "var(--bg-raised)" }}>
          <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>gemini reasoning</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.reasoning}</p>
        </div>
      </div>

      {/* Food items */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-3">
        {[
          { label: "in image", items: result.foodItemsInImage, color: "#a78bfa" },
          { label: "in video", items: result.foodItemsInVideo, color: "#fbbf24" },
          { label: "matched",  items: result.matchedItems,     color: "#34d399" },
        ].map((group) => (
          <div key={group.label}>
            <p className="text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>{group.label}</p>
            <div className="flex flex-wrap gap-1">
              {group.items.length === 0
                ? <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                : group.items.map((item) => (
                  <span key={item} className="px-1.5 py-0.5 rounded text-xs font-mono"
                    style={{ background: `${group.color}12`, color: group.color, border: `1px solid ${group.color}30` }}>
                    {item}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Receipt IDs */}
      <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          ["payment auth", result.receipt.paymentAuthorizationId],
          ["gateway batch", result.receipt.gatewayBatchId],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: "var(--bg-raised)" }}>
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span style={{ color: "var(--text-secondary)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* On-chain links */}
      <div className="mx-4 mb-4 rounded-lg p-3 text-xs font-mono space-y-2"
        style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
        <p className="mb-2" style={{ color: "var(--accent)" }}>
          On-chain · {result.onChain.network} (chain {result.onChain.chainId})
        </p>
        {[
          ["wallet",  result.onChain.walletAddress,  result.onChain.walletExplorerUrl],
          ["gateway", result.onChain.gatewayAddress, result.onChain.gatewayExplorerUrl],
        ].map(([label, addr, url]) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <span style={{ color: "var(--text-muted)", minWidth: 60 }}>{label}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="truncate hover:underline" style={{ color: "var(--accent)" }}>
              {addr.slice(0, 12)}…{addr.slice(-8)} ↗
            </a>
          </div>
        ))}
        <div className="flex items-start gap-2 pt-1">
          <span style={{ color: "var(--text-muted)", minWidth: 60 }}>nonce</span>
          <span className="truncate" style={{ color: "var(--text-secondary)" }}>
            {result.onChain.paymentNonce.slice(0, 20)}…
          </span>
        </div>
        <p className="pt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Circle Gateway batches signed authorizations and settles onchain.{" "}
          <a href={`${EXPLORER_BASE}/address/${result.onChain.gatewayAddress}`}
            target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: "var(--accent)" }}>
            View on arcscan.app ↗
          </a>
        </p>
      </div>

      {/* JSON log */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t"
            style={{ borderColor: "var(--border)" }}>
            <pre className="p-4 text-xs font-mono overflow-auto max-h-96"
              style={{ color: "var(--text-secondary)", background: "var(--bg-surface)" }}>
              {json}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
