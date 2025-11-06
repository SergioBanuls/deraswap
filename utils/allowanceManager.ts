/**
 * Token Allowance Manager
 *
 * Manages HTS (Hedera Token Service) token allowances for swap operations.
 * Handles checking and requesting approvals for the swap router contract.
 *
 * Note: This implementation is router-agnostic and will work with both
 * ETASwap and custom router contracts.
 */

import { AccountId, TokenId, AccountAllowanceApproveTransaction, TransactionId } from '@hashgraph/sdk';
import { getActiveRouter } from '@/config/contracts';

export interface AllowanceStatus {
  hasAllowance: boolean;
  currentAllowance: string;
  required: string;
}

export interface ApprovalParams {
  tokenId: string; // Hedera token ID (0.0.X)
  amount: string; // Amount in smallest units
  ownerAccountId: string; // User's account ID
  spenderAddress: string; // Router contract address
}

/**
 * Check if token allowance exists for the swap router
 *
 * @param params - Allowance check parameters
 * @returns Allowance status
 */
export async function checkAllowance(
  params: ApprovalParams
): Promise<AllowanceStatus> {
  const { tokenId, amount, ownerAccountId, spenderAddress } = params;

  try {
    // Query Mirror Node for token allowances
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const mirrorNodeUrl =
      network === 'mainnet'
        ? 'https://mainnet.mirrornode.hedera.com'
        : 'https://testnet.mirrornode.hedera.com';

    const response = await fetch(
      `${mirrorNodeUrl}/api/v1/accounts/${ownerAccountId}/allowances/tokens`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch allowances');
    }

    const data = await response.json();

    // Find allowance for this specific token and spender
    const allowance = data.allowances?.find(
      (a: any) =>
        a.token_id === tokenId &&
        a.spender.toLowerCase() === spenderAddress.toLowerCase()
    );

    const currentAllowance = allowance?.amount_granted || '0';
    const hasAllowance = BigInt(currentAllowance) >= BigInt(amount);

    return {
      hasAllowance,
      currentAllowance,
      required: amount,
    };
  } catch (error) {
    console.error('Error checking allowance:', error);
    // Assume no allowance on error (safer)
    return {
      hasAllowance: false,
      currentAllowance: '0',
      required: amount,
    };
  }
}

/**
 * Build token approval transaction
 *
 * Creates an AccountAllowanceApproveTransaction for HTS tokens.
 * This transaction must be signed and sent by the user's wallet.
 *
 * @param params - Approval parameters
 * @returns Serialized transaction bytes ready for wallet signing
 */
export function buildApprovalTransaction(params: ApprovalParams): Uint8Array {
  const { tokenId, amount, ownerAccountId } = params;
  const router = getActiveRouter();

  // Get network to determine node account
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  const nodeAccountId = network === 'mainnet'
    ? AccountId.fromString('0.0.3')  // Mainnet node
    : AccountId.fromString('0.0.3'); // Testnet node

  // Create transaction ID
  const operatorId = AccountId.fromString(ownerAccountId);
  const transactionId = TransactionId.generate(operatorId);

  // Create approval transaction
  const transaction = new AccountAllowanceApproveTransaction()
    .setTransactionId(transactionId)
    .approveTokenAllowance(
      TokenId.fromString(tokenId),
      AccountId.fromString(ownerAccountId),
      AccountId.fromEvmAddress(0, 0, router.address),
      parseInt(amount)
    )
    .setNodeAccountIds([nodeAccountId]);

  // Freeze and convert to bytes
  const frozenTx = transaction.freeze();
  return frozenTx.toBytes();
}

/**
 * Request token approval from user's wallet
 *
 * This function orchestrates the approval flow:
 * 1. Check if allowance already exists
 * 2. If not, build approval transaction
 * 3. Return transaction for wallet to sign
 *
 * @param params - Approval parameters
 * @returns Object with approval status and transaction if needed
 */
export async function requestApproval(params: ApprovalParams): Promise<{
  needed: boolean;
  transaction?: Uint8Array;
  status: AllowanceStatus;
}> {
  // Check current allowance
  const status = await checkAllowance(params);

  if (status.hasAllowance) {
    return {
      needed: false,
      status,
    };
  }

  // Build approval transaction
  const transaction = buildApprovalTransaction(params);

  return {
    needed: true,
    transaction,
    status,
  };
}

/**
 * Calculate required allowance with buffer
 *
 * Adds a small buffer to prevent edge cases where amounts might not match exactly.
 *
 * @param amount - Required amount
 * @param bufferPercentage - Buffer percentage (default 1%)
 * @returns Amount with buffer
 */
export function calculateAllowanceWithBuffer(
  amount: string,
  bufferPercentage: number = 1
): string {
  const amountBigInt = BigInt(amount);
  const buffer = (amountBigInt * BigInt(bufferPercentage * 100)) / BigInt(10000);
  return (amountBigInt + buffer).toString();
}
