"use client";

import { motion } from "framer-motion";

interface HeroSectionProps {
  onRunDemo: () => void;
}

export function HeroSection({ onRunDemo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.54) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.54) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 212, 255, 0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-8"
          style={{
            background: "rgba(0, 212, 255, 0.12)",
            border: "1px solid rgba(0, 212, 255, 0.24)",
            color: "#00d4ff",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
          x402 · Circle Nanopayments · ERC-8183
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-7xl md:text-8xl font-bold tracking-tight mb-4"
        >
          <span className="gradient-text">Arc</span>
          <span style={{ color: "var(--text-primary)" }}>Split</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl md:text-3xl font-light mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          One payment in.{" "}
          <span style={{ color: "var(--text-primary)" }}>
            Every component paid out.
          </span>
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          ArcSplit is the payment routing layer for composable pipelines on Arc.
          A buyer pays once. The payment is quoted, authorized, escrowed, and
          split across every provider that ran — automatically, on-chain.
          Two live demos: a calculator and a media verifier.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={onRunDemo}
            className="px-8 py-3.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer"
            style={{
              background: "#00d4ff",
              color: "#000",
              boxShadow: "0 0 30px rgba(0, 212, 255, 0.34)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 0 50px rgba(0, 212, 255, 0.54)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 0 30px rgba(0, 212, 255, 0.34)";
            }}
          >
            Run the demo →
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 rounded-lg font-medium text-sm transition-all duration-200"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-mid)",
              color: "var(--text-secondary)",
            }}
          >
            How it works
          </a>
        </motion.div>

        {/* Protocol badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex flex-wrap justify-center gap-6"
        >
          {[
            { label: "HTTP 402", sub: "x402 Protocol", color: "#00d4ff" },
            {
              label: "EIP-3009",
              sub: "Circle Nanopayments",
              color: "#a78bfa",
            },
            { label: "ERC-8183", sub: "Job Escrow", color: "#34d399" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: badge.color }}
              >
                {badge.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {badge.sub}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: "var(--text-muted)" }}
      >
        <span className="text-xs font-mono">scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, var(--text-muted), transparent)" }}
        />
      </motion.div>
    </section>
  );
}
