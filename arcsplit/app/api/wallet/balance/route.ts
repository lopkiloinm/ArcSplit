// GET /api/wallet/balance
// Returns real on-chain balances from Arc Testnet via viem.

import { NextResponse } from "next/server";
import { getMnemonic, createClients, getWalletBalance, EXPLORER_BASE } from "@/lib/wallet";
import { mnemonicToAccount } from "viem/accounts";

export async function GET() {
  const mnemonic = getMnemonic();

  if (!mnemonic) {
    return NextResponse.json(
      {
        error: "no_wallet",
        message: "No mnemonic configured. Set OWS_MNEMONIC in .env.local",
      },
      { status: 400 }
    );
  }

  try {
    const account = mnemonicToAccount(mnemonic);
    const { publicClient } = createClients(mnemonic);
    const balance = await getWalletBalance(publicClient, account.address);

    return NextResponse.json({
      ...balance,
      explorerUrl: `${EXPLORER_BASE}/address/${account.address}`,
      chain: "Arc Testnet",
      chainId: 5042002,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "rpc_error", message: (err as Error).message },
      { status: 500 }
    );
  }
}
