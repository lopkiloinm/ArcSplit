"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Quote the workflow",
    body: "Parse the expression into an AST. Count operations. Compute max collateral before a single byte of execution.",
    tag: "POST /api/quote",
    color: "var(--accent)",
  },
  {
    n: "02",
    title: "HTTP 402 challenge",
    body: "Call /api/calc without payment. Server returns 402 with x402-compatible payment details: amount, asset, destination.",
    tag: "x402 Protocol",
    color: "#fbbf24",
  },
  {
    n: "03",
    title: "Sign & authorize",
    body: "Buyer signs an EIP-3009 payment authorization offchain. Zero gas. Circle Gateway queues it for batch settlement.",
    tag: "Circle Nanopayments",
    color: "#a78bfa",
  },
  {
    n: "04",
    title: "Escrow & execute",
    body: "Job moves Open → Funded → Submitted → Completed. Each state transition is logged. Execution runs only after escrow is confirmed.",
    tag: "ERC-8183",
    color: "#34d399",
  },
  {
    n: "05",
    title: "Split & settle",
    body: "Post-complete hook distributes escrow to each operator provider based on actual usage. One payment in. Many payouts out.",
    tag: "IACPHook",
    color: "#f87171",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p
            className="text-xs font-mono mb-3"
            style={{ color: "var(--accent)" }}
          >
            how it works
          </p>
          <h2 className="text-3xl font-bold mb-4">
            From expression to settlement
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Every step is documented, typed, and ready to swap for real
            integrations. The calculator is the demo. The protocol is the
            product.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-2xl font-bold font-mono"
                  style={{ color: step.color, opacity: 0.4 }}
                >
                  {step.n}
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: `${step.color}12`,
                    color: step.color,
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  {step.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* AI pipeline generalization note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-xl p-6"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              <p
                className="text-xs font-mono mb-2"
                style={{ color: "var(--accent)" }}
              >
                from calculator to AI pipeline
              </p>
              <h3 className="text-base font-semibold mb-2">
                Replace operators with pipeline components
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                The same middleware works for any composable pipeline. Swap{" "}
                <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-raised)" }}>
                  add
                </code>{" "}
                for{" "}
                <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-raised)" }}>
                  retriever
                </code>
                ,{" "}
                <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-raised)" }}>
                  multiply
                </code>{" "}
                for{" "}
                <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-raised)" }}>
                  model
                </code>
                ,{" "}
                <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-raised)" }}>
                  divide
                </code>{" "}
                for{" "}
                <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg-raised)" }}>
                  reranker
                </code>
                . One buyer payment. Every component provider paid out.
              </p>
            </div>
            <div className="flex-shrink-0 grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                ["add", "retriever"],
                ["subtract", "filter"],
                ["multiply", "model"],
                ["divide", "reranker"],
              ].map(([from, to]) => (
                <div
                  key={from}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "var(--bg-raised)" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{from}</span>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                  <span style={{ color: "var(--accent)" }}>{to}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
