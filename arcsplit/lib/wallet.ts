// ─── Real Wallet & Payment Layer ─────────────────────────────────────────────
// Uses the nanopayment-x402 skill's GatewayEvmScheme to sign real EIP-712
// TransferWithAuthorization payments on Arc Testnet via Circle Gateway.
//
// Chain:   Arc Testnet (5042002)
// RPC:     https://rpc.testnet.arc.network
// Explorer:https://testnet.arcscan.app/
// USDC:    0x3600000000000000000000000000000000000000
// Gateway: 0x0077777d7eba4688bdef3e311b846f25870a19b9

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  maxUint256,
  formatUnits,
  parseUnits,
  getAddress,
  type Address,
  type WalletClient,
  type PublicClient,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";

// ─── Arc Testnet chain definition ────────────────────────────────────────────

export const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
} as const;

export const EXPLORER_BASE = "https://testnet.arcscan.app";
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as Address;
export const GATEWAY_ADDRESS = "0x0077777d7eba4688bdef3e311b846f25870a19b9" as Address;

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const GATEWAY_ABI = parseAbi([
  "function deposit(address token, uint256 amount)",
]);

// ─── Wallet clients ───────────────────────────────────────────────────────────

export function createClients(mnemonic: string) {
  const account = mnemonicToAccount(mnemonic);
  const walletClient = createWalletClient({
    account,
    chain: ARC_TESTNET,
    transport: http("https://rpc.testnet.arc.network"),
  });
  const publicClient = createPublicClient({
    chain: ARC_TESTNET,
    transport: http("https://rpc.testnet.arc.network"),
  });
  return { account, walletClient, publicClient };
}

// ─── Balance check ────────────────────────────────────────────────────────────

export interface WalletBalance {
  address: Address;
  nativeUsdc: string;
  erc20Usdc: string;
  gatewayAllowance: string;
  isUnlimitedAllowance: boolean;
}

export async function getWalletBalance(
  publicClient: PublicClient,
  address: Address
): Promise<WalletBalance> {
  const [nativeBal, tokenBal, allowance] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    }),
    publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address, GATEWAY_ADDRESS],
    }),
  ]);

  return {
    address,
    nativeUsdc: formatUnits(nativeBal as bigint, 18),
    erc20Usdc: formatUnits(tokenBal as bigint, 6),
    gatewayAllowance:
      (allowance as bigint) === maxUint256
        ? "unlimited"
        : formatUnits(allowance as bigint, 6),
    isUnlimitedAllowance: (allowance as bigint) === maxUint256,
  };
}

// ─── Approve Gateway ─────────────────────────────────────────────────────────

export interface TxResult {
  hash: `0x${string}`;
  blockNumber: bigint;
  status: "success" | "reverted";
  explorerUrl: string;
}

export async function approveGateway(
  walletClient: WalletClient,
  publicClient: PublicClient,
  capUsdc?: number
): Promise<TxResult> {
  const amount = capUsdc == null ? maxUint256 : parseUnits(capUsdc.toString(), 6);
  const hash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [GATEWAY_ADDRESS, amount],
    account: walletClient.account!,
    chain: ARC_TESTNET,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return {
    hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    explorerUrl: `${EXPLORER_BASE}/tx/${hash}`,
  };
}

// ─── Deposit into Gateway ─────────────────────────────────────────────────────

export async function depositToGateway(
  walletClient: WalletClient,
  publicClient: PublicClient,
  amountUsdc: number
): Promise<TxResult> {
  const amount = BigInt(Math.round(amountUsdc * 1e6));
  const hash = await walletClient.writeContract({
    address: GATEWAY_ADDRESS,
    abi: GATEWAY_ABI,
    functionName: "deposit",
    args: [USDC_ADDRESS, amount],
    account: walletClient.account!,
    chain: ARC_TESTNET,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return {
    hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    explorerUrl: `${EXPLORER_BASE}/tx/${hash}`,
  };
}

// ─── GatewayEvmScheme ─────────────────────────────────────────────────────────
// Adapted from nanopayment-x402/scripts/x402_client.mjs
// Signs EIP-712 TransferWithAuthorization using Circle Gateway's domain
// (verifyingContract = Gateway, NOT the USDC token address)

export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: {
    name?: string;
    version?: string;
    verifyingContract?: string;
  };
}

export interface SignedPaymentPayload {
  x402Version: number;
  payload: {
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
    signature: `0x${string}`;
  };
}

export async function signPayment(
  walletClient: WalletClient,
  requirements: PaymentRequirements
): Promise<SignedPaymentPayload> {
  const nonce =
    "0x" +
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const now = Math.floor(Date.now() / 1000);
  const address = walletClient.account!.address;

  // Convert USDC decimal string (e.g. "0.000004") to micro-USDC integer string
  // BigInt() cannot parse decimals — must convert to the 6-decimal integer first
  const amountMicroUsdc = BigInt(Math.round(parseFloat(requirements.amount) * 1_000_000));

  const authorization = {
    from: address,
    to: getAddress(requirements.payTo as Address),
    value: amountMicroUsdc.toString(),
    validAfter: (now - 600).toString(),
    validBefore: (now + requirements.maxTimeoutSeconds).toString(),
    nonce,
  };

  const chainIdMatch = requirements.network.match(/eip155:(\d+)/);
  const chainId = chainIdMatch ? parseInt(chainIdMatch[1]) : 5042002;

  // Circle Gateway: verifyingContract is the Gateway, not the USDC token
  const domain = {
    name: requirements.extra?.name ?? "GatewayWalletBatched",
    version: requirements.extra?.version ?? "1",
    chainId,
    verifyingContract: requirements.extra?.verifyingContract
      ? getAddress(requirements.extra.verifyingContract as Address)
      : getAddress(requirements.asset as Address),
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  } as const;

  const message = {
    from: getAddress(authorization.from),
    to: getAddress(authorization.to),
    value: BigInt(authorization.value),
    validAfter: BigInt(authorization.validAfter),
    validBefore: BigInt(authorization.validBefore),
    nonce: authorization.nonce as `0x${string}`,
  };

  const signature = await walletClient.signTypedData({
    account: walletClient.account!,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  return {
    x402Version: 1,
    payload: { authorization, signature },
  };
}

// ─── Get mnemonic from env ────────────────────────────────────────────────────

export function getMnemonic(): string | null {
  return (
    process.env.OWS_MNEMONIC ||
    process.env.X402_MNEMONIC ||
    null
  );
}
