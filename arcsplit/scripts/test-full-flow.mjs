#!/usr/bin/env node
// Full end-to-end test: 402 → sign → retry → complete
const BASE = 'http://localhost:3000';
const EXPR = '((3+5)*2-4)/7';

console.log('=== ArcSplit Full Flow Test ===\n');

// Step 1: trigger 402
console.log('1. POST /api/calc (no payment)...');
const r1 = await fetch(`${BASE}/api/calc`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ expression: EXPR }),
});
const d1 = await r1.json();
console.log(`   Status: ${r1.status} (expected 402)`);
console.log(`   jobId: ${d1.x402?.jobId}`);
console.log(`   amount: ${d1.x402?.amount} USDC`);
console.log(`   wallet: ${d1.wallet?.address}`);
if (r1.status !== 402) { console.error('FAIL: expected 402'); process.exit(1); }

// Step 2: sign
console.log('\n2. POST /api/pay (real EIP-712 signing)...');
const r2 = await fetch(`${BASE}/api/pay`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobId: d1.x402.jobId,
    paymentRequirements: {
      scheme: d1.x402.scheme,
      network: d1.x402.network,
      asset: d1.x402.asset,
      amount: d1.x402.amount,
      payTo: d1.x402.payTo,
      maxTimeoutSeconds: 300,
      extra: d1.x402.extra,
    },
  }),
});
const d2 = await r2.json();
console.log(`   Status: ${r2.status} (expected 200)`);
console.log(`   signer: ${d2.authorization?.from}`);
console.log(`   nonce:  ${d2.authorization?.nonce?.slice(0, 20)}...`);
console.log(`   sig:    ${d2.authorization?.signature?.slice(0, 20)}...`);
if (!r2.ok) { console.error('FAIL:', d2.message); process.exit(1); }

// Step 3: retry with authorization
console.log('\n3. POST /api/calc (with signed authorization)...');
const r3 = await fetch(`${BASE}/api/calc`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    expression: EXPR,
    paymentAuthorization: {
      type: 'eip3009-demo',
      from: d2.authorization.from,
      amount: d2.authorization.amount,
      nonce: d2.authorization.nonce,
      signature: d2.authorization.signature,
    },
  }),
});
const d3 = await r3.json();
console.log(`   Status: ${r3.status} (expected 200)`);
if (!r3.ok) { console.error('FAIL:', d3.message); process.exit(1); }

console.log(`   result: ${d3.result}`);
console.log(`   charged: ${d3.chargedUSDC} USDC`);
console.log(`   operators executed: ${d3.executionTrace?.length}`);
console.log(`   providers paid: ${d3.payouts?.length}`);
console.log(`   jobId: ${d3.jobId}`);
console.log(`   wallet: ${d3.onChain?.walletAddress}`);
console.log(`   explorer: ${d3.onChain?.walletExplorerUrl}`);
console.log('\n=== PASS: Full flow complete ===');
