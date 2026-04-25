// ─── Core Types for ArcSplit ─────────────────────────────────────────────────
// These types model the full lifecycle: AST → Quote → Job → Execution → Settlement

// ─── AST Types ───────────────────────────────────────────────────────────────

export type OperatorType = "add" | "subtract" | "multiply" | "divide";

export interface LiteralNode {
  id: string;
  type: "literal";
  value: number;
}

export interface BinaryNode {
  id: string;
  type: "binary";
  operator: OperatorType;
  left: ASTNode;
  right: ASTNode;
  // Depth in tree (root = 0)
  depth: number;
}

export type ASTNode = LiteralNode | BinaryNode;

// ─── Execution Trace ─────────────────────────────────────────────────────────

export interface ExecutionStep {
  step: number;
  nodeId: string;
  operator: OperatorType;
  inputs: [number, number];
  output: number;
  costUSDC: string;
  payoutTo: string;
}

// ─── Quote ───────────────────────────────────────────────────────────────────

export interface OperationCounts {
  add: number;
  subtract: number;
  multiply: number;
  divide: number;
}

export interface Quote {
  jobTemplate: string;
  expression: string;
  ast: ASTNode;
  operationCounts: OperationCounts;
  totalOperations: number;
  unitPriceUSDC: string;
  maxCostUSDC: string;
  operatorPricing: Record<OperatorType, string>;
}

// ─── Payment / Authorization ──────────────────────────────────────────────────

export interface PaymentAuthorization {
  type: "eip3009-demo";
  from: string;
  amount: string;
  nonce: string;
  signature: string;
}

// ─── ERC-8183 Job State Machine ───────────────────────────────────────────────
// States: Open → Funded → Submitted → Completed | Rejected | Expired

export type JobStatus =
  | "Open"
  | "Funded"
  | "Submitted"
  | "Completed"
  | "Rejected"
  | "Expired";

export interface EscrowTransition {
  from: JobStatus | null;
  to: JobStatus;
  timestamp: string;
  reason?: string;
}

// ─── Payout ───────────────────────────────────────────────────────────────────

export interface Payout {
  operator: OperatorType;
  owner: string;
  amount: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────
// Modeled after ERC-8183 job structure with escrow semantics

export interface Job {
  id: string;
  expression: string;
  status: JobStatus;
  // Roles (ERC-8183)
  client: string;
  provider: string;
  evaluator: string;
  // Budget (ERC-8183 escrow)
  budgetUSDC: string;
  fundedAmountUSDC: string;
  // Computation
  ast: ASTNode | null;
  operationCounts: OperationCounts | null;
  executionTrace: ExecutionStep[];
  payouts: Payout[];
  // Payment
  paymentAuthorization: PaymentAuthorization | null;
  // Lifecycle
  escrowTransitions: EscrowTransition[];
  createdAt: string;
  expiredAt: string;
  // Result
  result: number | null;
  chargedUSDC: string | null;
  // Receipt
  receipt: Receipt | null;
}

export interface Receipt {
  paymentAuthorizationId: string;
  gatewayBatchId: string;
  escrowStateTransitions: JobStatus[];
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface X402PaymentRequired {
  error: "payment_required";
  x402: {
    scheme: "exact";
    network: "arc";
    asset: "USDC";
    amount: string;
    payTo: string;
    jobId: string;
    resource: string;
  };
}

export interface CalcSuccessResponse {
  jobId: string;
  status: "Completed";
  result: number;
  expression: string;
  operationCounts: OperationCounts;
  chargedUSDC: string;
  payouts: Payout[];
  receipt: Receipt;
  executionTrace: ExecutionStep[];
}

// ─── Operator Owner Registry ──────────────────────────────────────────────────
// In production this would be an on-chain registry

export const OPERATOR_OWNERS: Record<OperatorType, string> = {
  add: "wallet_add_demo",
  subtract: "wallet_sub_demo",
  multiply: "wallet_mul_demo",
  divide: "wallet_div_demo",
};

export const UNIT_PRICE_USDC = "0.000001";
