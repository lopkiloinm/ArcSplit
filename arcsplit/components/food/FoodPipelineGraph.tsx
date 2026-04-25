"use client";

import { useMemo } from "react";
import { AstGraph } from "@/components/AstGraph";
import type { ASTNode, ExecutionStep } from "@/lib/types";

interface FoodPipelineGraphProps {
  activeStep: string | null;
  completedSteps: Set<string>;
  animating: boolean;
  pipelineSteps?: Array<{ step: string; status: string; durationMs: number }>;
}

const MEDIA_AST: ASTNode = {
  id: "gemini",
  type: "binary",
  operator: "multiply",
  depth: 0,
  left: {
    id: "img-emb",
    type: "binary",
    operator: "add",
    depth: 1,
    left: { id: "image", type: "literal", value: 1 },
    right: { id: "image-meta", type: "literal", value: 2 },
  },
  right: {
    id: "vid-emb",
    type: "binary",
    operator: "subtract",
    depth: 1,
    left: { id: "video", type: "literal", value: 3 },
    right: { id: "video-meta", type: "literal", value: 1 },
  },
};

function nodeIdForStep(step: string): string | null {
  if (step === "indexing-image" || step === "index-image") return "img-emb";
  if (step === "indexing-video" || step === "index-video") return "vid-emb";
  if (step === "verifying" || step === "gemini-verify") return "gemini";
  return null;
}

function toOperator(step: string): "add" | "subtract" | "multiply" {
  if (step === "indexing-image" || step === "index-image") return "add";
  if (step === "indexing-video" || step === "index-video") return "subtract";
  return "multiply";
}

function toInputs(step: string): [number, number] {
  if (step === "indexing-image" || step === "index-image") return [1, 2];
  if (step === "indexing-video" || step === "index-video") return [3, 1];
  return [3, 4];
}

export function FoodPipelineGraph({
  activeStep,
  completedSteps,
  animating,
  pipelineSteps,
}: FoodPipelineGraphProps) {
  const activeNodeId = activeStep ? nodeIdForStep(activeStep) : null;

  const completedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const step of completedSteps) {
      const id = nodeIdForStep(step);
      if (id) ids.add(id);
    }
    return ids;
  }, [completedSteps]);

  const executionTrace: ExecutionStep[] = useMemo(() => {
    if (!pipelineSteps || pipelineSteps.length === 0) return [];

    return pipelineSteps
      .map((s, i) => {
        const nodeId = nodeIdForStep(s.step);
        if (!nodeId) return null;

        const operator = toOperator(s.step);
        const inputs = toInputs(s.step);
        const output =
          operator === "add"
            ? inputs[0] + inputs[1]
            : operator === "subtract"
              ? inputs[0] - inputs[1]
              : inputs[0] * inputs[1];

        return {
          step: i + 1,
          nodeId,
          operator,
          inputs,
          output,
          costUSDC: "0.000000",
          payoutTo: "media_pipeline",
        } as ExecutionStep;
      })
      .filter((x): x is ExecutionStep => x !== null);
  }, [pipelineSteps]);

  return (
    <AstGraph
      ast={MEDIA_AST}
      activeNodeId={activeNodeId}
      completedNodeIds={completedNodeIds}
      executionTrace={executionTrace}
      animating={animating}
    />
  );
}
