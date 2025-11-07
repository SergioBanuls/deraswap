/**
 * Transaction Builder for Swap Operations
 *
 * Builds Hedera transactions for executing swaps through the router contract.
 * Works with both ETASwap and custom router contracts.
 *
 * The swap function signature:
 * function swap(
 *   string aggregatorId,
 *   address tokenFrom,
 *   address tokenTo,
 *   uint256 amountFrom,
 *   uint256 amountTo,     // minimum amount with slippage
 *   uint256 deadline,
 *   bool feeOnTransfer
 * ) payable
 */

import { ContractExecuteTransaction, ContractFunctionParameters, Hbar, AccountId, TransactionId, Transaction } from '@hashgraph/sdk';
import { DAppSigner } from '@hashgraph/hedera-wallet-connect';
import Long from 'long';
import { getActiveRouter } from '@/config/contracts';
import { SwapRoute } from '@/types/route';
import { Token } from '@/types/token';
import { SwapSettings } from '@/types/swap';

/**
 * Convert hex string to bytes array
 */
function hexToBytes(hex: string): Uint8Array {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export interface SwapTransactionParams {
  route: SwapRoute;
  fromToken: Token;
  toToken: Token;
  inputAmount: string; // Raw amount in smallest units
  settings: SwapSettings;
  userAccountId: string;
  signer?: DAppSigner; // Optional signer for freezeWithSigner (required for HBAR swaps)
}

/**
 * Calculate minimum amount to receive based on slippage tolerance
 *
 * @param expectedAmount - Expected output amount from route
 * @param slippageTolerance - Slippage tolerance percentage (e.g., 0.5 for 0.5%)
 * @returns Minimum amount to receive
 */
export function calculateMinimumReceived(
  expectedAmount: string,
  slippageTolerance: number
): string {
  const amount = BigInt(expectedAmount);
  const slippageBps = BigInt(Math.floor(slippageTolerance * 100));
  const minAmount = amount - (amount * slippageBps) / BigInt(10000);
  return minAmount.toString();
}

/**
 * Get aggregator ID from route
 *
 * Handles both single aggregator and split swap cases
 *
 * @param route - Swap route
 * @returns Aggregator ID string
 */
function getAggregatorId(route: SwapRoute): string {
  if (Array.isArray(route.aggregatorId)) {
    // For split swaps, join with comma (ETASwap convention)
    return route.aggregatorId.join(',');
  }
  return route.aggregatorId;
}

/**
 * Convert token ID to EVM address
 *
 * Handles HBAR → WHBAR conversion automatically
 *
 * @param tokenId - Hedera token ID (0.0.X) or 'HBAR'
 * @returns EVM address (0x...)
 */
function tokenIdToEvmAddress(tokenId: string): string {
  const WHBAR_ADDRESS = '0x0000000000000000000000000000000000163B5A'; // 0.0.1456986 (WHBAR [new]) - FIXED!

  if (tokenId === 'HBAR') {
    return WHBAR_ADDRESS;
  }

  // Convert Hedera ID to EVM address
  const parts = tokenId.split('.');
  const num = parseInt(parts[2]);
  return '0x' + num.toString(16).padStart(40, '0');
}

/**
 * Calculate total output amount from route
 *
 * Handles both single and split swap outputs
 *
 * @param route - Swap route
 * @returns Total output amount
 */
function getTotalOutputAmount(route: SwapRoute): string {
  if (Array.isArray(route.amountTo)) {
    return route.amountTo.reduce(
      (sum, amt) => (BigInt(sum) + BigInt(amt)).toString(),
      '0'
    );
  }
  return route.amountTo;
}

/**
 * Build swap transaction for Hedera
 *
 * Creates a ContractExecuteTransaction that calls the swap function
 * on the router contract.
 *
 * When swapping FROM HBAR:
 * - If signer is provided: Returns Promise of frozen Transaction (ready for executeWithSigner)
 * - If signer is NOT provided: Returns Uint8Array (legacy flow - WILL FAIL)
 *
 * When NOT swapping from HBAR:
 * - Always returns Uint8Array
 *
 * @param params - Swap transaction parameters (must include signer for HBAR swaps)
 * @returns Serialized transaction bytes OR Promise of frozen Transaction
 */
export async function buildSwapTransaction(
  params: SwapTransactionParams
): Promise<Uint8Array | Transaction> {
  const { route, fromToken, toToken, inputAmount, settings, userAccountId, signer } = params;
  const router = getActiveRouter();

  // Check if we're doing an HBAR swap with signer
  const isHbarSwapWithSigner = fromToken.id === 'HBAR' && signer;

  // Get network to determine node account (only if NOT using signer)
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  const nodeAccountId = AccountId.fromString(network === 'mainnet' ? '0.0.3' : '0.0.3');

  // Create transaction ID (only if NOT using signer)
  // When using freezeWithSigner, the signer populates transactionId automatically
  const operatorId = AccountId.fromString(userAccountId);
  const transactionId = isHbarSwapWithSigner ? null : TransactionId.generate(operatorId);

  // Get aggregator ID
  const aggregatorId = getAggregatorId(route);

  // Convert tokens to EVM addresses
  const tokenFromAddress = tokenIdToEvmAddress(fromToken.id);
  const tokenToAddress = tokenIdToEvmAddress(toToken.id);

  // Calculate total expected output
  const expectedOutput = getTotalOutputAmount(route);

  // Calculate minimum amount to receive with slippage
  const minimumReceived = calculateMinimumReceived(
    expectedOutput,
    settings.slippageTolerance
  );

  console.log('🔧 Building swap transaction:', {
    aggregatorId,
    tokenFromAddress,
    tokenToAddress,
    inputAmount,
    expectedOutput,
    minimumReceived,
    deadline: settings.deadline,
    slippage: settings.slippageTolerance,
  });

  // Convert values - try using number for values that fit in JS number range
  const inputAmountNum = Number(inputAmount);
  const minimumReceivedNum = Number(minimumReceived);
  const deadlineNum = settings.deadline;

  console.log('🔢 Numeric values:', {
    inputAmountNum,
    minimumReceivedNum,
    deadlineNum,
  });

  // Use path from route if available (ETASwap provides the correct path with fees)
  // Path format for V2: [token0 (20 bytes), fee (3 bytes), token1 (20 bytes), ...]
  let pathBytes: Uint8Array;
  
  if (route.path && typeof route.path === 'string') {
    // Use path directly from ETASwap API (already encoded)
    console.log('📍 Using path from route:', route.path);
    pathBytes = hexToBytes(route.path);
  } else {
    // Fallback: Build path manually (single hop with default 0.3% fee)
    console.warn('⚠️ No path in route, building manually with 0.3% fee');
    const fee = new Uint8Array([0x00, 0x0b, 0xb8]); // 3000 = 0.3% fee
    pathBytes = new Uint8Array([
      ...hexToBytes(tokenFromAddress),
      ...fee,
      ...hexToBytes(tokenToAddress),
    ]);
  }
  
  console.log('📍 Path bytes length:', pathBytes.length);

  // Check if from token is HBAR
  const isTokenFromHBAR = fromToken.id === 'HBAR';
  // Build function parameters for custom contract
  const functionParams = new ContractFunctionParameters()
    .addString(aggregatorId)
    .addBytes(pathBytes)
    .addUint256(inputAmountNum)
    .addUint256(minimumReceivedNum)
    .addUint256(deadlineNum)
    .addBool(isTokenFromHBAR)
    .addBool(false); // feeOnTransfer - set to false by default
  
  console.log('✅ All parameters added successfully');

  // Create contract execute transaction with explicit gas
  // Add 50% buffer to gas estimate for safety (especially for HBAR swaps)
  const baseGas = route.gasEstimate || 500000;
  const gasLimit = Math.floor(baseGas * 1.5);
  console.log('⛽ Setting gas limit:', gasLimit, '(base:', baseGas, '+50%)');

  // Build transaction - different approach for signer vs non-signer
  let transaction = new ContractExecuteTransaction()
    .setContractId(router.hederaId)
    .setGas(gasLimit)
    .setFunction('swap', functionParams);

  // IMPORTANT: freezeWithSigner needs nodeAccountIds but NOT transactionId
  // - nodeAccountIds: must be set manually
  // - transactionId: populated automatically by signer
  // - maxTransactionFee: optional for signer
  if (isHbarSwapWithSigner) {
    transaction = transaction.setNodeAccountIds([nodeAccountId]);
  } else {
    transaction = transaction
      .setTransactionId(transactionId!)
      .setNodeAccountIds([nodeAccountId])
      .setMaxTransactionFee(new Hbar(20));
  }

  // If swapping from HBAR, attach HBAR value
  if (fromToken.id === 'HBAR') {
    const hbarAmount = Number(inputAmount) / 100000000; // Convert tinybars to HBAR
    transaction.setPayableAmount(new Hbar(hbarAmount));

    // CRITICAL: When swapping HBAR, we MUST use freezeWithSigner
    // to properly serialize the payableAmount field
    if (signer) {
      console.log('🔐 Freezing HBAR swap transaction with signer...');
      const frozenTx = await transaction.freezeWithSigner(signer);
      console.log('✅ Transaction frozen with signer (payableAmount will be included)');
      return frozenTx;
    } else {
      console.warn('⚠️ WARNING: Swapping HBAR without signer - payableAmount will NOT be serialized correctly!');
      console.warn('⚠️ This transaction will likely FAIL with "amount: 0" error');
    }
  }

  // For non-HBAR swaps, use regular freeze()
  const frozenTx = transaction.freeze();
  return frozenTx.toBytes();
}

/**
 * Estimate gas for swap transaction
 *
 * Returns a conservative gas estimate based on transaction type
 *
 * @param route - Swap route
 * @returns Gas estimate
 */
export function estimateSwapGas(route: SwapRoute): number {
  // Use route's gas estimate if available
  if (route.gasEstimate && route.gasEstimate > 0) {
    // Add 20% buffer for safety
    return Math.floor(route.gasEstimate * 1.2);
  }

  // Fallback estimates based on transaction type
  switch (route.transactionType) {
    case 'SWAP':
      return 250000; // Direct swap
    case 'INDIRECT_SWAP':
      return 400000; // Multi-hop swap
    case 'SPLIT_SWAP':
      return 500000; // Split swap across multiple DEXes
    default:
      return 300000; // Default conservative estimate
  }
}

/**
 * Validate swap transaction parameters
 *
 * Performs sanity checks before building transaction
 *
 * @param params - Transaction parameters
 * @returns Validation result
 */
export function validateSwapParams(params: SwapTransactionParams): {
  valid: boolean;
  error?: string;
} {
  const { route, inputAmount, settings } = params;

  // Check input amount is positive
  if (BigInt(inputAmount) <= BigInt(0)) {
    return { valid: false, error: 'Input amount must be positive' };
  }

  // Check deadline is in the future
  const now = Math.floor(Date.now() / 1000);
  if (settings.deadline <= now) {
    return { valid: false, error: 'Deadline must be in the future' };
  }

  // Check slippage is reasonable
  if (settings.slippageTolerance < 0 || settings.slippageTolerance > 50) {
    return { valid: false, error: 'Slippage tolerance must be between 0% and 50%' };
  }

  // Check output amount exists
  const outputAmount = getTotalOutputAmount(route);
  if (BigInt(outputAmount) <= BigInt(0)) {
    return { valid: false, error: 'Invalid output amount from route' };
  }

  return { valid: true };
}
