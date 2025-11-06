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

import { ContractExecuteTransaction, ContractFunctionParameters, Hbar, AccountId, TransactionId } from '@hashgraph/sdk';
import Long from 'long';
import { getActiveRouter } from '@/config/contracts';
import { SwapRoute } from '@/types/route';
import { Token } from '@/types/token';
import { SwapSettings } from '@/types/swap';

export interface SwapTransactionParams {
  route: SwapRoute;
  fromToken: Token;
  toToken: Token;
  inputAmount: string; // Raw amount in smallest units
  settings: SwapSettings;
  userAccountId: string;
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
  const WHBAR_ADDRESS = '0x0000000000000000000000000000000000163a3a'; // 0.0.1456986

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
 * @param params - Swap transaction parameters
 * @returns Serialized transaction bytes ready for wallet signing
 */
export function buildSwapTransaction(
  params: SwapTransactionParams
): Uint8Array {
  const { route, fromToken, toToken, inputAmount, settings, userAccountId } = params;
  const router = getActiveRouter();

  // Get network to determine node account
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  const nodeAccountId = AccountId.fromString(network === 'mainnet' ? '0.0.3' : '0.0.3');

  // Create transaction ID
  const operatorId = AccountId.fromString(userAccountId);
  const transactionId = TransactionId.generate(operatorId);

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

  // Build function parameters
  const functionParams = new ContractFunctionParameters()
    .addString(aggregatorId)
    .addAddress(tokenFromAddress)
    .addAddress(tokenToAddress)
    .addUint256(Long.fromString(inputAmount))
    .addUint256(Long.fromString(minimumReceived))
    .addUint256(settings.deadline)
    .addBool(false); // feeOnTransfer - set to false by default

  // Create contract execute transaction
  const transaction = new ContractExecuteTransaction()
    .setTransactionId(transactionId)
    .setContractId(router.hederaId)
    .setGas(route.gasEstimate || 300000) // Use route gas estimate or default
    .setFunction('swap', functionParams)
    .setNodeAccountIds([nodeAccountId]);

  // If swapping from HBAR, attach HBAR value
  if (fromToken.id === 'HBAR') {
    const hbarAmount = Number(inputAmount) / 100000000; // Convert tinybars to HBAR
    transaction.setPayableAmount(new Hbar(hbarAmount));
  }

  // Freeze and convert to bytes
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
