# ArcSplit

**One payment in. Every component paid out.**

---

## The problem

AI pipelines are built from many independent components — retrievers, models, rerankers, verifiers — each owned by a different person or team. Today there is no standard way to route a single buyer payment across all of them. Providers either go unpaid, or the pipeline owner takes everything and redistributes manually.

## The solution

ArcSplit is a payment routing layer for composable pipelines. A buyer pays once. The payment is quoted before execution, authorized offchain with zero gas, escrowed on-chain, and split to every provider that ran — automatically, based on actual usage.

It is built on three open protocols that together cover the full payment lifecycle:

| Protocol | Role |
|---|---|
| [x402 / HTTP 402](https://docs.cdp.coinbase.com/x402/core-concepts/http-402) | Machine-readable payment challenge on every gated API call |
| [Circle Gateway Nanopayments](https://developers.circle.com/gateway/nanopayments) | EIP-3009 offchain authorization + batched USDC settlement on Arc Testnet |
| [ERC-8183 Agentic Commerce](https://eips.ethereum.org/EIPS/eip-8183) | Job escrow state machine: Open → Funded → Submitted → Completed |

## The pitch

ArcSplit is Stripe Connect for AI pipelines. Any pipeline — a calculator, a RAG stack, a video analysis workflow — can register its component providers and their wallet addresses. ArcSplit handles the rest: quoting, escrow, execution gating, and split settlement. The demos are examples. The routing layer is the product.

---

## Live demos

Two working pipelines, both running the same payment infrastructure:

### Calculator pipeline (`/pipelines/calculator`)
Parses a math expression into an AST. Each operator (`add`, `subtract`, `multiply`, `divide`) is a billable provider with its own wallet. The payment is split per operator executed.

### Media pipeline (`/pipelines/food-verify`)
Uploads an image and a video. **Gemini Embedding 2** indexes both into a shared multimodal vector space. A RAG verifier then confirms whether the content matches. Three providers are paid: `image-indexer`, `video-indexer`, `rag-verifier`.

---

## Developer setup

### Prerequisites

- Node.js 18+
- A Gemini API key (for the media pipeline)
- An Arc Testnet wallet funded with USDC (for real on-chain payments)

### 1. Install

```bash
cd arcsplit
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Wallet mnemonic — generate with viem, fund at https://faucet.circle.com/
OWS_MNEMONIC=your twelve word mnemonic phrase here

# Gemini API key — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# Generation model
GEMINI_GENERATION_MODEL=gemini-2.0-flash

# Embedding dimensions (768 | 1536 | 3072)
EMBEDDING_DIM=768
```

### 3. Fund the wallet (for real on-chain payments)

```bash
# Generate a wallet and save the mnemonic to .env.local
node --input-type=module -e "
import { generateMnemonic, english, mnemonicToAccount } from 'viem/accounts';
import fs from 'fs';
const m = generateMnemonic(english);
fs.appendFileSync('.env.local', 'OWS_MNEMONIC=' + m + '\n');
console.log('Address:', mnemonicToAccount(m).address);
"

# Fund it at https://faucet.circle.com/ — select Arc Testnet, send 20 USDC

# Approve + deposit into Circle Gateway
node ../nanopayment-x402/scripts/setup.mjs all
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Without a wallet:** the calculator pipeline still runs in demo mode with mocked signatures. The media pipeline requires a real `GEMINI_API_KEY` to call Gemini Embedding 2.

---

## How the payment flow works

Every gated API call follows the same five steps regardless of pipeline:

```
1. Quote    — count billable operations, compute max collateral
2. 402      — server returns HTTP 402 with x402 payment details
3. Sign     — buyer signs EIP-3009 authorization offchain (zero gas)
4. Escrow   — job moves Open → Funded → Submitted → Completed (ERC-8183)
5. Split    — post-complete hook distributes escrow to each provider
```

### x402 challenge shape

```json
{
  "error": "payment_required",
  "x402": {
    "scheme": "exact",
    "network": "eip155:5042002",
    "asset": "0x3600000000000000000000000000000000000000",
    "amount": "0.000004",
    "payTo": "0x0077777d7eba4688bdef3e311b846f25870a19b9",
    "jobId": "job_abc123",
    "resource": "/api/calc",
    "extra": {
      "name": "GatewayWalletBatched",
      "version": "1",
      "verifyingContract": "0x0077777d7eba4688bdef3e311b846f25870a19b9"
    }
  }
}
```

### ERC-8183 state machine

```
Open → Funded → Submitted → Completed
         ↓           ↓
      Rejected    Rejected
```

Implemented in `lib/jobStore.ts`. In production, replace with smart contract calls via viem.

---

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/quote` | POST | Parse expression, build AST, return pricing quote |
| `/api/calc` | POST | Calculator pipeline — x402 gated |
| `/api/food/verify` | POST | Media pipeline — x402 gated, multipart |
| `/api/pay` | POST | Sign EIP-3009 authorization (stateless) |
| `/api/wallet/balance` | GET | Live Arc Testnet wallet balance |
| `/api/wallet/setup` | POST | Approve + deposit into Circle Gateway |
| `/api/rag/index/media` | POST | Index image or video with Gemini Embedding 2 |
| `/api/rag/search` | POST/GET | Semantic search across indexed records |
| `/api/job/:jobId` | GET | Full ERC-8183 job state |
| `/api/health` | GET | Health check |

---

## Project structure

```
arcsplit/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── pipelines/
│   │   ├── layout.tsx              # Shared nav
│   │   ├── calculator/page.tsx     # Calculator pipeline route
│   │   └── food-verify/page.tsx    # Media pipeline route
│   └── api/
│       ├── calc/                   # Calculator x402 endpoint
│       ├── food/verify/            # Media pipeline x402 endpoint
│       ├── pay/                    # EIP-3009 signing (shared)
│       ├── quote/                  # Pre-flight quote
│       ├── rag/                    # Gemini Embedding 2 indexing + search
│       └── wallet/                 # Arc Testnet wallet management
├── components/
│   ├── DemoSection.tsx             # Calculator pipeline orchestrator
│   ├── food/                       # Media pipeline components
│   │   ├── FoodPipelineSection.tsx # Media pipeline orchestrator
│   │   ├── FoodDropZones.tsx       # File upload inputs
│   │   ├── FoodQuoteCard.tsx       # Provider breakdown quote
│   │   ├── FoodPipelineGraph.tsx   # Animated SVG pipeline graph
│   │   ├── FoodSettlementView.tsx  # Payment split visualization
│   │   └── FoodReceiptDrawer.tsx   # Settlement receipt
│   ├── AstGraph.tsx                # AST visualization (calculator)
│   ├── ExecutionTimeline.tsx       # ERC-8183 lifecycle (shared)
│   ├── PaymentChallengeCard.tsx    # 402 challenge UI (shared)
│   ├── SettlementSplitView.tsx     # Payment split (calculator)
│   ├── ReceiptDrawer.tsx           # Receipt (calculator)
│   └── WalletPanel.tsx             # Live wallet balance
└── lib/
    ├── types.ts                    # Shared types
    ├── parser.ts                   # Recursive descent expression parser
    ├── executor.ts                 # AST evaluator + execution trace
    ├── jobStore.ts                 # ERC-8183 in-memory job store
    ├── wallet.ts                   # viem wallet + EIP-712 signing
    └── rag/
        ├── gemini.ts               # Gemini Embedding 2 + RAG helpers
        ├── vector-store.ts         # Cosine similarity search
        └── storage.ts              # File upload storage
```

---

## Chain details

| Item | Value |
|---|---|
| Chain | Arc Testnet (chain ID `5042002`) |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| USDC Token | `0x3600000000000000000000000000000000000000` |
| Circle Gateway | `0x0077777d7eba4688bdef3e311b846f25870a19b9` |
| Faucet | `https://faucet.circle.com/` (select Arc Testnet) |

---

## Provider registries

**Calculator pipeline**

| Operator | Wallet | Price |
|---|---|---|
| `add` | `wallet_add_demo` | 0.000001 USDC |
| `subtract` | `wallet_sub_demo` | 0.000001 USDC |
| `multiply` | `wallet_mul_demo` | 0.000001 USDC |
| `divide` | `wallet_div_demo` | 0.000001 USDC |

**Media pipeline**

| Service | Wallet | Price |
|---|---|---|
| `image-indexer` | `wallet_img_indexer` | 0.000002 USDC |
| `video-indexer` | `wallet_vid_indexer` | 0.000003 USDC |
| `rag-verifier` | `wallet_rag_verifier` | 0.000005 USDC |

In production, this registry would be an on-chain contract.

---

## Production upgrade path

| Component | Current | Production |
|---|---|---|
| Job store | In-memory (`lib/jobStore.ts`) | Smart contract via viem |
| Vector store | `data/vector-store.json` | pgvector / Qdrant / Pinecone |
| Payment verification | Simulated | Real EIP-712 recovery + Circle Gateway API |
| Provider registry | Hardcoded | On-chain registry contract |
| File storage | Local `data/uploads/` | S3 / R2 with signed URLs |
