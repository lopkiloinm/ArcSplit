"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Quote the pipeline",
    body: "Before any execution, the router counts billable operations and computes max collateral. No surprises.",
    tag: "pre-flight quote",
    color: "#00d4ff",
  },
  {
    n: "02",
    title: "HTTP 402 challenge",
    body: "The resource returns 402 with machine-readable payment details: amount, asset, destination, job ID.",
    tag: "x402 Protocol",
    color: "#fbbf24",
  },
  {
    n: "03",
    title: "Sign & authorize",
    body: "Buyer signs an EIP-3009 authorization offchain. Zero gas. Circle Gateway queues it for batch settlement.",
    tag: "Circle Nanopayments",
    color: "#a78bfa",
  },
  {
    n: "04",
    title: "Escrow & execute",
    body: "Job moves Open → Funded → Submitted → Completed. Execution is gated on confirmed escrow. Every transition is logged.",
    tag: "ERC-8183",
    color: "#34d399",
  },
  {
    n: "05",
    title: "Split & settle",
    body: "Post-complete hook distributes escrow to each provider based on actual usage. One payment in. Many payouts out.",
    tag: "IACPHook",
    color: "#f87171",
  },
];

const PIPELINES = [
  {
    name: "Calculator",
    providers: ["add", "subtract", "multiply", "divide"],
    color: "#00d4ff",
  },
  {
    name: "Multimodal RAG",
    providers: ["image-indexer", "video-indexer", "gemini-verifier"],
    color: "#a78bfa",
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
          <p className="text-xs font-mono mb-3" style={{ color: "#00d4ff" }}>
            how it works
          </p>
          <h2 className="text-3xl font-bold mb-4">
            From request to settlement
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            The same five-step payment routing layer runs under every pipeline.
            The demos are different. The infrastructure is identical.
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
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
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

        {/* Pipeline comparison */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-xl p-6"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <p className="text-xs font-mono mb-2" style={{ color: "#00d4ff" }}>
                any pipeline, same routing layer
              </p>
              <h3 className="text-base font-semibold mb-2">
                Swap the operators, keep the payment rails
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                ArcSplit is the routing layer, not the pipeline. Each operator or
                service registers a wallet. The router quotes, escrows, executes,
                and splits — regardless of what the pipeline does.
              </p>
            </div>
            <div className="flex-shrink-0 space-y-3">
              {PIPELINES.map((p) => (
                <div key={p.name}>
                  <p className="text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {p.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.providers.map((prov) => (
                      <span
                        key={prov}
                        className="px-2 py-1 rounded-lg text-xs font-mono"
                        style={{
                          background: `${p.color}10`,
                          color: p.color,
                          border: `1px solid ${p.color}25`,
                        }}
                      >
                        {prov}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
