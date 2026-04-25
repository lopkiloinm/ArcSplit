import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArcSplit — Pipelines",
};

export default function PipelinesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 px-6 py-3 flex items-center gap-4"
        style={{
          background: "rgba(10,10,15,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70"
        >
          <span className="gradient-text">Arc</span>
          <span style={{ color: "var(--text-primary)" }}>Split</span>
        </Link>

        <span style={{ color: "var(--border-mid)" }}>/</span>

        {/* Pipeline links — both badges use the same muted style, no tint */}
        <div className="flex items-center gap-1">
          <NavLink
            href="/pipelines/calculator"
            label="Calculator"
            badge="x402 · ERC-8183"
          />
          <NavLink
            href="/pipelines/food-verify"
            label="Media pipeline"
            badge="Gemini Embedding 2"
          />
        </div>

        <div className="flex-1" />

        <Link
          href="/"
          className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          ← home
        </Link>
      </nav>

      {/* Main content */}
      <main style={{ borderTop: "1px solid var(--border)" }}>
        {children}
      </main>
    </>
  );
}

function NavLink({ href, label, badge }: { href: string; label: string; badge: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
      style={{ color: "var(--text-secondary)" }}
    >
      {label}
      {/* Badge: no background tint — just a subtle border so both look identical */}
      <span
        className="px-1.5 py-0.5 rounded text-xs font-mono"
        style={{
          border: "1px solid var(--border-mid)",
          color: "var(--text-muted)",
          fontSize: 10,
        }}
      >
        {badge}
      </span>
    </Link>
  );
}
