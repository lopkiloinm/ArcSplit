"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ─── Layout constants — mirrors AstGraph ─────────────────────────────────────

const NODE_W = 52;
const NODE_H = 52;

// ─── Node definitions ─────────────────────────────────────────────────────────

interface PipelineNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  x: number;
  y: number;
  shape: "circle" | "rounded";
}

interface PipelineEdge {
  id: string;
  fromId: string;
  toId: string;
  step: string;
}

const NODES: PipelineNode[] = [
  { id: "image",    label: "Image",    sublabel: "input",           color: "#a78bfa", x: 80,  y: 80,  shape: "circle" },
  { id: "video",    label: "Video",    sublabel: "input",           color: "#fbbf24", x: 80,  y: 200, shape: "circle" },
  { id: "img-emb",  label: "embed",    sublabel: "image-indexer",   color: "#a78bfa", x: 240, y: 80,  shape: "rounded" },
  { id: "vid-emb",  label: "embed",    sublabel: "video-indexer",   color: "#fbbf24", x: 240, y: 200, shape: "rounded" },
  { id: "vector",   label: "vector",   sublabel: "store",           color: "#00d4ff", x: 400, y: 140, shape: "rounded" },
  { id: "gemini",   label: "RAG",      sublabel: "gemini-verifier", color: "#34d399", x: 560, y: 140, shape: "rounded" },
  { id: "verdict",  label: "verdict",  sublabel: "output",          color: "#34d399", x: 700, y: 140, shape: "circle" },
];

const EDGES: PipelineEdge[] = [
  { id: "img-to-emb",  fromId: "image",   toId: "img-emb",  step: "indexing-image" },
  { id: "vid-to-emb",  fromId: "video",   toId: "vid-emb",  step: "indexing-video" },
  { id: "emb-to-vec1", fromId: "img-emb", toId: "vector",   step: "indexing-image" },
  { id: "emb-to-vec2", fromId: "vid-emb", toId: "vector",   step: "indexing-video" },
  { id: "vec-to-gem",  fromId: "vector",  toId: "gemini",   step: "verifying" },
  { id: "gem-to-ver",  fromId: "gemini",  toId: "verdict",  step: "verifying" },
];

