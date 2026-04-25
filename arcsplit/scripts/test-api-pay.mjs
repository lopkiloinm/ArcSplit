#!/usr/bin/env node
// Test /api/pay end-to-end: first get a 402, then call /api/pay with the jobId
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';

// Step 1: trigger 402
console.log('Step 1: POST /api/calc (expect 402)...');
const calcRes = await fetch(`${BASE}/api/calc`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ expression: '((3+5)*2-4)/7' }),
});
console.log('Status:', calcRes.status);
const calcData = await calcRes.json();
console.log('Response:', JSON.stringify(calcData, null, 2));

if (calcRes.status !== 402) {
  console.error('Expected 402, got', calcRes.status);
  process.exit(1);
}

const { x402 } = calcData;
console.log('\nStep 2: POST /api/pay with jobId:', x402.jobId);

const payRes = await fetch(`${BASE}/api/pay`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobId: x402.jobId,
    paymentRequirements: {
      scheme: x402.scheme,
      network: x402.network,
      asset: x402.asset,
      amount: x402.amount,
      payTo: x402.payTo,
      maxTimeoutSeconds: 300,
      extra: x402.extra,
    },
  }),
});
console.log('Pay status:', payRes.status);
const payData = await payRes.json();
console.log('Pay response:', JSON.stringify(payData, null, 2));
