// POST /api/wallet/setup
// Runs approve + deposit on-chain. Returns real tx hashes linkable to arcscan.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getMnemonic,
  createClients,
  getWalletBalance,
  approveGateway,
  depositToGateway,
} from "@/lib/wallet";
import { mnemonicToAccount } from "viem/accounts";
import { parseUnits } from "viem";

const SetupSchema = z.object({
  action: z.enum(["approve", "deposit", "all"]),
  amountUsdc: z.number().positive().optional().default(5),
  capUsdc: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const mnemonic = getMnemonic();
  if (!mnemonic) {
    return NextResponse.json(
      { error: "no_wallet", message: "Set OWS_MNEMONIC in .env.local" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = SetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, amountUsdc, capUsdc } = parsed.data;
  const { walletClient, publicClient } = createClients(mnemonic);
  const account = mnemonicToAccount(mnemonic);

  const results: Record<string, unknown> = { address: account.address };

  try {
    if (action === "approve" || action === "all") {
      const tx = await approveGateway(walletClient, publicClient, capUsdc);
      results.approveTx = tx;
    }

    if (action === "deposit" || action === "all") {
      const tx = await depositToGateway(walletClient, publicClient, amountUsdc);
      results.depositTx = tx;
    }

    const balance = await getWalletBalance(publicClient, account.address);
    results.balance = balance;

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    return NextResponse.json(
      { error: "tx_failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
