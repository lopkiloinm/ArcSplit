# ArcSplit

**One payment in. Every component paid out.**

ArcSplit is a full-stack proof-of-concept for fully collateralized, pay-per-use calculator middleware built on three open protocols:

| Protocol | Role in ArcSplit |
|---|---|
| [x402 / HTTP 402](https://docs.cdp.coinbase.com/x402/core-concepts/http-402) | Payment challenge/response on `/api/calc` |
| [Circle Gateway Nanopayments](https://developers.circle.com/gateway/nanopayments) | EIP-3009 offchain authorization + batched settlement |
| [ERC-8183 Agentic Commerce](https://eips.ethereum.org/EIPS/eip-8183) | Job escrow state machine (Open → Funded → Submitted → Completed) |

The demo pipeline is a calculator expression with parentheses and operator precedence. Each operator type (`add`, `subtract`, `multiply`, `divide`) is a billable component with its own owner wallet and payout share.

---

## Quick start

```bash
cd arcsplit
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How the demo maps to each protocol

### x402 / HTTP 402

`POST /api/calc` without a payment authorization returns:

```http
HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Amount: 0.000004
X-Payment-Asset: USDC
X-Payment-Network: arc

{
  "error": "payment_required",
  "x402": {
    "scheme": "exact",
    "network": "arc",
    "asset": "USDC",
    "amount": "0.000004",
    "payTo": "gateway:arcsplit-demo-seller",
    "jobId": "job_...",
    "resource": "/api/calc"
  }
}
```

The client reads this machine-readable challenge, signs an authorization, and retries. This is the core x402 flow: HTTP 402 signals payment is required and communicates all details needed to complete it programmatically.

### Circle Gateway Nanopayments

The demo simulates the full Circle Nanopayments flow:

1. Buyer requests `/api/calc` → receives 402
2. Buyer signs an EIP-3009 payment authorization (simulated in demo mode)
3. Buyer retries with `paymentAuthorization` in the request body
4. Server verifies the authorization (simulated) and serves the resource
5. Gateway would batch the authorization for onchain settlement (mocked as `gatewayBatchId`)

In production, replace `simulateEIP3009Verification()` in `/app/api/pay/route.ts` with real EIP-712 signature recovery and Circle Gateway API calls.

### ERC-8183 Job Escrow

Every execution creates a job that follows the ERC-8183 state machine:

```
Open → Funded → Submitted → Completed
```

The backend implements all core ERC-8183 functions in `lib/jobStore.ts`:

| ERC-8183 function | ArcSplit implementation |
|---|---|
| `createJob` | Creates job in Open state |
| `setBudget` | Sets max cost from quote |
| `fund` | Verifies EIP-3009 auth, moves to Funded |
| `submit` | Stores execution result, moves to Submitted |
| `complete` | Evaluator attests, triggers split hook, moves to Completed |
| `reject` | Refunds escrow to client |
| `claimRefund` | Handles expired jobs |

The post-complete payment split is modeled after ERC-8183's optional `IACPHook.afterComplete()` — each operator provider receives their share based on actual usage.

---

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/quote` | POST | Parse expression, build AST, return pricing quote |
| `/api/calc` | POST | Execute with 402 challenge/response flow |
| `/api/pay` | POST | Verify EIP-3009 authorization, fund job |
| `/api/job/:jobId` | GET | Full job state, transitions, payouts |
| `/api/health` | GET | Health check |

---

## Architecture

```
arcsplit/
├── app/
│   ├── api/
│   │   ├── quote/route.ts      # POST /api/quote
│   │   ├── calc/route.ts       # POST /api/calc (x402 flow)
│   │   ├── pay/route.ts        # POST /api/pay (EIP-3009)
│   │   ├── job/[jobId]/route.ts # GET /api/job/:id
│   │   └── health/route.ts
│   ├── page.tsx                # Main page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── HeroSection.tsx
│   ├── HowItWorksSection.tsx
│   ├── DemoSection.tsx         # Main orchestrator
│   ├── ExpressionInput.tsx
│   ├── QuoteCard.tsx
│   ├── AstGraph.tsx            # SVG tree + execution animation
│   ├── PaymentChallengeCard.tsx # 402 challenge UI
│   ├── ExecutionTimeline.tsx   # ERC-8183 state machine UI
│   ├── SettlementSplitView.tsx # Payment split visualization
│   ├── ReceiptDrawer.tsx       # Final receipt + JSON log
│   └── AnimatedCounter.tsx
└── lib/
    ├── types.ts                # All shared types
    ├── parser.ts               # Recursive descent parser (no eval)
    ├── executor.ts             # AST evaluator + trace emitter
    └── jobStore.ts             # ERC-8183 job lifecycle (in-memory)
```

---

## Demo mode vs production

All payment logic is simulated. To connect real integrations:

1. **x402**: Replace the 402 response headers with a real x402 facilitator SDK call
2. **Circle Gateway**: Replace `simulateEIP3009Verification()` with `ethers.verifyTypedData()` + Circle Gateway API
3. **ERC-8183**: Replace `jobStore.ts` in-memory store with smart contract calls via viem/ethers

The types, state machine, and API shapes are production-ready.

---

## Operator owner registry

| Operator | Owner wallet | Unit price |
|---|---|---|
| `add` | `wallet_add_demo` | 0.000001 USDC |
| `subtract` | `wallet_sub_demo` | 0.000001 USDC |
| `multiply` | `wallet_mul_demo` | 0.000001 USDC |
| `divide` | `wallet_div_demo` | 0.000001 USDC |

In production, this registry would be an on-chain contract mapping operator types to provider addresses.
