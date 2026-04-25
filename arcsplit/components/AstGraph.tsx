"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ASTNode, BinaryNode, LiteralNode, ExecutionStep } from "@/lib/types";

// ─── Layout ───────────────────────────────────────────────────────────────────

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  node: ASTNode;
  depth: number;
}

interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const NODE_W = 52;
const NODE_H = 52;
const LEVEL_H = 90;
const H_GAP = 16;

// Compute subtree width
function subtreeWidth(node: ASTNode): number {
  if (node.type === "literal") return NODE_W;
  const lw = subtreeWidth(node.left);
  const rw = subtreeWidth(node.right);
  return lw + rw + H_GAP;
}

// Assign x/y positions via recursive layout
function layoutTree(
  node: ASTNode,
  x: number,
  y: number,
  depth: number,
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): void {
  nodes.push({ id: node.id, x, y, node, depth });

  if (node.type === "binary") {
    const lw = subtreeWidth(node.left);
    const rw = subtreeWidth(node.right);
    const totalW = lw + rw + H_GAP;

    const leftCenterX = x - totalW / 2 + lw / 2;
    const rightCenterX = x + totalW / 2 - rw / 2;
    const childY = y + LEVEL_H;

    edges.push({
      id: `${node.id}->${node.left.id}`,
      from: node.id,
      to: node.left.id,
      fromX: x,
      fromY: y + NODE_H / 2,
      toX: leftCenterX,
      toY: childY - NODE_H / 2,
    });

    edges.push({
      id: `${node.id}->${node.right.id}`,
      from: node.id,
      to: node.right.id,
      fromX: x,
      fromY: y + NODE_H / 2,
      toX: rightCenterX,
      toY: childY - NODE_H / 2,
    });

    layoutTree(node.left, leftCenterX, childY, depth + 1, nodes, edges);
    layoutTree(node.right, rightCenterX, childY, depth + 1, nodes, edges);
  }
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const OP_COLORS: Record<string, string> = {
  add: "#34d399",
  subtract: "#f87171",
  multiply: "#a78bfa",
  divide: "#fbbf24",
};

const OP_SYMBOLS: Record<string, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AstGraphProps {
  ast: ASTNode | null;
  activeNodeId?: string | null;
  completedNodeIds?: Set<string>;
  executionTrace?: ExecutionStep[];
  animating?: boolean;
}

export function AstGraph({
  ast,
  activeNodeId,
  completedNodeIds = new Set(),
  executionTrace = [],
  animating = false,
}: AstGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges, svgWidth, svgHeight } = useMemo(() => {
    if (!ast) return { nodes: [], edges: [], svgWidth: 0, svgHeight: 0 };

    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];

    const treeW = subtreeWidth(ast);
    const cx = Math.max(treeW / 2, containerWidth / 2);

    layoutTree(ast, cx, NODE_H / 2 + 16, 0, nodes, edges);

    const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W / 2 + 16;
    const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H / 2 + 16;

    return {
      nodes,
      edges,
      svgWidth: Math.max(maxX, containerWidth),
      svgHeight: maxY,
    };
  }, [ast, containerWidth]);

  if (!ast) {
    return (
      <div
        ref={containerRef}
        className="rounded-xl flex items-center justify-center"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          minHeight: 200,
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          AST will appear here after parsing.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-auto"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          ast / execution graph
        </span>
        <div className="flex items-center gap-3">
          {(["add", "subtract", "multiply", "divide"] as const).map((op) => (
            <div key={op} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: OP_COLORS[op] }}
              />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {op}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ display: "block", minWidth: "100%" }}
        >
          {/* Edges */}
          {edges.map((edge) => {
            const cp1x = edge.fromX;
            const cp1y = edge.fromY + (edge.toY - edge.fromY) * 0.4;
            const cp2x = edge.toX;
            const cp2y = edge.toY - (edge.toY - edge.fromY) * 0.4;
            const d = `M ${edge.fromX} ${edge.fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${edge.toX} ${edge.toY}`;

            return (
              <motion.path
                key={edge.id}
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.1 }}
              />
            );
          })}

          {/* Particle animations along edges during execution */}
          {animating && !shouldReduceMotion && edges.map((edge) => {
            const cp1x = edge.fromX;
            const cp1y = edge.fromY + (edge.toY - edge.fromY) * 0.4;
            const cp2x = edge.toX;
            const cp2y = edge.toY - (edge.toY - edge.fromY) * 0.4;
            const d = `M ${edge.fromX} ${edge.fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${edge.toX} ${edge.toY}`;

            return (
              <motion.circle
                key={`particle-${edge.id}`}
                r={3}
                fill="#00d4ff"
                opacity={0.7}
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  ease: "easeInOut",
                }}
                style={{
                  offsetPath: `path("${d}")`,
                } as React.CSSProperties}
              />
            );
          })}
        </svg>

        {/* Nodes rendered as HTML over SVG */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ width: svgWidth, height: svgHeight }}
        >
          {nodes.map(({ id, x, y, node }) => (
            <AstNodeView
              key={id}
              layoutX={x}
              layoutY={y}
              node={node}
              isActive={activeNodeId === id}
              isCompleted={completedNodeIds.has(id)}
              shouldReduceMotion={shouldReduceMotion ?? false}
            />
          ))}
        </div>
      </div>

      {/* Execution trace legend */}
      <AnimatePresence>
        {executionTrace.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="px-4 py-3 space-y-1">
              <p className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>
                execution trace
              </p>
              {executionTrace.map((step) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.step * 0.05 }}
                  className="flex items-center gap-3 text-xs font-mono py-1"
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `${OP_COLORS[step.operator]}18`,
                      color: OP_COLORS[step.operator],
                    }}
                  >
                    {OP_SYMBOLS[step.operator]}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {step.inputs[0]} {OP_SYMBOLS[step.operator]} {step.inputs[1]} ={" "}
                    <span style={{ color: "var(--text-primary)" }}>
                      {Number.isInteger(step.output)
                        ? step.output
                        : step.output.toFixed(6)}
                    </span>
                  </span>
                  <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
                    {step.costUSDC} USDC
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Individual Node ──────────────────────────────────────────────────────────

