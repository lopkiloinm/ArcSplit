"use client";

import { motion, AnimatePresence } from "framer-motion";

const NODES = [
  { id: "image",    label: "Food Image",      icon: "🖼",  color: "#a78bfa", x: 80,  y: 60 },
  { id: "video",    label: "Eating Video",    icon: "🎬",  color: "#fbbf24", x: 80,  y: 180 },
  { id: "embed-img",label: "Embed Image",     icon: "⊕",  color: "#a78bfa", x: 260, y: 60 },
  { id: "embed-vid",label: "Embed Video",     icon: "⊕",  color: "#fbbf24", x: 260, y: 180 },
  { id: "vector",   label: "Vector DB",       icon: "🗄",  color: "var(--accent)", x: 420, y: 120 },
  { id: "gemini",   label: "Gemini RAG",      icon: "✦",  color: "#34d399", x: 580, y: 120 },
  { id: "verdict",  label: "Verdict",         icon: "⚖",  color: "#34d399", x: 720, y: 120 },
];

const EDGES = [
  { from: "image",     to: "embed-img", step: "indexing-image" },
  { from: "video",     to: "embed-vid", step: "indexing-video" },
  { from: "embed-img", to: "vector",    step: "indexing-image" },
  { from: "embed-vid", to: "vector",    step: "indexing-video" },
  { from: "vector",    to: "gemini",    step: "verifying" },
  { from: "gemini",    to: "verdict",   step: "verifying" },
];

function nodePos(id: string) {
  return NODES.find((n) => n.id === id) ?? NODES[0];
}

interface FoodPipelineGraphProps {
  activeStep: string | null;
  completedSteps: Set<string>;
  animating: boolean;
  pipelineSteps?: Array<{ step: string; status: string; durationMs: number }>;
}

export function FoodPipelineGraph({ activeStep, completedSteps, animating, pipelineSteps }: FoodPipelineGraphProps) {
  const W = 800;
  const H = 260;

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          pipeline graph
        </span>
        <div className="flex items-center gap-3">
          {[
            { label: "image", color: "#a78bfa" },
            { label: "video", color: "#fbbf24" },
            { label: "gemini", color: "#34d399" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={W} height={H} style={{ display: "block", minWidth: "100%" }}>
          {/* Edges */}
          {EDGES.map((edge) => {
            const from = nodePos(edge.from);
            const to = nodePos(edge.to);
            const isActive = activeStep === edge.step;
            const isDone = completedSteps.has(edge.step);
            const color = isDone ? "#34d399" : isActive ? "var(--accent)" : "rgba(255,255,255,0.08)";

            return (
              <g key={`${edge.from}-${edge.to}`}>
                <motion.line
                  x1={from.x + 28} y1={from.y + 20}
                  x2={to.x - 28} y2={to.y + 20}
                  stroke={color} strokeWidth={isDone ? 2 : 1.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
                {/* Animated particle */}
                {isActive && animating && (
                  <motion.circle r={4} fill="var(--accent)"
                    initial={{ cx: from.x + 28, cy: from.y + 20, opacity: 0 }}
                    animate={{ cx: to.x - 28, cy: to.y + 20, opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const stepMap: Record<string, string> = {
              "embed-img": "indexing-image",
              "embed-vid": "indexing-video",
              "vector": "indexing-video",
              "gemini": "verifying",
              "verdict": "verifying",
            };
            const step = stepMap[node.id];
            const isActive = step ? activeStep === step : false;
            const isDone = step ? completedSteps.has(step) : false;
            const isSource = node.id === "image" || node.id === "video";

            return (
              <motion.g key={node.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}>
                <rect
                  x={node.x - 28} y={node.y}
                  width={56} height={40} rx={8}
                  fill={isDone ? `${node.color}20` : isActive ? `${node.color}18` : "rgba(255,255,255,0.04)"}
                  stroke={isDone ? node.color : isActive ? node.color : "rgba(255,255,255,0.1)"}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text x={node.x} y={node.y + 16} textAnchor="middle" fontSize={14}>{node.icon}</text>
                <text x={node.x} y={node.y + 54} textAnchor="middle" fontSize={9}
                  fill={isDone ? node.color : isActive ? node.color : "rgba(255,255,255,0.4)"}>
                  {node.label}
                </text>
                {/* Active pulse */}
                {isActive && (
                  <motion.rect
                    x={node.x - 28} y={node.y} width={56} height={40} rx={8}
                    fill="none" stroke={node.color} strokeWidth={2}
                    animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ transformOrigin: `${node.x}px ${node.y + 20}px` }}
                  />
                )}
                {/* Done checkmark */}
                {isDone && !isActive && (
                  <motion.circle cx={node.x + 22} cy={node.y - 4} r={7}
                    fill={node.color} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  </motion.circle>
                )}
                {isDone && !isActive && (
                  <motion.text x={node.x + 22} y={node.y} textAnchor="middle" fontSize={8} fill="#000"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>✓</motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Step trace */}
      <AnimatePresence>
        {pipelineSteps && pipelineSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="border-t overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="px-4 py-3 space-y-1">
              <p className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>pipeline trace</p>
              {pipelineSteps.map((s, i) => (
                <motion.div key={s.step}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 text-xs font-mono py-1">
                  <span style={{ color: "var(--text-muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="w-5 h-5 rounded flex items-center justify-center text-xs"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>✓</span>
                  <span style={{ color: "var(--text-secondary)" }}>{s.step}</span>
                  <span className="ml-auto" style={{ color: "var(--text-muted)" }}>{s.durationMs}ms</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
