#!/usr/bin/env node
// Quick test: real EIP-712 signing with the wallet from .env.local
import fs from 'fs';
import path from 'path';
import { createWalletClient, http, getAddress } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    if (!line || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

const mnemonic = process.env.OWS_MNEMONIC || process.env.X402_MNEMONIC;
if (!mnemonic) {
  console.error('ERROR: OWS_MNEMONIC not found in .env.local');
  process.exit(1);
}

console.log('Mnemonic words:', mnemonic.split(' ').length);

const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
};

const account = mnemonicToAccount(mnemonic);
console.log('Address:', account.address);

const walletClient = createWalletClient({
  account,
  chain: ARC_TESTNET,
  transport: http('https://rpc.testnet.arc.network'),
});

const GATEWAY = '0x0077777d7eba4688bdef3e311b846f25870a19b9';
const nonce = '0x' + [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
const now = Math.floor(Date.now() / 1000);

console.log('\nSigning EIP-712 TransferWithAuthorization...');
console.log('  domain.verifyingContract:', GATEWAY, '(Gateway, not USDC token)');
console.log('  nonce:', nonce.slice(0, 20) + '...');

try {
  const sig = await walletClient.signTypedData({
    account,
    domain: {
      name: 'GatewayWalletBatched',
      version: '1',
      chainId: 5042002,
      verifyingContract: getAddress(GATEWAY),
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: {
      from: getAddress(account.address),
      to: getAddress(GATEWAY),
      value: BigInt(4),
      validAfter: BigInt(now - 600),
      validBefore: BigInt(now + 300),
      nonce,
    },
  });
  console.log('\nSignature:', sig.slice(0, 20) + '...' + sig.slice(-8));
  console.log('SUCCESS: EIP-712 signing works');
} catch (e) {
  console.error('\nSIGNING ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