interface AstNodeViewProps {
  layoutX: number;
  layoutY: number;
  node: ASTNode;
  isActive: boolean;
  isCompleted: boolean;
  shouldReduceMotion: boolean;
}

function AstNodeView({
  layoutX,
  layoutY,
  node,
  isActive,
  isCompleted,
  shouldReduceMotion,
}: AstNodeViewProps) {
  const isBinary = node.type === "binary";
  const op = isBinary ? (node as BinaryNode).operator : null;
  const color = op ? OP_COLORS[op] : "rgba(255,255,255,0.4)";
  const symbol = op ? OP_SYMBOLS[op] : String((node as LiteralNode).value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: isActive ? 1.15 : 1,
        boxShadow: isActive
          ? `0 0 0 2px ${color}, 0 0 20px ${color}60`
          : isCompleted
          ? `0 0 0 1px ${color}60`
          : "none",
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        scale: { type: "spring", stiffness: 300, damping: 20 },
      }}
      style={{
        position: "absolute",
        left: layoutX - NODE_W / 2,
        top: layoutY - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        borderRadius: isBinary ? "12px" : "50%",
        background: isBinary
          ? `${color}15`
          : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${isBinary ? color + "50" : "rgba(255,255,255,0.12)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
      }}
    >
      <span
        className="font-mono font-bold text-sm select-none"
        style={{ color: isBinary ? color : "var(--text-secondary)" }}
      >
        {symbol}
      </span>

      {/* Pulse ring for active node */}
      {isActive && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ border: `2px solid ${color}`, borderRadius: "inherit" }}
        />
      )}

      {/* Completed checkmark */}
      {isCompleted && !isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: color, fontSize: 8 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}
