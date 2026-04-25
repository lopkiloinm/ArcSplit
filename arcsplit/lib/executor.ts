// ─── Expression Executor ──────────────────────────────────────────────────────
// Evaluates an AST via postorder traversal, emitting an execution trace
// that the frontend uses to animate step-by-step execution.

import { ASTNode, BinaryNode, ExecutionStep, OperatorType, Payout } from "./types";
import { OPERATOR_OWNERS, UNIT_PRICE_USDC } from "./types";

interface ExecutionResult {
  value: number;
  trace: ExecutionStep[];
  payouts: Payout[];
}

let stepCounter = 0;

function resetStepCounter() {
  stepCounter = 0;
}

function applyOperator(op: OperatorType, left: number, right: number): number {
  switch (op) {
    case "add":      return left + right;
    case "subtract": return left - right;
    case "multiply": return left * right;
    case "divide":
      if (right === 0) throw new Error("Division by zero");
      return left / right;
  }
}

function evaluateNode(
  node: ASTNode,
  trace: ExecutionStep[],
  payoutMap: Map<OperatorType, number>
): number {
  if (node.type === "literal") {
    return node.value;
  }

  // Postorder: evaluate children first
  const leftVal  = evaluateNode(node.left,  trace, payoutMap);
  const rightVal = evaluateNode(node.right, trace, payoutMap);
  const output   = applyOperator(node.operator, leftVal, rightVal);

  const step: ExecutionStep = {
    step: ++stepCounter,
    nodeId: node.id,
    operator: node.operator,
    inputs: [leftVal, rightVal],
    output,
    costUSDC: UNIT_PRICE_USDC,
    payoutTo: OPERATOR_OWNERS[node.operator],
  };

  trace.push(step);

  // Accumulate payout per operator type
  payoutMap.set(
    node.operator,
    (payoutMap.get(node.operator) ?? 0) + parseFloat(UNIT_PRICE_USDC)
  );

  return output;
}

export function executeAST(ast: ASTNode): ExecutionResult {
  resetStepCounter();
  const trace: ExecutionStep[] = [];
  const payoutMap = new Map<OperatorType, number>();

  const value = evaluateNode(ast, trace, payoutMap);

  // Build payout list (only operators that were actually used)
  const payouts: Payout[] = [];
  for (const [operator, total] of payoutMap.entries()) {
    payouts.push({
      operator,
      owner: OPERATOR_OWNERS[operator],
      // Format to 6 decimal places (USDC precision)
      amount: total.toFixed(6),
    });
  }

  return { value, trace, payouts };
}

// Compute total cost from trace
export function computeTotalCost(trace: ExecutionStep[]): string {
  const total = trace.length * parseFloat(UNIT_PRICE_USDC);
  return total.toFixed(6);
}
