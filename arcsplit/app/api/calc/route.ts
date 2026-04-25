// POST /api/calc
// Real x402 HTTP 402 challenge/response flow with on-chain EIP-712 signing.
//
// Flow:
//   1. No payment → 402 Payment Required (x402 challenge)
//   2. Client calls /api/pay to sign + fund
//   3. Client retries with paymentAuthorization → execute, settle, return result
//
// Payment signing uses the real GatewayEvmScheme from nanopayment-x402 skill:
//   - EIP-712 domain: verifyingContract = Circle Gateway (NOT USDC token)
//   - Signed offchain, zero gas
//   - Circle Gateway batches for onchain settlement

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseExpression, countOperations, validateExpression } from "@/lib/parser";
import { executeAST, computeTotalCost } from "@/lib/executor";
import { createJob, setBudget, fund, submit, complete } from "@/lib/jobStore";
import { getMnemonic, createClients, signPayment, GATEWAY_ADDRESS, EXPLORER_BASE } from "@/lib/wallet";
import { UNIT_PRICE_USDC, OperationCounts, PaymentAuthorization } from "@/lib/types";
import { mnemonicToAccount } from "viem/accounts";

const CalcRequestSchema = z.object({
  expression: z.string().min(1).max(500),
  paymentAuthorization: z
    .object({
      type: z.literal("eip3009-demo"),
      from: z.string(),
      amount: z.string(),
      nonce: z.string(),
      signature: z.string(),
      jobId: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CalcRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { expression, paymentAuthorization } = parsed.data;

    const validation = validateExpression(expression);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "invalid_expression", message: validation.error },
        { status: 400 }
      );
    }

    let ast;
    try {
      ast = parseExpression(expression);
    } catch (e) {
      return NextResponse.json(
        { error: "parse_error", message: (e as Error).message },
        { status: 400 }
      );
    }

    const rawCounts = countOperations(ast);
    const operationCounts: OperationCounts = {
      add: rawCounts.add,
      subtract: rawCounts.subtract,
      multiply: rawCounts.multiply,
      divide: rawCounts.divide,
    };
    const totalOps =
      operationCounts.add +
      operationCounts.subtract +
      operationCounts.multiply +
      operationCounts.divide;

    const maxCostUSDC = (totalOps * parseFloat(UNIT_PRICE_USDC)).toFixed(6);

    // ── x402: No payment → 402 Payment Required ───────────────────────────────
    if (!paymentAuthorization) {
      const pendingJob = createJob(expression);
      setBudget(pendingJob.id, maxCostUSDC, ast, operationCounts);

      // Get real wallet address if configured
      const mnemonic = getMnemonic();
      let payerAddress = "buyer_demo_wallet";
      if (mnemonic) {
        const account = mnemonicToAccount(mnemonic);
        payerAddress = account.address;
      }

      return NextResponse.json(
        {
          error: "payment_required",
          x402: {
            scheme: "exact",
            network: "eip155:5042002",
            asset: "0x3600000000000000000000000000000000000000",
            amount: maxCostUSDC,
            // payTo is the Gateway contract — real Circle Gateway on Arc Testnet
            payTo: GATEWAY_ADDRESS,
            jobId: pendingJob.id,
            resource: "/api/calc",
            extra: {
              name: "GatewayWalletBatched",
              version: "1",
              verifyingContract: GATEWAY_ADDRESS,
            },
          },
          // Wallet info for the UI
          wallet: {
            address: payerAddress,
            explorerUrl: mnemonic
              ? `${EXPLORER_BASE}/address/${mnemonicToAccount(mnemonic).address}`
              : null,
          },
        },
        {
          status: 402,
          headers: {
            "X-Payment-Required": "true",
            "X-Payment-Amount": maxCostUSDC,
            "X-Payment-Asset": "USDC",
            "X-Payment-Network": "eip155:5042002",
            "X-Payment-Chain": "Arc Testnet",
          },
        }
      );
    }

    // ── Payment present: run full ERC-8183 lifecycle ──────────────────────────

    let job = createJob(expression);
    setBudget(job.id, maxCostUSDC, ast, operationCounts);

    const auth: PaymentAuthorization = {
      type: "eip3009-demo",
      from: paymentAuthorization.from,
      amount: paymentAuthorization.amount,
      nonce: paymentAuthorization.nonce,
      signature: paymentAuthorization.signature,
    };

    try {
      job = fund(job.id, auth);
    } catch (e) {
      return NextResponse.json(
        { error: "payment_verification_failed", message: (e as Error).message },
        { status: 402 }
      );
    }

    const { value, trace, payouts } = executeAST(ast);
    const chargedUSDC = computeTotalCost(trace);

    job = submit(job.id, value, trace, payouts, chargedUSDC);
    job = complete(job.id);

    // Build explorer links for the payment
    const mnemonic = getMnemonic();
    const walletAddress = mnemonic ? mnemonicToAccount(mnemonic).address : paymentAuthorization.from;

    return NextResponse.json({
      jobId: job.id,
      status: "Completed",
      result: value,
      expression,
      operationCounts,
      chargedUSDC,
      payouts,
      receipt: job.receipt,
      executionTrace: trace,
      // Real on-chain context
      onChain: {
        network: "Arc Testnet",
        chainId: 5042002,
        walletAddress,
        walletExplorerUrl: `${EXPLORER_BASE}/address/${walletAddress}`,
        gatewayAddress: GATEWAY_ADDRESS,
        gatewayExplorerUrl: `${EXPLORER_BASE}/address/${GATEWAY_ADDRESS}`,
        // The payment auth nonce can be used to look up the batch settlement tx
        paymentNonce: paymentAuthorization.nonce,
      },
    });
  } catch (err) {
    console.error("[/api/calc]", err);
    return NextResponse.json(
      { error: "internal_error", message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
