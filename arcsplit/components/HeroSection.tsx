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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)",
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
            background: "rgba(0, 212, 255, 0.10)",
            border: "1px solid rgba(0, 212, 255, 0.22)",
            color: "#00d4ff",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
          ownership infrastructure · community-built · community-paid
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-7xl md:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="gradient-text">Arc</span>
          <span style={{ color: "var(--text-primary)" }}>Split</span>
        </motion.h1>

        {/* Primary headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl md:text-3xl font-light mb-5 leading-snug"
          style={{ color: "var(--text-secondary)" }}
        >
          Pay the people{" "}
          <span style={{ color: "var(--text-primary)" }}>
            behind the workflow.
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
          ArcSplit lets every community-made component in an AI or creative
          workflow — LoRAs, tools, assets, extensions, datasets, automations,
          and models — earn money directly when it is used. One payment in.
          Every contributor paid out, automatically and peer to peer.
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
            See it live →
          </button>
          <a
            href="#vision"
            className="px-8 py-3.5 rounded-lg font-medium text-sm transition-all duration-200"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-mid)",
              color: "var(--text-secondary)",
            }}
          >
            Why it matters
          </a>
        </motion.div>

        {/* Tagline trio */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex flex-wrap justify-center gap-8"
        >
          {[
            { label: "Community-built", sub: "open components, open workflows" },
            { label: "Community-owned", sub: "ownership travels with the piece" },
            { label: "Community-paid",  sub: "per-use, peer to peer, no platform cut" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="text-xs font-mono font-semibold" style={{ color: "#00d4ff" }}>
                {item.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {item.sub}
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