// Step → which node IDs are "active" during that step
const STEP_ACTIVE_NODES: Record<string, string[]> = {
  "indexing-image": ["img-emb"],
  "indexing-video": ["vid-emb"],
  "verifying":      ["gemini"],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface FoodPipelineGraphProps {
  activeStep: string | null;
  completedSteps: Set<string>;
  animating: boolean;
  pipelineSteps?: Array<{ step: string; status: string; durationMs: number }>;
}

export function FoodPipelineGraph({
  activeStep, completedSteps, animating, pipelineSteps,
}: FoodPipelineGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(760);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const svgWidth = Math.max(760, containerWidth);
  const svgHeight = 280;

  function getNode(id: string) {
    return NODES.find((n) => n.id === id)!;
  }

  function isNodeActive(node: PipelineNode) {
    if (!activeStep) return false;
    return (STEP_ACTIVE_NODES[activeStep] ?? []).includes(node.id);
  }

  function isNodeDone(node: PipelineNode) {
    // Source nodes (image/video) are always "done" once files are present
    if (node.id === "image" || node.id === "video") return true;
    // Operator nodes done when their step is completed
    for (const [step, nodes] of Object.entries(STEP_ACTIVE_NODES)) {
      if (nodes.includes(node.id) && completedSteps.has(step)) return true;
    }
    // vector done when both indexing steps done
    if (node.id === "vector") return completedSteps.has("indexing-image") && completedSteps.has("indexing-video");
    // verdict done when verifying done
    if (node.id === "verdict") return completedSteps.has("verifying");
    return false;
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      {/* Header — identical to AstGraph */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          pipeline graph
        </span>
        <div className="flex items-center gap-3">
          {[
            { label: "image-indexer",   color: "#a78bfa" },
            { label: "video-indexer",   color: "#fbbf24" },
            { label: "gemini-verifier", color: "#34d399" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} style={{ display: "block", minWidth: "100%" }}>
          {/* Edges with cubic Bezier paths — mirrors AstGraph */}
          {EDGES.map((edge) => {
            const from = getNode(edge.fromId);
            const to = getNode(edge.toId);
            const isActive = activeStep === edge.step;
            const isDone = completedSteps.has(edge.step);

            const x1 = from.x + NODE_W / 2;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x - NODE_W / 2;
            const y2 = to.y + NODE_H / 2;
            const cp1x = x1 + (x2 - x1) * 0.4;
            const cp1y = y1;
            const cp2x = x2 - (x2 - x1) * 0.4;
            const cp2y = y2;
            const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

            return (
              <g key={edge.id}>
                <motion.path
                  d={d} fill="none"
                  stroke={isDone ? "#34d399" : isActive ? "#00d4ff" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isDone ? 2 : 1.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
                />
                {/* Particle along edge — mirrors AstGraph */}
                {isActive && animating && !shouldReduceMotion && (
                  <motion.circle
                    r={3} fill="#00d4ff" opacity={0.8}
                    initial={{ offsetDistance: "0%", opacity: 0 }}
                    animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.0, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
                    style={{ offsetPath: `path("${d}")` } as React.CSSProperties}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes — same style as AstGraph nodes */}
          {NODES.map((node) => {
            const active = isNodeActive(node);
            const done = isNodeDone(node);
            const isLiteral = node.shape === "circle";
            const color = node.color;

            return (
              <motion.g key={node.id}>
                {/* Node body */}
                <motion.rect
                  x={node.x - NODE_W / 2} y={node.y - NODE_H / 2}
                  width={NODE_W} height={NODE_H}
                  rx={isLiteral ? NODE_W / 2 : 12}
                  fill={isLiteral ? "rgba(255,255,255,0.04)" : `${color}15`}
                  stroke={isLiteral ? "rgba(255,255,255,0.12)" : `${color}50`}
                  strokeWidth={active ? 2 : 1.5}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: active ? 1.15 : 1,
                    boxShadow: active ? `0 0 0 2px ${color}, 0 0 20px ${color}60` : "none",
                  }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3, scale: { type: "spring", stiffness: 300, damping: 20 } }}
                />

                {/* Label */}
                <text
                  x={node.x} y={node.y - 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fontWeight={600} fontFamily="var(--font-mono)"
                  fill={isLiteral ? "var(--text-secondary)" : color}
                >
                  {node.label}
                </text>
                <text
                  x={node.x} y={node.y + 10}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fontFamily="var(--font-mono)"
                  fill={isLiteral ? "rgba(255,255,255,0.25)" : `${color}90`}
                >
                  {node.sublabel}
                </text>

                {/* Active pulse ring — mirrors AstGraph */}
                {active && !shouldReduceMotion && (
                  <motion.rect
                    x={node.x - NODE_W / 2} y={node.y - NODE_H / 2}
                    width={NODE_W} height={NODE_H}
                    rx={isLiteral ? NODE_W / 2 : 12}
                    fill="none" stroke={color} strokeWidth={2}
                    animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  />
                )}

                {/* Done checkmark — mirrors AstGraph */}
                {done && !active && (
                  <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ transformOrigin: `${node.x + NODE_W / 2 - 6}px ${node.y - NODE_H / 2 + 6}px` }}>
                    <circle cx={node.x + NODE_W / 2 - 6} cy={node.y - NODE_H / 2 + 6} r={7} fill={color} />
                    <text
                      x={node.x + NODE_W / 2 - 6} y={node.y - NODE_H / 2 + 6}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={8} fill="#000" fontWeight={700}
                    >✓</text>
                  </motion.g>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Execution trace — identical structure to AstGraph trace section */}
      <AnimatePresence>
        {pipelineSteps && pipelineSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t overflow-hidden" style={{ borderColor: "var(--border)" }}
          >
            <div className="px-4 py-3 space-y-1">
              <p className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>
                execution trace
              </p>
              {pipelineSteps.map((s, i) => {
                const serviceColor: Record<string, string> = {
                  "index-image":   "#a78bfa",
                  "index-video":   "#fbbf24",
                  "gemini-verify": "#34d399",
                };
                const color = serviceColor[s.step] ?? "#00d4ff";
                const symbol: Record<string, string> = {
                  "index-image":   "⊕",
                  "index-video":   "⊕",
                  "gemini-verify": "✦",
                };
                return (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 text-xs font-mono py-1"
                  >
                    <span style={{ color: "var(--text-muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: `${color}18`, color }}
                    >
                      {symbol[s.step] ?? "·"}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{s.step}</span>
                    <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
                      {s.durationMs}ms
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
