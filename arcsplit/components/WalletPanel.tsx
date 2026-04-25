"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";

interface WalletBalance {
  address: string;
  nativeUsdc: string;
  erc20Usdc: string;
  gatewayAllowance: string;
  isUnlimitedAllowance: boolean;
  explorerUrl: string;
  chain: string;
  chainId: number;
}

interface SetupTx {
  hash: string;
  blockNumber: string;
  status: string;
  explorerUrl: string;
}

export function WalletPanel() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txs, setTxs] = useState<{ approveTx?: SetupTx; depositTx?: SetupTx } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/balance");
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error);
      } else {
        setBalance(data);
      }
    } catch {
      setError("Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  async function handleSetup(action: "approve" | "deposit" | "all") {
    setSetupLoading(true);
    setError(null);
    setTxs(null);
    try {
      const res = await fetch("/api/wallet/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amountUsdc: 5 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error);
      } else {
        setTxs({ approveTx: data.approveTx, depositTx: data.depositTx });
        if (data.balance) setBalance(data.balance);
      }
    } catch {
      setError("Transaction failed");
    } finally {
      setSetupLoading(false);
    }
  }

  const needsApprove = balance && balance.gatewayAllowance === "0";
  const needsDeposit =
    balance &&
    parseFloat(balance.erc20Usdc) > 0 &&
    balance.gatewayAllowance !== "0";
  const noFunds = balance && parseFloat(balance.erc20Usdc) === 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background:
                balance && parseFloat(balance.erc20Usdc) > 0
                  ? "var(--op-add)"
                  : loading
                  ? "#00d4ff"
                  : "var(--text-muted)",
              boxShadow:
                balance && parseFloat(balance.erc20Usdc) > 0
                  ? "0 0 6px var(--op-add)"
                  : "none",
            }}
          />
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            arc testnet wallet
          </span>
          {balance && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0, 212, 255, 0.12)",
                color: "#00d4ff",
                border: "1px solid rgba(0, 212, 255, 0.24)",
              }}
            >
              {balance.chain}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {balance && (
            <span className="text-xs font-mono" style={{ color: "#00d4ff" }}>
              {parseFloat(balance.erc20Usdc).toFixed(4)} USDC
            </span>
          )}
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {loading && (
                <p className="text-xs font-mono text-center" style={{ color: "var(--text-muted)" }}>
                  Fetching on-chain balance…
                </p>
              )}

              {error && (
                <div
                  className="rounded-lg p-3 text-xs font-mono"
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    color: "var(--op-subtract)",
                  }}
                >
                  {error}
                  {error.includes("OWS_MNEMONIC") && (
                    <p className="mt-1 opacity-70">
                      Add OWS_MNEMONIC to arcsplit/.env.local and restart the server.
                    </p>
                  )}
                </div>
              )}

              {balance && (
                <>
                  {/* Address */}
                  <div
                    className="rounded-lg p-3 font-mono text-xs space-y-1"
                    style={{ background: "var(--bg-raised)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-muted)" }}>address</span>
                      <a
                        href={balance.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[200px] hover:underline"
                        style={{ color: "#00d4ff" }}
                      >
                        {balance.address.slice(0, 10)}…{balance.address.slice(-8)}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-muted)" }}>erc-20 usdc</span>
                      <span style={{ color: "var(--op-add)" }}>
                        {parseFloat(balance.erc20Usdc).toFixed(6)} USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-muted)" }}>gateway allowance</span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {balance.gatewayAllowance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-muted)" }}>native (gas)</span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {parseFloat(balance.nativeUsdc).toFixed(6)} USDC
                      </span>
                    </div>
                  </div>

                  {/* No funds warning */}
                  {noFunds && (
                    <div
                      className="rounded-lg p-3 text-xs"
                      style={{
                        background: "rgba(251,191,36,0.06)",
                        border: "1px solid rgba(251,191,36,0.2)",
                      }}
                    >
                      <p className="font-mono mb-1" style={{ color: "#fbbf24" }}>
                        Wallet needs funding
                      </p>
                      <p style={{ color: "var(--text-muted)" }}>
                        Visit{" "}
                        <a
                          href={`https://faucet.circle.com/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          style={{ color: "#fbbf24" }}
                        >
                          faucet.circle.com
                        </a>
                        , select <strong>Arc Testnet</strong>, and send 20 USDC to:
                      </p>
                      <code
                        className="block mt-1 text-xs break-all"
                        style={{ color: "#00d4ff" }}
                      >
                        {balance.address}
                      </code>
                    </div>
                  )}

                  {/* Setup actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetup("approve")}
                      disabled={setupLoading}
                      className="flex-1 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
                      style={{
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-mid)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Approve Gateway
                    </button>
                    <button
                      onClick={() => handleSetup("deposit")}
                      disabled={setupLoading || !!noFunds}
                      className="flex-1 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
                      style={{
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-mid)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Deposit 5 USDC
                    </button>
                    <button
                      onClick={fetchBalance}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer disabled:opacity-40"
                      style={{
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      ↺
                    </button>
                  </div>

                  {setupLoading && (
                    <p className="text-xs font-mono text-center" style={{ color: "#00d4ff" }}>
                      Broadcasting transaction to Arc Testnet…
                    </p>
                  )}
                </>
              )}

              {/* Transaction receipts */}
              <AnimatePresence>
                {txs && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    {[
                      txs.approveTx && { label: "Approve", tx: txs.approveTx },
                      txs.depositTx && { label: "Deposit", tx: txs.depositTx },
                    ]
                      .filter(Boolean)
                      .map((item) => {
                        const { label, tx } = item as { label: string; tx: SetupTx };
                        return (
                          <div
                            key={tx.hash}
                            className="rounded-lg p-3 text-xs font-mono space-y-1"
                            style={{
                              background: "rgba(52,211,153,0.06)",
                              border: "1px solid rgba(52,211,153,0.2)",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span style={{ color: "#34d399" }}>✓ {label} tx</span>
                              <span style={{ color: "var(--text-muted)" }}>
                                block {Number(tx.blockNumber).toLocaleString()}
                              </span>
                            </div>
                            <a
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate hover:underline"
                              style={{ color: "#00d4ff" }}
                            >
                              {tx.hash.slice(0, 20)}…{tx.hash.slice(-8)} ↗
                            </a>
                          </div>
                        );
                      })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
