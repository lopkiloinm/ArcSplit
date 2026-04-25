// POST /api/pay
// Real EIP-712 payment signing via Circle Gateway on Arc Testnet.
//
// This route is STATELESS — it does not look up a job. It just:
//   1. Takes the x402 payment requirements from the 402 response
//   2. Signs a real EIP-712 TransferWithAuthorization with the configured wallet
//   3. Returns the signed authorization for the client to attach to the /api/calc retry
//
// The job state transition (Open → Funded) happens inside /api/calc when it
// receives the signed authorization on the retry call.
//
// Why stateless: Next.js route handlers don't share in-memory state between
// invocations. The job store lives in the same process as /api/calc, so funding
// must happen there, not here.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMnemonic, createClients, signPayment, GATEWAY_ADDRESS, EXPLORER_BASE } from "@/lib/wallet";
import { mnemonicToAccount } from "viem/accounts";

const PayRequestSchema = z.object({
  // x402 payment requirements from the 402 response
  paymentRequirements: z.object({
    scheme: z.string(),
    network: z.string(),
    asset: z.string(),
    // amount as USDC decimal string e.g. "0.000004"
    amount: z.string(),
    payTo: z.string(),
    maxTimeoutSeconds: z.number().default(300),
    extra: z
      .object({
        name: z.string().optional(),
        version: z.string().optional(),
        verifyingContract: z.string().optional(),
      })
      .optional(),
  }),
  // jobId is informational only — not used for state lookup
  jobId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PayRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { paymentRequirements, jobId } = parsed.data;

    // ── Check wallet is configured ────────────────────────────────────────────
    const mnemonic = getMnemonic();
    if (!mnemonic) {
      return NextResponse.json(
        {
          error: "no_wallet",
          message:
            "No wallet configured. Add OWS_MNEMONIC to arcsplit/.env.local and restart the dev server.",
        },
        { status: 400 }
      );
    }

    const { walletClient } = createClients(mnemonic);
    const account = mnemonicToAccount(mnemonic);

    // ── Real EIP-712 signing ──────────────────────────────────────────────────
    // signPayment converts the USDC decimal amount to micro-USDC integer before
    // passing to BigInt, so "0.000004" → BigInt(4) correctly.
    let signedPayment;
    try {
      signedPayment = await signPayment(walletClient, paymentRequirements);
    } catch (e) {
      console.error("[/api/pay] signing error:", e);
      return NextResponse.json(
        { error: "signing_failed", message: (e as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      // The signed authorization — attach this to the /api/calc retry
      authorization: {
        type: "eip3009-demo",
        from: account.address,
        // Return the original decimal amount so /api/calc can store it
        amount: paymentRequirements.amount,
        nonce: signedPayment.payload.authorization.nonce,
        signature: signedPayment.payload.signature,
      },
      // On-chain context for the UI
      onChain: {
        network: "Arc Testnet",
        chainId: 5042002,
        signerAddress: account.address,
        gatewayAddress: GATEWAY_ADDRESS,
        gatewayExplorerUrl: `${EXPLORER_BASE}/address/${GATEWAY_ADDRESS}`,
        walletExplorerUrl: `${EXPLORER_BASE}/address/${account.address}`,
        paymentNonce: signedPayment.payload.authorization.nonce,
        settlementNote:
          "Circle Gateway batches signed authorizations and settles net positions onchain.",
      },
      message: "EIP-712 authorization signed. Attach to /api/calc retry.",
    });
  } catch (err) {
    console.error("[/api/pay]", err);
    return NextResponse.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
