# SaucerSwap V1 Adapter Implementation

## Problem Statement

- **HBAR → SAUCE swaps failing**: Only V1 routes available (no V2 liquidity)
- **USDC → SAUCE**: Also only V1 routes available
- **Current limitation**: Only V2 adapter deployed, can't execute V1 routes

## Why V1 Support Is Needed

Testing shows that many token pairs only have V1 liquidity:
- **HBAR → SAUCE**: ❌ No V2 routes, only V1
- **USDC → SAUCE**: ❌ No V2 routes, only V1 or mixed V2+V1
- **Alternative approach (2-step via USDC)**: ❌ Won't work - USDC→SAUCE also lacks V2

**Conclusion**: Must deploy V1 adapter to support these swaps.

## What We've Completed ✅

### 1. Created V1 Adapter Contract
- **File**: `contracts/solidity/adapters/SaucerSwapV1Adapter.sol`
- **Router Interface**: `contracts/solidity/interfaces/IUniswapV2Router.sol`
- **Status**: ✅ Compiled successfully with viaIR enabled

### 2. Created Deployment Script
- **File**: `scripts/deploy-v1-adapter-mainnet.js`
- **Status**: ✅ Ready to deploy (needs router address)

### 3. Updated Frontend to Accept V1 Routes
- **File**: `hooks/useSwapRoutes.ts`
  - Changed filter to accept BOTH V1 and V2 routes
  - V2 routes mapped to `SaucerSwapV2_EXACT2`
  - V1 routes keep aggregatorId as `SaucerSwapV1`

### 4. Updated Transaction Builder for V1
- **File**: `utils/transactionBuilder.ts`
  - Added V1 path detection (checks if aggregatorId starts with `SaucerSwapV1`)
  - V1 paths: ABI-encodes `route` array as `address[]`
  - V2 paths: Uses encoded `path` bytes directly

### 5. Updated Hardhat Config
- **File**: `hardhat.config.js`
  - Enabled `viaIR: true` to fix stack too deep errors

### 6. Route Validation
- **File**: `utils/routeValidation.ts`
  - `SaucerSwapV1` already in trusted aggregators list ✅

## What's Still Needed ⚠️

### 1. Find SaucerSwap V1 Router Address 🔍

**This is the blocker!** We need the V1 router contract address for mainnet.

**Ways to find it**:
1. Check HashScan for SaucerSwap V1 Router contract
2. Check ETASwap's deployed V1 adapter to see what router it uses
3. Check SaucerSwap documentation or SDK
4. Ask SaucerSwap team or community

**Known addresses for reference**:
- V2 Router (mainnet): `0.0.3949434` (`0x00000000000000000000000000000000003c437a`)
- V1 Router (mainnet): `???` ← **NEED THIS**

**Once found, set in `.env.local`**:
```bash
SAUCERSWAP_V1_ROUTER=0x...  # EVM address
```

### 2. Deploy V1 Adapter to Mainnet

Run:
```bash
node scripts/deploy-v1-adapter-mainnet.js --network mainnet
```

**Expected output**:
- Contract ID (e.g., `0.0.XXXXXXX`)
- EVM Address (e.g., `0x...`)

**Update `.env.local`**:
```bash
SAUCERSWAP_V1_ADAPTER=0x...
SAUCERSWAP_V1_ADAPTER_ID=0.0.XXXXXXX
```

**Estimated cost**: ~10-15 HBAR

### 3. Register V1 Adapter in Exchange

Create registration script or use existing one:
```javascript
const aggregatorId = "SaucerSwapV1";
const adapterAddress = process.env.SAUCERSWAP_V1_ADAPTER;
```

Run the registration transaction.

### 4. Associate Tokens to V1 Adapter

Update `app/api/ensure-tokens-associated/route.ts`:
- Add V1 adapter ID alongside V2 adapter
- Associate tokens to BOTH adapters

Or create separate script to associate initial tokens:
- wHBAR (0.0.1456986)
- USDC (0.0.456858)
- SAUCE (0.0.731861)
- Any other common tokens

### 5. Test HBAR → SAUCE Swap

Once deployed and registered:
1. Try swapping HBAR → SAUCE
2. Should now find V1 route
3. Verify transaction executes successfully
4. Check that SAUCE arrives in wallet

## Technical Details

### V1 vs V2 Differences

| Feature | V2 (Uniswap V3-style) | V1 (Uniswap V2-style) |
|---------|----------------------|----------------------|
| Router Interface | `IUniswapV3Router` | `IUniswapV2Router` |
| Path Format | Encoded bytes with fees | Array of addresses |
| Path Field | `route.path` (string) | `route.route` (string[]) |
| Path Encoding | Raw hex bytes | ABI-encoded address[] |
| Swap Functions | `exactInput`, `exactOutput` | `swapExactTokensForTokens`, etc. |
| Fee Encoding | Embedded in path | Pool-determined |

### V1 Adapter Constructor Parameters

```solidity
constructor(
  address payable _feeWallet,      // Your fee wallet
  IUniswapV2Router _router,         // V1 router address ← NEED THIS
  uint8 _feePromille,               // 3 (0.3% fee)
  IERC20 _whbarToken,               // 0.0.1456986
  IWHBAR _whbarContract             // 0.0.1456985
)
```

### How V1 Path Encoding Works

1. ETASwap returns V1 route with `route` field:
```json
{
  "aggregatorId": "SaucerSwapV1",
  "route": [
    "0x0000000000000000000000000000000000000000",  // HBAR (as address zero)
    "0x00000000000000000000000000000000000d1ea6",  // Intermediate token
    "0x00000000000000000000000000000000000b2ad5"   // SAUCE
  ]
}
```

2. Transaction builder detects V1 and ABI-encodes the array:
```javascript
const encodedPath = ethers.utils.defaultAbiCoder.encode(
  ['address[]'],
  [route.route]
);
```

3. V1 adapter receives bytes and decodes:
```solidity
address[] memory pathArray = abi.decode(path, (address[]));
```

4. V1 adapter calls Uniswap V2-style router:
```solidity
router.swapExactTokensForTokens(amount, minOut, pathArray, recipient, deadline);
```

## Next Steps

**Immediate**:
1. Find SaucerSwap V1 router address
2. Deploy V1 adapter
3. Register in Exchange
4. Associate tokens
5. Test HBAR → SAUCE swap

**Future Enhancements**:
- Support mixed V2+V1 routes (arrays of aggregators)
- Implement 2-step swap execution (if needed for edge cases)
- Add more DEX adapters (HeliSwap, Pangolin, etc.)

## Files Modified/Created

### Created:
- `contracts/solidity/adapters/SaucerSwapV1Adapter.sol`
- `contracts/solidity/interfaces/IUniswapV2Router.sol`
- `scripts/deploy-v1-adapter-mainnet.js`

### Modified:
- `hardhat.config.js` - Added `viaIR: true`
- `hooks/useSwapRoutes.ts` - Accept V1 and V2 routes
- `utils/transactionBuilder.ts` - Handle V1 path encoding

### No Changes Needed:
- `utils/routeValidation.ts` - V1 already trusted
- `app/api/ensure-tokens-associated/route.ts` - Will update after deployment
- Exchange contract - No changes needed
