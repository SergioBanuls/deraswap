<div align="center">
  <div style="background-color: #000; padding: 20px; border-radius: 10px; display: inline-block;">
    <img src="./public/DERASWAP.png" alt="DeraSwap Logo" width="200"/>
  </div>
  
  # DeraSwap
  
  ### 🚀 A modern decentralized exchange aggregator for Hedera Hashgraph
  
  **Intelligent routing • Multi-DEX aggregation • NFT rewards**
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Hedera](https://img.shields.io/badge/Hedera-Mainnet-purple?style=for-the-badge)](https://hedera.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

  [Features](#-features) • [Quick Start](#-getting-started) • [Documentation](#-table-of-contents) • [Contributing](#-contributing)

  ---

</div>

> DeraSwap is a production-ready token swap aggregator that provides optimal pricing across multiple DEXs on Hedera, featuring seamless wallet integration, real-time route optimization, and an NFT-based reward system for active traders.

## 📑 Table of Contents

- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Architecture](#️-architecture)
- [🚀 Getting Started](#-getting-started)
- [🔄 Key Flows](#-key-flows)
- [📜 Smart Contracts](#-smart-contracts)
- [⚙️ Configuration](#️-configuration)
- [💻 Development](#-development)
- [🚢 Deployment](#-deployment)
- [📚 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🎯 Core Functionality

- **Multi-DEX Aggregation**: Automatically finds the best swap routes across SaucerSwap V1, SaucerSwap V2, and other Hedera DEXs via ETASwap integration
- **Optimal Pricing**: Intelligent route selection based on price impact, gas costs, and route complexity
- **Real-time Token Prices**: Live USD pricing for all supported tokens with automatic refresh
- **Slippage Protection**: Configurable slippage tolerance (auto or manual 0.1%-5%) to protect against unfavorable swaps
- **Transaction Monitoring**: Real-time transaction status tracking with detailed progress updates

### 👛 Wallet Integration

- **Native Hedera Wallets**: Support for HashPack, Kabila, and other Hedera-native wallets
- **WalletConnect v2**: Industry-standard wallet connection via Reown AppKit
- **Persistent Sessions**: Automatic wallet reconnection across browser sessions
- **Secure Signing**: Transaction signing happens directly in user's wallet - private keys never exposed

### 🎁 Gamified Incentives

- **NFT Rewards**: Users earn unique NFTs after accumulating $10 USD in swap volume
- **Progress Tracking**: Real-time visual progress indicator showing swap volume towards NFT eligibility
- **Mission System**: Extensible mission framework for future campaigns and rewards
- **On-chain Verification**: All swaps verified on Hedera Mirror Node to prevent fraud

### 🎨 User Experience

- **Token Auto-Association**: Automatic Hedera token association when needed
- **Allowance Management**: Smart token approval with buffer to minimize transaction count
- **Swap History**: Complete transaction history with USD values and explorer links
- **Responsive Design**: Mobile-first design that works seamlessly on all devices
- **Toast Notifications**: Real-time feedback for all user actions

---

## 🛠️ Technology Stack

### 🎨 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.1 | React framework with App Router, API routes, SSR/SSG |
| **React** | 18 | UI component library |
| **TypeScript** | 5.9.3 | Static type checking |
| **Tailwind CSS** | 4.1.16 | Utility-first CSS framework |
| **Radix UI** | Latest | Unstyled, accessible component primitives |
| **Lucide React** | 0.552.0 | Icon library (1000+ icons) |
| **Sonner** | 2.0.7 | Beautiful toast notifications |

### 📊 State Management & Data Fetching

| Technology | Version | Purpose |
|------------|---------|---------|
| **TanStack Query** | 5.90.7 | Server state management, caching, and background refetching |
| **React Context** | - | Local state (wallet connection, token prices) |

### ⛓️ Blockchain Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| **@hashgraph/sdk** | 2.76.0 | Hedera SDK - transaction building, account operations |
| **@hashgraph/hedera-wallet-connect** | 2.0.3 | Native WalletConnect integration for Hedera |
| **@reown/appkit** | 1.8.13 | Reown AppKit for multi-wallet support |
| **@walletconnect/sign-client** | 2.23.0 | Low-level WalletConnect protocol implementation |

### 🗄️ Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.0.1 | Server-side API endpoints |
| **Supabase** | 2.83.0 | PostgreSQL database for incentives and swap history |
| **Axios** | 1.7.0 | HTTP client for external API integration |

### 🔧 Smart Contracts & Development

| Technology | Version | Purpose |
|------------|---------|---------|
| **Hardhat** | 2.19.0 | Solidity development environment |
| **ethers.js** | 5.7.2 | Contract interaction library |
| **OpenZeppelin Contracts** | 4.9.3 | Audited smart contract libraries |
| **Solidity** | 0.8.x | Smart contract programming language |

---

## 🏗️ Architecture

### 🔍 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DeraSwap Frontend                           │
│                      (Next.js 16 + React 18)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Swap Engine  │  │  Incentives  │  │Wallet Manager│            │
│  │              │  │   (NFTs)     │  │  (Reown)    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                 │                     │
└─────────┼─────────────────┼─────────────────┼─────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js API Layer                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /api/swap-routes     /api/incentives/*     /api/balances/[id]    │
│  /api/tokens          /api/swap-history     /api/token-prices     │
│                                                                     │
└─────────┬───────────────────┬───────────────────┬───────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│   ETASwap API    │  │    Supabase     │  │  Hedera Network     │
│  (Route Quotes)  │  │   (PostgreSQL)  │  │  (Mirror Node)      │
└──────────────────┘  └─────────────────┘  └──────────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────────┐
                                            │ Smart Contracts      │
                                            │ - Exchange           │
                                            │ - SaucerSwapAdapter  │
                                            └──────────────────────┘
```

### 📁 Project Structure

```
deraswap/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Main swap interface
│   ├── providers.tsx                 # TanStack Query + context providers
│   └── api/                          # Backend API routes
│       ├── swap-routes/              # Proxy to ETASwap for route quotes
│       ├── balances/[accountId]/     # Fetch Hedera account balances
│       ├── tokens/                   # Available tokens list
│       ├── token-prices/             # Real-time token pricing
│       ├── incentives/               # NFT reward system endpoints
│       │   ├── progress/             # Get user's swap progress
│       │   ├── record-swap/          # Record completed swap
│       │   ├── claim-nft/            # Initiate NFT claim
│       │   └── confirm-claim/        # Confirm NFT claim
│       ├── swap-history/             # Transaction history
│       └── ensure-tokens-associated/ # Batch token association check
│
├── components/                       # React UI Components
│   ├── SwapCard.tsx                  # Main swap interface card
│   ├── SwapRoutes.tsx                # Route selection display
│   ├── MissionsSheet.tsx             # Incentives panel
│   ├── IncentiveProgress.tsx         # NFT progress tracker
│   ├── AmountInput.tsx               # Token amount input with balance
│   ├── TokenSelectCard.tsx           # Token selector dropdown
│   ├── SwapProgressDialog.tsx        # Transaction progress modal
│   ├── SwapHistory.tsx               # Historical transactions
│   ├── Header.tsx                    # App navigation header
│   └── ui/                           # Radix UI primitives
│
├── hooks/                            # Custom React Hooks
│   ├── useReownConnect.ts            # Wallet connection management
│   ├── useSwapRoutes.ts              # Fetch and cache swap routes
│   ├── useSwapExecution.ts           # Execute swap transactions
│   ├── useTokenBalances.ts           # Fetch user token balances
│   ├── useIncentives.ts              # NFT incentive system
│   ├── useSwapSettings.ts            # Slippage/deadline preferences
│   ├── useTokens.ts                  # Available tokens list
│   ├── useAssociateToken.ts          # Token association flow
│   └── useCheckUserTokenAssociation.ts # Check token association status
│
├── contexts/                         # React Context Providers
│   ├── ReownProvider.tsx             # Wallet connection state
│   └── TokenPricesProvider.tsx       # Token price caching
│
├── utils/                            # Utility Functions
│   ├── transactionBuilder.ts         # Build Hedera transactions
│   ├── allowanceManager.ts           # Token allowance handling
│   ├── tokenAssociation.ts           # Token association helpers
│   ├── routeValidation.ts            # Route validation & filtering
│   ├── transactionMonitor.ts         # Transaction status monitoring
│   ├── swapValidation.ts             # Swap input validation
│   ├── amountValidation.ts           # Amount formatting/parsing
│   ├── pathUtils.ts                  # Route path utilities
│   ├── errorMessages.ts              # Error parsing & user-friendly messages
│   └── usdCalculator.ts              # USD value calculations
│
├── contracts/                        # Smart Contracts
│   ├── solidity/                     # Solidity source code
│   │   ├── Exchange.sol              # Main exchange contract
│   │   ├── adapters/                 # DEX adapter contracts
│   │   │   ├── SaucerSwapV2Adapter.sol
│   │   │   └── SaucerSwapV1Adapter.sol
│   │   ├── interfaces/               # Contract interfaces
│   │   └── libraries/                # Shared libraries
│   └── abis/                         # Compiled contract ABIs
│
├── types/                            # TypeScript Type Definitions
│   ├── token.ts                      # Token type definitions
│   ├── route.ts                      # Swap route types
│   ├── swap.ts                       # Swap settings & execution types
│   ├── incentive.ts                  # Incentive system types
│   └── supabase.types.ts             # Auto-generated database types
│
├── lib/
│   └── supabase.ts                   # Supabase client configuration
│
├── config/
│   └── contracts.ts                  # Contract addresses & configuration
│
├── scripts/                          # Deployment & Utility Scripts
│   ├── deploy-exchange.js            # Deploy Exchange contract
│   ├── deploy-adapter.js             # Deploy Adapter contracts
│   ├── associate-tokens.ts           # Token association utilities
│   └── ... (70+ scripts)
│
└── public/                           # Static Assets
    ├── tokens/                       # Token logos
    └── icons/                        # App icons
```

---

## 🚀 Getting Started

### ✅ Prerequisites

- **Node.js** 18+ or higher
- **pnpm** (recommended) or npm
- A **Reown Project ID** from [Reown Cloud](https://cloud.reown.com/)
- A **Supabase Project** for the incentive system
- A **Validation Cloud API Key** for Hedera Mirror Node access (optional but recommended)
- A **Hedera Account** on testnet or mainnet

### 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/deraswap.git
   cd deraswap
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Copy the example environment file and update it:

   ```bash
   cp .env.example .env.local
   ```

   Update the following variables in `.env.local`:

   ```bash
   # === Wallet Connection ===
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
   NEXT_PUBLIC_HEDERA_NETWORK=testnet  # or mainnet

   # === Hedera Mirror Node (Optional - uses public endpoint if not set) ===
   VALIDATION_CLOUD_BASE_URL=https://mainnet.hedera.validationcloud.io/v1
   VALIDATION_CLOUD_API_KEY=your_validation_cloud_api_key

   # === Supabase Database ===
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # === NFT Incentive System ===
   NEXT_PUBLIC_NFT_TOKEN_ID=0.0.XXXXXX
   NFT_TOKEN_ID=0.0.XXXXXX
   NEXT_PUBLIC_DEFAULT_MISSION_ID=uuid_of_default_mission
   NFT_WALLET_ID=0.0.YYYYYY
   NFT_WALLET_PRIVATE_KEY=your_nft_treasury_private_key

   # === Swap Router Configuration ===
   NEXT_PUBLIC_SWAP_ROUTER_TYPE=etaswap  # or custom
   NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x...  # if using custom router
   NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.X  # if using custom router
   ```

4. **Set up Supabase database**

   Create the following tables in your Supabase project:

   ```sql
   -- User incentive progress tracking
   CREATE TABLE user_incentives (
     wallet_address TEXT PRIMARY KEY,
     total_swapped_usd DECIMAL DEFAULT 0,
     nft_minted BOOLEAN DEFAULT FALSE,
     nft_token_id TEXT,
     nft_serial_number INTEGER,
     nft_minted_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Swap transaction history
   CREATE TABLE swap_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     wallet_address TEXT NOT NULL,
     tx_hash TEXT UNIQUE NOT NULL,
     token_in_id TEXT NOT NULL,
     token_out_id TEXT NOT NULL,
     amount_in DECIMAL NOT NULL,
     amount_out DECIMAL NOT NULL,
     usd_value DECIMAL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Mission definitions
   CREATE TABLE missions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     nft_token_id TEXT NOT NULL,
     requirement_type TEXT DEFAULT 'swap_volume',
     requirement_amount DECIMAL DEFAULT 10,
     available_serials INTEGER[],
     active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- User mission claims
   CREATE TABLE user_mission_claims (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     mission_id UUID REFERENCES missions(id),
     wallet_address TEXT NOT NULL,
     nft_serial_number INTEGER NOT NULL,
     claimed_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(mission_id, wallet_address)
   );

   -- Create indexes
   CREATE INDEX idx_swap_history_wallet ON swap_history(wallet_address);
   CREATE INDEX idx_swap_history_created ON swap_history(created_at DESC);
   CREATE INDEX idx_user_mission_claims_wallet ON user_mission_claims(wallet_address);
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

---

## 🔄 Key Flows

### 1. 💱 Token Swap Flow

The complete swap execution follows these steps:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                       │
│    - Selects source token (e.g., HBAR)                             │
│    - Selects destination token (e.g., USDC)                        │
│    - Enters amount to swap                                         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ROUTE DISCOVERY (useSwapRoutes)                                 │
│    - Debounced API call (500ms) to /api/swap-routes               │
│    - ETASwap aggregates quotes from multiple DEXs                 │
│    - Routes filtered by validity (min output > 0)                 │
│    - Sorted by: price impact → gas cost → complexity              │
│    - Cached for 30s via TanStack Query                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. USER ROUTE SELECTION                                            │
│    - Reviews available routes with price impact                   │
│    - Selects optimal route (or best route auto-selected)          │
│    - Configures slippage tolerance (auto or manual)               │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. PRE-SWAP VALIDATION (useSwapExecution)                          │
│    ✓ Check sufficient balance                                     │
│    ✓ Validate amount format                                       │
│    ✓ Verify route still valid                                     │
│    ✓ Check wallet connected                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. TOKEN ASSOCIATION CHECK                                         │
│    - Query if destination token is associated                     │
│    - If NOT associated:                                            │
│      • Build TokenAssociateTransaction                            │
│      • Request user signature in wallet                           │
│      • Execute and monitor transaction                            │
│      • Wait for confirmation                                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. ALLOWANCE CHECK (allowanceManager)                              │
│    - Get current token allowance for router                       │
│    - If allowance < swap amount:                                  │
│      • Calculate required allowance (with 10% buffer)             │
│      • Build approval transaction                                 │
│      • Request user signature in wallet                           │
│      • Execute approval                                           │
│      • Cache allowance for future swaps                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. TRANSACTION BUILDING (transactionBuilder)                       │
│    - Create ContractExecuteTransaction                            │
│    - Call swap() or splitSwap() function on Exchange contract    │
│    - Parameters:                                                   │
│      • aggregatorId: "SaucerSwapV2"                               │
│      • path: encoded token route                                  │
│      • amountFrom: input amount (smallest units)                  │
│      • amountTo: minimum output (with slippage)                   │
│      • deadline: current timestamp + 20 minutes                   │
│      • isTokenFromHBAR: true if swapping from HBAR               │
│      • feeOnTransfer: handle fee-on-transfer tokens              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. TRANSACTION EXECUTION                                            │
│    - Freeze transaction with DAppSigner                           │
│    - Convert to base64 transaction bytes                          │
│    - Send to wallet for signature                                 │
│    - Wallet signs and broadcasts to Hedera                        │
│    - Receive transaction ID (e.g., 0.0.123456@1234567890.123)    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. TRANSACTION MONITORING (transactionMonitor)                     │
│    - Poll Mirror Node every 2s for transaction status             │
│    - Show progress dialog with current status:                    │
│      • "Pending" → "Submitted" → "Confirmed" → "Success"         │
│    - On success: Extract actual swap amounts from receipt         │
│    - On failure: Parse and display error message                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. POST-SWAP RECORDING                                            │
│     - POST /api/incentives/record-swap                            │
│     - Validate transaction on Mirror Node:                        │
│       • Verify transaction successful                             │
│       • Verify wallet address matches                             │
│       • Prevent duplicate recording (tx_hash unique)              │
│     - Calculate USD value of swap                                 │
│     - Update user_incentives.total_swapped_usd                    │
│     - Insert into swap_history table                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 11. SUCCESS & UI UPDATE                                            │
│     ✓ Show success toast notification                             │
│     ✓ Display HashScan explorer link                              │
│     ✓ Update token balances                                       │
│     ✓ Update swap history                                         │
│     ✓ Update incentive progress bar                               │
│     ✓ Enable NFT claim button if $10 threshold reached            │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. 🔐 Wallet Connection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "CONNECT WALLET"                                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ReownProvider.connect()                                         │
│    - Initialize DAppConnector (if not already initialized)        │
│    - Call connector.openModal()                                   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. WALLETCONNECT MODAL DISPLAYS                                    │
│    - Shows available Hedera wallets:                              │
│      • HashPack (recommended)                                     │
│      • Kabila                                                     │
│      • MetaMask (via WalletConnect)                               │
│      • Other WalletConnect v2 wallets                             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. USER SELECTS WALLET & APPROVES CONNECTION                       │
│    - Deep link opens wallet app (mobile) or extension (desktop)   │
│    - Wallet shows connection request with dApp metadata           │
│    - User approves connection in wallet                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. SESSION ESTABLISHED                                             │
│    - WalletConnect session created                                │
│    - DAppSigner instance available                                │
│    - Extract account ID from signer                               │
│    - Store session in localStorage                                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. UPDATE UI STATE                                                 │
│    - Set isConnected = true                                       │
│    - Set account = "0.0.XXXXX"                                    │
│    - Set signer = DAppSigner instance                             │
│    - Trigger balance fetch                                        │
│    - Enable swap functionality                                    │
└─────────────────────────────────────────────────────────────────────┘
```

**Session Persistence:**

- Session data stored in localStorage automatically by DAppConnector
- On page reload: ReownProvider.init() attempts to restore session
- If valid session exists: Auto-reconnect without modal
- If session expired: User must connect again

### 3. 🎁 NFT Incentive Claim Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ PREREQUISITE: User has completed $10 USD in swaps                  │
│ (total_swapped_usd >= 10 in user_incentives table)                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ELIGIBILITY CHECK                                               │
│    - GET /api/incentives/progress?wallet={address}                │
│    - Returns:                                                      │
│      { totalSwappedUSD: 10.50, nftMinted: false, eligible: true } │
│    - "Claim NFT" button becomes enabled                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. USER CLICKS "CLAIM NFT"                                         │
│    - useIncentives.claimNFT() called                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. NFT TOKEN ASSOCIATION (if needed)                               │
│    - Check if user's account has NFT token associated             │
│    - If NOT:                                                       │
│      • Build TokenAssociateTransaction(nftTokenId)                │
│      • Request user signature                                     │
│      • Execute and wait for confirmation                          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. REQUEST NFT CLAIM TRANSACTION                                   │
│    - POST /api/incentives/claim-nft                               │
│    - Body: { walletAddress, missionId }                           │
│    - Backend:                                                      │
│      • Verifies user eligibility (>= $10 USD swapped)            │
│      • Checks nft_minted === false                                │
│      • Finds available NFT serial from missions table             │
│      • Creates TransferTransaction:                               │
│        - From: NFT_WALLET_ID (treasury)                           │
│        - To: user's wallet                                        │
│        - NFT: nftTokenId / serialNumber                           │
│      • Signs with treasury private key                            │
│      • Returns base64 transaction bytes                           │
│    - Response: { transactionBytes: "base64..." }                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. USER SIGNS TRANSACTION                                          │
│    - Decode base64 transaction bytes                              │
│    - Send to wallet via DAppSigner                                │
│    - User sees NFT transfer request in wallet                     │
│    - User approves and signs                                      │
│    - Wallet broadcasts to Hedera                                  │
│    - Receive transaction ID                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. CONFIRM CLAIM                                                   │
│    - POST /api/incentives/confirm-claim                           │
│    - Body: { walletAddress, transactionId, missionId, serial }   │
│    - Backend:                                                      │
│      • Verifies transaction on Mirror Node                        │
│      • Confirms NFT transfer successful                           │
│      • Updates user_incentives:                                   │
│        - nft_minted = true                                        │
│        - nft_token_id = "0.0.XXXXX"                               │
│        - nft_serial_number = 123                                  │
│        - nft_minted_at = NOW()                                    │
│      • Inserts into user_mission_claims                           │
│    - Response: { success: true }                                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. SUCCESS UI UPDATE                                               │
│    ✓ Show success toast: "NFT claimed successfully!"             │
│    ✓ Update progress component:                                   │
│      - Hide "Claim NFT" button                                    │
│      - Show "NFT Claimed ✓" badge                                 │
│      - Display link to view NFT on HashScan                       │
│    ✓ Confetti animation (optional)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contracts

### 🔄 Exchange Contract

**Location:** `contracts/solidity/Exchange.sol`

The Exchange contract is a modified version of the ETASwap exchange, providing multi-DEX aggregation capabilities.

**Key Features:**
- Supports multiple DEX adapters (SaucerSwap V1, V2, etc.)
- Handles both single and split swaps for optimal pricing
- Pausable for emergency situations
- Reentrancy guard protection
- Owner-controlled adapter management

**Main Functions:**

```solidity
function swap(
    string calldata aggregatorId,
    bytes calldata path,
    uint256 amountFrom,
    uint256 amountTo,
    uint256 deadline,
    bool isTokenFromHBAR,
    bool feeOnTransfer
) external payable nonReentrant whenNotPaused returns (uint256[] memory amounts)
```

**Deployed Contracts:**

| Network | Contract | Address (EVM) | Address (Hedera) |
|---------|----------|---------------|------------------|
| Mainnet | ETASwap Exchange (Official) | `0x00000000000000000000000000000000004983f3` | `0.0.4817907` |
| Testnet | Custom Exchange | Deploy your own | Deploy your own |

### 🔌 SaucerSwap V2 Adapter

**Location:** `contracts/solidity/adapters/SaucerSwapV2Adapter.sol`

Adapter contract that integrates the Exchange with SaucerSwap V2 DEX.

**Key Features:**
- Handles token transfers to/from SaucerSwap router
- Manages WHBAR wrapping/unwrapping for HBAR swaps
- Configurable fee structure (default 0.3%)
- Custom fee wallet support

**Constructor Parameters:**

```solidity
constructor(
    address _feeWallet,      // Address to receive swap fees
    address _router,         // SaucerSwap V2 router address
    uint256 _feePromille     // Fee in per-mille (3 = 0.3%)
)
```

### 🚀 Deployment Scripts

Deploy your own contracts to customize fee collection:

```bash
# 1. Deploy Exchange contract
npx tsx scripts/deploy-exchange.js

# 2. Deploy SaucerSwap adapter
npx tsx scripts/deploy-adapter.js

# 3. Configure adapter on Exchange
npx tsx scripts/configure-adapter.js
```

---

## ⚙️ Configuration

### 🛣️ Router Configuration

DeraSwap supports two router modes:

#### 1. ETASwap Router (Default - Recommended)

Uses the official ETASwap exchange contract:

```bash
NEXT_PUBLIC_SWAP_ROUTER_TYPE=etaswap
```

**Benefits:**
- Battle-tested, audited contract
- Actively maintained by ETASwap team
- Best routing algorithm
- Largest liquidity aggregation

#### 2. Custom Router

Deploy your own Exchange contract to collect custom fees:

```bash
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x... # EVM address
NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.XXXXX # Hedera account ID
```

**Use Cases:**

- Custom fee collection
- Experimental routing algorithms
- Private deployment requirements

### 🪙 Token Configuration

**Available Tokens:**
Fetched dynamically from ETASwap API at runtime. No manual configuration needed.

**Key Tokens (Mainnet):**

- HBAR (Native currency)
- WHBAR: `0.0.1456986` (Wrapped HBAR)
- USDC: `0.0.456858` (Circle USD Coin)
- USDT: `0.0.XXXXX` (Tether)
- SAUCE: `0.0.XXXXX` (SaucerSwap governance token)

### 📉 Slippage Configuration

**Default Auto-Slippage Calculation:**

```typescript
// Based on route price impact
if (priceImpact < 0.5%) slippage = 0.5%
else if (priceImpact < 1%) slippage = 1%
else if (priceImpact < 2%) slippage = 2%
else slippage = min(priceImpact * 1.5, 5%)
```

Users can override with manual slippage (0.1% - 5%).

### ⏱️ Transaction Deadline

**Default:** Current timestamp + 20 minutes

Configurable in swap settings (10 - 60 minutes).

---

## 💻 Development

### 📝 Available Scripts

```bash
# Development
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Smart Contracts
pnpm hardhat compile              # Compile Solidity contracts
pnpm hardhat test                 # Run contract tests
npx tsx scripts/deploy-exchange   # Deploy Exchange to Hedera
npx tsx scripts/deploy-adapter    # Deploy Adapter to Hedera

# Utilities
npx tsx scripts/associate-tokens  # Batch associate tokens to account
npx tsx scripts/check-balances    # Check account token balances
```

### 🔄 Development Workflow

1. **Run development server:**
   ```bash
   pnpm dev
   ```

2. **Make changes** to components, hooks, or utilities

3. **Test in browser** at `http://localhost:3000`

4. **Check TypeScript errors:**
   ```bash
   pnpm tsc --noEmit
   ```

5. **Lint code:**
   ```bash
   pnpm lint
   ```

6. **Build for production:**
   ```bash
   pnpm build
   ```

### 🧪 Testing on Testnet

1. **Set Hedera network to testnet:**
   ```bash
   NEXT_PUBLIC_HEDERA_NETWORK=testnet
   ```

2. **Get testnet HBAR:**
   - Visit [Hedera Portal](https://portal.hedera.com/)
   - Create testnet account
   - Get free testnet HBAR from faucet

3. **Connect wallet:**
   - Configure HashPack for testnet
   - Import testnet account
   - Connect to DeraSwap

4. **Test swaps:**
   - Swap testnet tokens
   - Verify transactions on [HashScan Testnet](https://hashscan.io/testnet)

### 🐛 Debugging

**React Query DevTools:**
```tsx
// Enabled automatically in development
// View at: http://localhost:3000
// Toggle with "React Query" button in bottom-left corner
```

**Console Logs:**
- Swap execution: `🔄 [SWAP]` prefix
- Wallet events: `👛 [WALLET]` prefix
- Route fetching: `🛣️ [ROUTES]` prefix
- Incentives: `🎁 [INCENTIVES]` prefix

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Wallet won't connect | Check Reown Project ID is correct |
| No routes found | Verify tokens exist on selected network |
| Transaction fails | Check token association & allowance |
| NFT claim fails | Verify treasury has available NFT serials |

---

## 🚢 Deployment

### ▲ Deploy to Vercel (Recommended)

DeraSwap is optimized for Vercel deployment:

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables:**
   - Add all variables from `.env.local`
   - Never commit `.env.local` to git

4. **Deploy:**
   - Vercel deploys automatically on push to main
   - Preview deployments created for pull requests

### 🌐 Deploy to Other Platforms

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
pnpm build
netlify deploy --prod --dir=.next
```

**Self-Hosted (Docker):**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t deraswap .
docker run -p 3000:3000 --env-file .env.local deraswap
```

### ✅ Production Checklist

- [ ] Environment variables configured (all secrets set)
- [ ] Supabase database tables created with indexes
- [ ] NFT treasury account funded with NFTs
- [ ] Validation Cloud API key active (or public Mirror Node configured)
- [ ] Reown Project ID whitelisted for production domain
- [ ] Router type configured (`etaswap` or `custom`)
- [ ] Test swap on production before public launch
- [ ] Test NFT claim flow end-to-end
- [ ] Analytics/monitoring configured (optional)
- [ ] Domain configured with SSL certificate
- [ ] Error tracking setup (Sentry, etc.) - optional

---

## 📚 API Reference

### 🛣️ Swap Routes

**Endpoint:** `GET /api/swap-routes`

**Query Parameters:**

- `from` (required): Source token ID (Hedera format: `0.0.XXXXX`)
- `to` (required): Destination token ID
- `amount` (required): Amount to swap (in token's base units)
- `slippage` (optional): Slippage tolerance percentage (default: 0.5)

**Example:**

```bash
GET /api/swap-routes?from=0.0.1456986&to=0.0.456858&amount=100000000&slippage=0.5
```

**Response:**
```json
{
  "routes": [
    {
      "aggregatorId": "SaucerSwapV2",
      "path": ["0.0.1456986", "0.0.456858"],
      "amountIn": "100000000",
      "amountOut": "50000000",
      "priceImpact": 0.12,
      "gasEstimate": "0.001",
      "route": [
        { "tokenId": "0.0.1456986", "symbol": "WHBAR" },
        { "tokenId": "0.0.456858", "symbol": "USDC" }
      ]
    }
  ]
}
```

### 💰 Token Prices

**Endpoint:** `GET /api/token-prices`

**Response:**
```json
{
  "prices": {
    "0.0.1456986": { "usd": 0.045, "lastUpdated": "2024-01-15T12:00:00Z" },
    "0.0.456858": { "usd": 1.00, "lastUpdated": "2024-01-15T12:00:00Z" }
  }
}
```

### 📊 User Incentive Progress

**Endpoint:** `GET /api/incentives/progress`

**Query Parameters:**

- `wallet` (required): User's Hedera account ID

**Example:**
```bash
GET /api/incentives/progress?wallet=0.0.123456
```

**Response:**
```json
{
  "walletAddress": "0.0.123456",
  "totalSwappedUSD": 15.50,
  "nftMinted": false,
  "eligible": true,
  "progress": 155
}
```

### 📝 Record Swap

**Endpoint:** `POST /api/incentives/record-swap`

**Request Body:**
```json
{
  "walletAddress": "0.0.123456",
  "transactionId": "0.0.123456@1234567890.123456789",
  "tokenInId": "0.0.1456986",
  "tokenOutId": "0.0.456858",
  "amountIn": "100000000",
  "amountOut": "50000000",
  "usdValue": 4.50
}
```

**Response:**
```json
{
  "success": true,
  "newTotalUSD": 19.50
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### 🔄 Development Process

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes and commit:**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### 📝 Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

### 🎨 Code Style

- **TypeScript:** Strict mode enabled
- **ESLint:** Run `pnpm lint` before committing
- **Formatting:** Prettier (auto-format on save recommended)
- **Components:** Use functional components with hooks
- **Naming:**
  - Components: PascalCase (`SwapCard.tsx`)
  - Hooks: camelCase with `use` prefix (`useSwapRoutes.ts`)
  - Utilities: camelCase (`transactionBuilder.ts`)

---

## 📄 License

This project is open-source and available under the **MIT License**.

---

## 🙏 Acknowledgments

- **Hedera Hashgraph** - Enterprise-grade blockchain platform
- **ETASwap** - DEX aggregation infrastructure
- **SaucerSwap** - Primary DEX on Hedera
- **Reown (WalletConnect)** - Multi-wallet connection standard
- **Supabase** - PostgreSQL database platform
- **Vercel** - Hosting and deployment platform

---

## 💬 Support & Community

<div align="center">

| Resource | Link |
|----------|------|
| 🐛 **Issues** | [GitHub Issues](https://github.com/SergioBanuls/deraswap/issues) |
| 💬 **Discussions** | [GitHub Discussions](https://github.com/SergioBanuls/deraswap/discussions) |
| 📖 **Documentation** | [docs.deraswap.com](https://docs.deraswap.com) |
| 🐦 **Twitter** | [@DeraSwap](https://twitter.com/deraswap) |

</div>

---

<div align="center">
  
  ### Built with ❤️ for the Hedera ecosystem
  
  <img src="https://img.shields.io/badge/Powered%20by-Hedera-purple?style=for-the-badge" alt="Powered by Hedera"/>
  
  **⭐ Star us on GitHub — it helps!**
  
</div>
