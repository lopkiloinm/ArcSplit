"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";

const PIPELINES = [
  {
    href: "/pipelines/calculator",
    name: "Calculator pipeline",
    tagline: "Parse an expression into an AST. Pay per operator. Settle to each provider.",
    badges: ["x402 · HTTP 402", "ERC-8183 escrow", "Circle Nanopayments"],
    color: "#00d4ff",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h8M8 14h4" />
      </svg>
    ),
    steps: [
      "Enter expression like ((3+5)*2-4)/7",
      "Parser builds AST, counts operators",
      "HTTP 402 → sign EIP-712 authorization",
      "Execute → split payment to each operator",
    ],
    surfaceTint: "rgba(0, 212, 255, 0.12)",
    border: "rgba(0, 212, 255, 0.24)",
  },
  {
    href: "/pipelines/food-verify",
    name: "Media pipeline · Gemini Embedding 2",
    tagline: "Upload an image and a video. Gemini Embedding 2 powers indexing before RAG verification and split settlement.",
    badges: ["x402 · HTTP 402", "ERC-8183 escrow", "Circle Nanopayments"],
    color: "#a78bfa",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    steps: [
      "Upload an image and a short video clip",
      "Gemini Embedding 2 indexers embed both into a shared vector space",
      "HTTP 402 → sign EIP-712 authorization",
      "RAG verifier runs → split payment to 3 providers",
    ],
    surfaceTint: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.2)",
  },
];

export default function Home() {
  function scrollToPipelines() {
    document.getElementById("pipelines")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen">
      <HeroSection onRunDemo={scrollToPipelines} />
      <HowItWorksSection />

      {/* ── Pipeline cards ────────────────────────────────────────────────── */}
      <section id="pipelines" className="py-20 px-6"
        style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="mb-12 text-center">
            <p className="text-xs font-mono mb-3" style={{ color: "#00d4ff" }}>
              live on Arc testnet
            </p>
            <h2 className="text-3xl font-bold mb-3">Two working pipelines</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Each pipeline is a real payment graph — its own contributors, its own
              execution flow, its own ERC-8183 escrow lifecycle, and a settlement
              receipt showing exactly who got paid and how much.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {PIPELINES.map((p, i) => (
              <motion.div key={p.href}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={p.href} className="block group">
                  <div className="rounded-2xl overflow-hidden transition-all duration-300 h-full"
                    style={{
                      background: "var(--bg-panel)",
                      border: `1px solid ${p.border}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${p.color}18`;
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${p.color}50`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLDivElement).style.borderColor = p.border;
                    }}
                  >
                    {/* Card header */}
                    <div className="p-6 pb-4" style={{ background: p.surfaceTint }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}>
                          {p.icon}
                        </div>
                        <span className="text-xs font-mono px-2 py-1 rounded-lg transition-all"
                          style={{ background: `${p.color}15`, color: p.color }}>
                          Open →
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{p.name}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {p.tagline}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="px-6 py-3 flex flex-wrap gap-2 border-t border-b"
                      style={{ borderColor: "var(--border)" }}>
                      {p.badges.map((b) => (
                        <span key={b} className="text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{ background: `${p.color}10`, color: p.color, border: `1px solid ${p.color}25` }}>
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Steps */}
                    <div className="p-6 space-y-2">
                      {p.steps.map((step, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5"
                            style={{ background: `${p.color}15`, color: p.color }}>
                            {j + 1}
                          </span>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Shared infrastructure note */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="mt-8 rounded-xl p-5"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-mono mb-3" style={{ color: "var(--text-muted)" }}>
              shared infrastructure
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Payment", value: "x402 HTTP 402", color: "#fbbf24" },
                { label: "Signing",  value: "EIP-712 offchain", color: "#00d4ff" },
                { label: "Escrow",   value: "ERC-8183 jobs",    color: "#a78bfa" },
                { label: "Settlement", value: "Circle Gateway", color: "#34d399" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-mono mb-0.5" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                  <p className="text-xs font-medium" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 text-center" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="text-sm font-bold gradient-text">ArcSplit</p>
        <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Ownership infrastructure for community-made AI and creative workflows.
          Every use routes value back to the people who built the pieces.
        </p>
        <div className="flex justify-center flex-wrap gap-6 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {[
            { label: "x402 docs", href: "https://docs.cdp.coinbase.com/x402/core-concepts/http-402" },
            { label: "Circle Nanopayments", href: "https://developers.circle.com/gateway/nanopayments" },
            { label: "ERC-8183", href: "https://eips.ethereum.org/EIPS/eip-8183" },
            { label: "gemini-embedding-2", href: "https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings" },
          ].map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
              className="hover:text-[#00d4ff] transition-colors">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
