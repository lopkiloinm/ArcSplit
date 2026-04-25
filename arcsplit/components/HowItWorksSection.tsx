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
    body: "Post-complete hook distributes escrow to each contributor based on actual usage. One payment in. Many owners paid out.",
    tag: "IACPHook",
    color: "#f87171",
  },
];

const ECOSYSTEM_ITEMS = [
  { label: "LoRAs",        color: "#a78bfa", icon: "◈" },
  { label: "Workflows",    color: "#00d4ff", icon: "⬡" },
  { label: "Extensions",   color: "#34d399", icon: "⊕" },
  { label: "Assets",       color: "#fbbf24", icon: "◇" },
  { label: "Datasets",     color: "#f87171", icon: "▦" },
  { label: "Automations",  color: "#60a5fa", icon: "↻" },
  { label: "Models",       color: "#e879f9", icon: "⬟" },
  { label: "Tools",        color: "#4ade80", icon: "⚙" },
];

export function HowItWorksSection() {
  return (
    <>
      {/* ── Vision section ──────────────────────────────────────────────── */}
      <section
        id="vision"
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
              the problem
            </p>
            <h2 className="text-3xl font-bold mb-5">
              Workflows are composable.<br />
              <span style={{ color: "var(--text-secondary)" }}>Monetization is still centralized.</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The internet runs on community-made components — LoRAs, Blender extensions,
              open-source tools, shared datasets, creative packs. But most of the money
              still flows to the biggest platforms and model providers, not to the small
              creators whose pieces make workflows useful.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                title: "Platform-mediated payouts",
                body: "Patreon-style support proves people want to fund creators directly. But withdrawals are delayed, platform-dependent, and routed through intermediaries — not native to the work itself.",
                color: "#f87171",
                icon: "⊘",
              },
              {
                title: "Centralized value capture",
                body: "Marketplaces and model providers capture the upside from community contributions. The LoRA trainer, the extension author, the dataset curator — they get exposure, not ownership.",
                color: "#fbbf24",
                icon: "⊘",
              },
              {
                title: "Unpaid maintenance",
                body: "When community work earns nothing per use, there is no economic signal to maintain it. Useful tools go stale. Ecosystems fragment. The people who built the pieces move on.",
                color: "#f87171",
                icon: "⊘",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl p-5 space-y-3"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              >
                <span className="text-xl" style={{ color: item.color }}>{item.icon}</span>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              boxShadow: "0 0 60px rgba(0, 212, 255, 0.05)",
            }}
          >
            <p className="text-xs font-mono mb-3" style={{ color: "#00d4ff" }}>
              the solution
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              ArcSplit turns a workflow into a payment graph.
            </h2>
            <p className="text-base max-w-2xl mx-auto leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              One payment comes in. Every contributor — workflow author, LoRA trainer,
              extension maker, asset creator, tool builder — gets paid automatically
              and peer to peer based on actual usage.
            </p>
            <p className="text-sm font-medium max-w-xl mx-auto" style={{ color: "var(--text-primary)" }}>
              Ownership travels with the component. The people who make useful pieces
              keep economic ownership of those pieces wherever they are reused.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Ecosystem section ────────────────────────────────────────────── */}
      <section
        className="py-20 px-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-xs font-mono mb-3" style={{ color: "#a78bfa" }}>
              every building block
            </p>
            <h2 className="text-3xl font-bold mb-4">
              From LoRAs to workflows to assets,<br />
              <span style={{ color: "var(--text-secondary)" }}>value flows back to the people who made them.</span>
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Any reusable component can carry ownership metadata and earn on every use —
              whether it runs inside a Blender extension, an AI pipeline, a creative pack,
              or a community automation.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {ECOSYSTEM_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}28`,
                  color: item.color,
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </motion.div>
            ))}
          </div>

          {/* Incentive shift */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Better incentives",
                body: "When authors earn each time their work is used, they are encouraged to ship better workflows, maintain better assets, improve tooling, and contribute back to the ecosystem instead of treating community work as unpaid labor.",
                color: "#34d399",
                label: "outcome",
              },
              {
                title: "Healthier ecosystems",
                body: "Community support instead of corporate extraction. Grassroots growth instead of gatekept monetization. Reusable building blocks that can sustain their authors directly — the same shift Blender's extension ecosystem is pushing toward, but with native payment rails.",
                color: "#a78bfa",
                label: "outcome",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-6 space-y-3"
                style={{ background: "var(--bg-panel)", border: `1px solid ${item.color}25` }}
              >
                <p className="text-xs font-mono" style={{ color: item.color }}>{item.label}</p>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works section ─────────────────────────────────────────── */}
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
              the payment rail
            </p>
            <h2 className="text-3xl font-bold mb-4">
              From request to settlement
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              The same five-step routing layer runs under every pipeline.
              Gas-free USDC transfers as small as $0.000001 — powered by
              Circle's agentic economy infrastructure — make per-use compensation
              economically viable for the first time.
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

          {/* Not platform rent */}
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
                  not platform rent · shared upside
                </p>
                <h3 className="text-base font-semibold mb-2">
                  Swap the operators, keep the payment rails
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  ArcSplit is the routing layer, not the pipeline. Each operator or
                  contributor registers a wallet. The router quotes, escrows, executes,
                  and splits — regardless of what the pipeline does or who built the pieces.
                  No platform takes a cut. Value flows directly.
                </p>
              </div>
              <div className="flex-shrink-0 space-y-3">
                {[
                  {
                    name: "Calculator pipeline",
                    providers: ["add", "subtract", "multiply", "divide"],
                    color: "#00d4ff",
                  },
                  {
                    name: "Multimodal RAG",
                    providers: ["image-indexer", "video-indexer", "gemini-verifier"],
                    color: "#a78bfa",
                  },
                ].map((p) => (
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
    </>
  );
}
