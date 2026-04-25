"use client";

import { motion } from "framer-motion";
import type { X402PaymentRequired } from "@/lib/types";

interface PaymentChallengeCardProps {
  challenge: X402PaymentRequired & {
    wallet?: { address: string; explorerUrl: string | null };
  };
  onSign: () => void;
  isSigning: boolean;
  signedNonce?: string;
}

const EXPLORER_BASE = "https://testnet.arcscan.app";

export function PaymentChallengeCard({
  challenge,
  onSign,
  isSigning,
  signedNonce,
}: PaymentChallengeCardProps) {
  const { x402 } = challenge;
  const wallet = (challenge as any).wallet;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid rgba(251,191,36,0.3)",
        boxShadow: "0 0 40px rgba(251,191,36,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          borderColor: "rgba(251,191,36,0.2)",
          background: "rgba(251,191,36,0.05)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
          style={{
            background: "rgba(251,191,36,0.15)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.3)",
          }}
        >
          402
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "#fbbf24" }}>
            HTTP 402 Payment Required
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            x402 payment challenge · Arc Testnet
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Explanation */}
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          The server returned{" "}
          <span className="font-mono" style={{ color: "#fbbf24" }}>
            402 Payment Required
          </span>
          . Sign a real EIP-712{" "}
          <span className="font-mono text-xs">TransferWithAuthorization</span> and
          retry. Zero gas — Circle Gateway settles onchain in batches.
        </p>

        {/* Payment details */}
        <div
          className="rounded-lg p-3 space-y-2 font-mono text-xs"
          style={{ background: "var(--bg-raised)" }}
        >
          {[
            ["scheme", x402.scheme],
            ["network", x402.network],
            ["asset (USDC)", x402.asset],
            ["amount", `${x402.amount} USDC`],
            ["payTo (Gateway)", x402.payTo],
            ["jobId", x402.jobId],
            ["resource", x402.resource],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start gap-3">
              <span style={{ color: "var(--text-muted)", minWidth: 120 }}>{k}</span>
              <span
                style={{
                  color: k === "amount" ? "#fbbf24" : k.includes("Gateway") ? "#00d4ff" : "var(--text-secondary)",
                  wordBreak: "break-all",
                }}
              >
                {k.includes("Gateway") || k === "asset (USDC)" ? (
                  <a
                    href={`${EXPLORER_BASE}/address/${v}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {v} ↗
                  </a>
                ) : (
                  v
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Wallet info */}
        {wallet?.address && (
          <div
            className="rounded-lg p-3 text-xs font-mono"
            style={{
              background: "rgba(0, 212, 255, 0.08)",
              border: "1px solid rgba(0, 212, 255, 0.14)",
            }}
          >
            <p className="mb-1" style={{ color: "#00d4ff" }}>
              Signing wallet
            </p>
            <a
              href={wallet.explorerUrl ?? `${EXPLORER_BASE}/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline break-all"
              style={{ color: "var(--text-secondary)" }}
            >
              {wallet.address} ↗
            </a>
          </div>
        )}

        {/* Circle Gateway note */}
        <div
          className="rounded-lg p-3 text-xs"
          style={{
            background: "rgba(167,139,250,0.05)",
            border: "1px solid rgba(167,139,250,0.15)",
          }}
        >
          <p className="font-mono mb-1" style={{ color: "#a78bfa" }}>
            Circle Gateway Nanopayments
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            Buyer signs EIP-712 offchain (zero gas). Gateway batches
            authorizations and settles net positions onchain on Arc Testnet.
            View settlement txs on{" "}
            <a
              href={`${EXPLORER_BASE}/address/${x402.payTo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "#a78bfa" }}
            >
              arcscan.app ↗
            </a>
          </p>
        </div>

        {/* Signed confirmation */}
        {signedNonce && (
          <div
            className="rounded-lg p-3 text-xs font-mono"
            style={{
              background: "rgba(52,211,153,0.06)",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            <p className="mb-1" style={{ color: "#34d399" }}>
              ✓ EIP-712 signature created
            </p>
            <p style={{ color: "var(--text-muted)" }}>
              nonce: {signedNonce.slice(0, 20)}…
            </p>
          </div>
        )}

        {/* Sign button */}
        {!signedNonce && (
          <button
            onClick={onSign}
            disabled={isSigning}
            className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: "#fbbf24",
              color: "#000",
            }}
          >
            {isSigning ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Signing EIP-712 authorization…
              </span>
            ) : (
              "Sign EIP-712 authorization →"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
