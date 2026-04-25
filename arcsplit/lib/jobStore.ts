// ─── In-Memory Job Store ──────────────────────────────────────────────────────
// Simulates ERC-8183 job lifecycle in application code.
// In production, this would be backed by smart contract calls.

import { v4 as uuidv4 } from "uuid";
import {
  Job,
  JobStatus,
  EscrowTransition,
  ASTNode,
  OperationCounts,
  ExecutionStep,
  Payout,
  PaymentAuthorization,
  Receipt,
} from "./types";

// Singleton in-memory store (survives across API calls in dev mode)
const jobs = new Map<string, Job>();

// ─── ERC-8183 Core Functions ──────────────────────────────────────────────────

/**
 * createJob — ERC-8183 §createJob
 * Creates a new job in Open state with no budget set yet.
 */
export function createJob(expression: string): Job {
  const now = new Date().toISOString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

  const job: Job = {
    id: `job_${uuidv4().replace(/-/g, "").slice(0, 12)}`,
    expression,
    status: "Open",
    // Roles (ERC-8183)
    client: "buyer_demo_wallet",
    provider: "arcsplit-demo-provider",
    evaluator: "arcsplit-demo-evaluator", // backend acts as evaluator
    // Budget
    budgetUSDC: "0",
    fundedAmountUSDC: "0",
    // Computation
    ast: null,
    operationCounts: null,
    executionTrace: [],
    payouts: [],
    // Payment
    paymentAuthorization: null,
    // Lifecycle
    escrowTransitions: [
      { from: null, to: "Open", timestamp: now, reason: "Job created" },
    ],
    createdAt: now,
    expiredAt: expiry,
    // Result
    result: null,
    chargedUSDC: null,
    receipt: null,
  };

  jobs.set(job.id, job);
  return job;
}

/**
 * setBudget — ERC-8183 §setBudget
 * Sets the agreed budget for the job (must be in Open state).
 */
export function setBudget(
  jobId: string,
  budgetUSDC: string,
  ast: ASTNode,
  operationCounts: OperationCounts
): Job {
  const job = getJobOrThrow(jobId);
  assertStatus(job, "Open");

  job.budgetUSDC = budgetUSDC;
  job.ast = ast;
  job.operationCounts = operationCounts;

  jobs.set(jobId, job);
  return job;
}

/**
 * fund — ERC-8183 §fund
 * Client funds the job, moving it from Open → Funded.
 * Simulates pulling budget from client into escrow.
 */
export function fund(jobId: string, authorization: PaymentAuthorization): Job {
  const job = getJobOrThrow(jobId);
  assertStatus(job, "Open");

  // Simulate EIP-3009 signature verification
  // In production: verify authorization.signature against EIP-3009 typed data
  if (!authorization.signature || authorization.signature.length < 4) {
    throw new Error("Invalid payment authorization signature");
  }

  job.fundedAmountUSDC = authorization.amount;
  job.paymentAuthorization = authorization;
  job.status = "Funded";
  job.escrowTransitions.push({
    from: "Open",
    to: "Funded",
    timestamp: new Date().toISOString(),
    reason: `EIP-3009 authorization verified. Escrow funded: ${authorization.amount} USDC`,
  });

  jobs.set(jobId, job);
  return job;
}

/**
 * submit — ERC-8183 §submit
 * Provider submits work (execution result), moving Funded → Submitted.
 */
export function submit(
  jobId: string,
  result: number,
  trace: ExecutionStep[],
  payouts: Payout[],
  chargedUSDC: string
): Job {
  const job = getJobOrThrow(jobId);
  assertStatus(job, "Funded");

  job.result = result;
  job.executionTrace = trace;
  job.payouts = payouts;
  job.chargedUSDC = chargedUSDC;
  job.status = "Submitted";
  job.escrowTransitions.push({
    from: "Funded",
    to: "Submitted",
    timestamp: new Date().toISOString(),
    reason: `Execution complete. Result: ${result}. Charged: ${chargedUSDC} USDC`,
  });

  jobs.set(jobId, job);
  return job;
}

/**
 * complete — ERC-8183 §complete
 * Evaluator attests completion, moving Submitted → Completed.
 * Triggers payment split hook (ERC-8183 optional hooks).
 */
export function complete(jobId: string): Job {
  const job = getJobOrThrow(jobId);
  assertStatus(job, "Submitted");

  job.status = "Completed";
  job.escrowTransitions.push({
    from: "Submitted",
    to: "Completed",
    timestamp: new Date().toISOString(),
    reason: "Evaluator attested completion. Escrow released to providers.",
  });

  // ERC-8183 post-complete hook: payment splitting
  // In production: calls IACPHook.afterComplete() which distributes escrow
  job.receipt = {
    paymentAuthorizationId: `auth_${uuidv4().replace(/-/g, "").slice(0, 12)}`,
    gatewayBatchId: `batch_${uuidv4().replace(/-/g, "").slice(0, 12)}`,
    escrowStateTransitions: job.escrowTransitions.map((t) => t.to),
  };

  jobs.set(jobId, job);
  return job;
}

/**
 * reject — ERC-8183 §reject
 * Evaluator or client rejects the job, refunding escrow to client.
 */
export function reject(jobId: string, reason: string): Job {
  const job = getJobOrThrow(jobId);

  if (job.status !== "Open" && job.status !== "Funded" && job.status !== "Submitted") {
    throw new Error(`Cannot reject job in ${job.status} state`);
  }

  const from = job.status;
  job.status = "Rejected";
  job.escrowTransitions.push({
    from,
    to: "Rejected",
    timestamp: new Date().toISOString(),
    reason,
  });

  jobs.set(jobId, job);
  return job;
}

/**
 * claimRefund — ERC-8183 §claimRefund
 * Anyone may trigger refund after expiredAt. Sets state to Expired.
 */
export function claimRefund(jobId: string): Job {
  const job = getJobOrThrow(jobId);

  if (new Date() < new Date(job.expiredAt)) {
    throw new Error("Job has not expired yet");
  }

  const from = job.status;
  job.status = "Expired";
  job.escrowTransitions.push({
    from,
    to: "Expired",
    timestamp: new Date().toISOString(),
    reason: "Job expired. Escrow refunded to client.",
  });

  jobs.set(jobId, job);
  return job;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

export function getJobOrThrow(jobId: string): Job {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  return job;
}

function assertStatus(job: Job, expected: JobStatus) {
  if (job.status !== expected) {
    throw new Error(
      `Job ${job.id} is in ${job.status} state, expected ${expected}`
    );
  }
}

// Expose for testing / debugging
export function getAllJobs(): Job[] {
  return Array.from(jobs.values());
}
