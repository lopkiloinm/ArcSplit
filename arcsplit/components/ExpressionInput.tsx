"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_EXPRESSIONS = [
  { label: "Nested parens", expr: "((3+5)*2-4)/7" },
  { label: "Deep nesting", expr: "((2+3)*(4-1))/((6/2)+1)" },
  { label: "Mixed ops", expr: "(10-3)*4+(8/2)" },
  { label: "Simple chain", expr: "1+2*3-4/2" },
];

interface ExpressionInputProps {
  value: string;
  onChange: (v: string) => void;
  onQuote: () => void;
  onExecute: () => void;
  isQuoting: boolean;
  isExecuting: boolean;
  hasQuote: boolean;
  error?: string | null;
}

export function ExpressionInput({
  value,
  onChange,
  onQuote,
  onExecute,
  isQuoting,
  isExecuting,
  hasQuote,
  error,
}: ExpressionInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative">
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 0 2px rgba(0, 212, 255, 0.44)"
              : "0 0 0 1px rgba(255,255,255,0.07)",
          }}
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-raised)" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              expression
            </span>
            <div className="flex-1" />
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {value.length} chars
            </span>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onQuote();
            }}
            placeholder="((3+5)*2-4)/7"
            className="w-full px-4 py-4 text-xl font-mono bg-transparent outline-none placeholder:opacity-20"
            style={{ color: "var(--text-primary)" }}
            spellCheck={false}
            autoComplete="off"
          />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-xs font-mono px-1"
              style={{ color: "var(--op-subtract)" }}
            >
              ✗ {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Sample expressions */}
      <div className="flex flex-wrap gap-2">
        <span
          className="text-xs self-center mr-1"
          style={{ color: "var(--text-muted)" }}
        >
          Try:
        </span>
        {SAMPLE_EXPRESSIONS.map((s) => (
          <button
            key={s.expr}
            onClick={() => {
              onChange(s.expr);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0, 212, 255, 0.34)";
              (e.currentTarget as HTMLButtonElement).style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-secondary)";
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onQuote}
          disabled={isQuoting || !value.trim()}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-mid)",
            color: "var(--text-secondary)",
          }}
        >
          {isQuoting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Parsing…
            </span>
          ) : (
            "Quote workflow"
          )}
        </button>

        <button
          onClick={onExecute}
          disabled={isExecuting || !value.trim()}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: hasQuote ? "#00d4ff" : "var(--bg-raised)",
            border: hasQuote
              ? "none"
              : "1px solid var(--border-mid)",
            color: hasQuote ? "#000" : "var(--text-secondary)",
            boxShadow: hasQuote ? "0 0 20px rgba(0, 212, 255, 0.38)" : "none",
          }}
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner dark={hasQuote} /> Executing…
            </span>
          ) : (
            "Execute & settle →"
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <svg
      className="animate-spin w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke={dark ? "#000" : "currentColor"}
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
