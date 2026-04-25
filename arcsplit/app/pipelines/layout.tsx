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
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70"
        >
          <span className="gradient-text">Arc</span>
          <span style={{ color: "var(--text-primary)" }}>Split</span>
        </Link>

        <span style={{ color: "var(--border-mid)" }}>/</span>

        <div className="flex items-center gap-1">
          <NavLink href="/pipelines/calculator" label="Calculator" badge="x402 · ERC-8183" color="var(--accent)" />
          <NavLink href="/pipelines/food-verify" label="Media pipeline" badge="x402 · ERC-8183" color="#a78bfa" />
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

      {/* Main content — top border separates from nav */}
      <main style={{ borderTop: "1px solid var(--border)" }}>
        {children}
      </main>
    </>
  );
}

function NavLink({
  href,
  label,
  badge,
  color,
}: {
  href: string;
  label: string;
  badge: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{ color: "var(--text-secondary)" }}
    >
      {label}
      <span
        className="px-1.5 py-0.5 rounded text-xs font-mono"
        style={{ background: `${color}12`, color, fontSize: 10 }}
      >
        {badge}
      </span>
    </Link>
  );
}
