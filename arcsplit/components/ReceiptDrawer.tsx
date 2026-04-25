"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalcSuccessResponse } from "@/lib/types";

const EXPLORER_BASE = "https://testnet.arcscan.app";

interface ReceiptDrawerProps {
  result: CalcSuccessResponse & {
    onChain?: {
      network: string;
      chainId: number;
      walletAddress: string;
      walletExplorerUrl: string;
      gatewayAddress: string;
      gatewayExplorerUrl: string;
      paymentNonce: string;
    };
  };
}

export function ReceiptDrawer({ result }: ReceiptDrawerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(result, null, 2);
  const onChain = result.onChain;

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid rgba(52,211,153,0.3)",
        boxShadow: "0 0 40px rgba(52,211,153,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: "rgba(52,211,153,0.2)",
          background: "rgba(52,211,153,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.3)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7l3.5 3.5L12 3"
                stroke="#34d399"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#34d399" }}>
              Settlement complete
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {result.jobId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              color: copied ? "#34d399" : "var(--text-muted)",
            }}
          >
            {copied ? "✓ copied" : "copy JSON"}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {open ? "hide log ↑" : "view log ↓"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "result",
            value: Number.isInteger(result.result)
              ? String(result.result)
              : result.result.toFixed(8),
            color: "var(--accent)",
          },
          {
            label: "charged",
            value: `${result.chargedUSDC} USDC`,
            color: "#34d399",
          },
          {
            label: "operators",
            value: String(result.executionTrace.length),
            color: "#a78bfa",
          },
          {
            label: "providers paid",
            value: String(result.payouts.length),
            color: "#fbbf24",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg p-3 text-center"
            style={{ background: "var(--bg-raised)" }}
          >
            <p
              className="text-xs font-mono mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              {item.label}
            </p>
            <p
              className="text-sm font-mono font-bold"
              style={{ color: item.color }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Receipt IDs */}
      <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          ["payment auth", result.receipt.paymentAuthorizationId],
          ["gateway batch", result.receipt.gatewayBatchId],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: "var(--bg-raised)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span style={{ color: "var(--text-secondary)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Real on-chain links */}
      {onChain && (
        <div
          className="mx-4 mb-4 rounded-lg p-3 text-xs font-mono space-y-2"
          style={{
            background: "rgba(0,212,255,0.04)",
            border: "1px solid rgba(0,212,255,0.12)",
          }}
        >
          <p className="mb-2" style={{ color: "var(--accent)" }}>
            On-chain · {onChain.network} (chain {onChain.chainId})
          </p>
          {[
            ["wallet", onChain.walletAddress, onChain.walletExplorerUrl],
            ["gateway", onChain.gatewayAddress, onChain.gatewayExplorerUrl],
          ].map(([label, addr, url]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span style={{ color: "var(--text-muted)", minWidth: 60 }}>{label}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:underline"
                style={{ color: "var(--accent)" }}
              >
                {addr.slice(0, 12)}…{addr.slice(-8)} ↗
              </a>
            </div>
          ))}
          <div className="flex items-start gap-2 pt-1">
            <span style={{ color: "var(--text-muted)", minWidth: 60 }}>nonce</span>
            <span
              className="truncate text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {onChain.paymentNonce.slice(0, 20)}…
            </span>
          </div>
          <p className="pt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Circle Gateway batches signed authorizations and settles net positions
            onchain. View settlement txs on{" "}
            <a
              href={`${EXPLORER_BASE}/address/${onChain.gatewayAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--accent)" }}
            >
              arcscan.app ↗
            </a>
          </p>
        </div>
      )}

      {/* JSON log drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <pre
              className="p-4 text-xs font-mono overflow-auto max-h-96"
              style={{ color: "var(--text-secondary)", background: "var(--bg-surface)" }}
            >
              {json}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
