/**
 * Token Association Manager
 *
 * Manages HTS token associations for user accounts.
 * Before a user can receive HTS tokens, they must associate the token with their account.
 */

import {
    AccountId,
    TokenId,
    TokenAssociateTransaction,
    TransactionId,
} from '@hashgraph/sdk'

export interface TokenAssociationStatus {
    isAssociated: boolean
    tokenId: string
}

export interface AssociateTokenParams {
    tokenId: string // Hedera token ID (0.0.X) or 'HBAR'
    accountId: string // User's account ID
}

/**
 * Check if a token is associated with an account
 *
 * @param params - Token and account parameters
 * @returns Association status
 */
export async function checkTokenAssociation(
    params: AssociateTokenParams
): Promise<TokenAssociationStatus> {
    const { tokenId, accountId } = params

    // HBAR doesn't need association
    if (tokenId === 'HBAR') {
        return {
            isAssociated: true,
            tokenId,
        }
    }

    try {
        // Query Mirror Node for account token associations
        const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'
        const useApiEndpoint = network === 'mainnet'

        // Use API endpoint for mainnet (secure), direct for testnet
        const url = useApiEndpoint
            ? `/api/mirror/account-tokens/${accountId}`
            : `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens`

        const response = await fetch(url)

        if (!response.ok) {
            console.warn(
                'Failed to fetch token associations, assuming not associated'
            )
            return {
                isAssociated: false,
                tokenId,
            }
        }

        const data = await response.json()

        // Check if token is in the list of associated tokens
        const isAssociated =
            data.tokens?.some((token: any) => token.token_id === tokenId) ||
            false

        return {
            isAssociated,
            tokenId,
        }
    } catch (error) {
        console.error('Error checking token association:', error)
        // On error, assume not associated (safer)
        return {
            isAssociated: false,
            tokenId,
        }
    }
}

/**
 * Build token association transaction
 *
 * Creates a TokenAssociateTransaction that must be signed by the user.
 *
 * @param params - Association parameters
 * @returns Serialized transaction bytes ready for wallet signing
 */
export function buildAssociationTransaction(
    params: AssociateTokenParams
): Uint8Array {
    const { tokenId, accountId } = params

    console.log('🔨 Building TokenAssociateTransaction:', {
        tokenId,
        accountId,
        network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
    })

    // Get network to determine node account
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'
    const nodeAccountId =
        network === 'mainnet'
            ? AccountId.fromString('0.0.3') // Mainnet node
            : AccountId.fromString('0.0.3') // Testnet node

    // Create transaction ID
    const operatorId = AccountId.fromString(accountId)
    const transactionId = TransactionId.generate(operatorId)

    console.log('🆔 Generated TransactionId:', transactionId.toString())

    // Create association transaction
    const transaction = new TokenAssociateTransaction()
        .setTransactionId(transactionId)
        .setAccountId(operatorId)
        .setTokenIds([TokenId.fromString(tokenId)])
        .setNodeAccountIds([nodeAccountId])

    console.log('📋 Transaction details:', {
        transactionId: transactionId.toString(),
        accountId: operatorId.toString(),
        tokenIds: [tokenId],
        nodeAccountIds: [nodeAccountId.toString()],
    })

    // Freeze and convert to bytes
    const frozenTx = transaction.freeze()
    const txBytes = frozenTx.toBytes()

    console.log('✅ Transaction frozen and serialized:', {
        bytesLength: txBytes.length,
        first20Bytes: Array.from(txBytes.slice(0, 20)),
    })

    return txBytes
}

/**
 * Request token association from user's wallet
 *
 * This function orchestrates the association flow:
 * 1. Check if token is already associated
 * 2. If not, build association transaction
 * 3. Return transaction for wallet to sign
 *
 * @param params - Association parameters
 * @returns Object with association status and transaction if needed
 */
export async function requestTokenAssociation(
    params: AssociateTokenParams
): Promise<{
    needed: boolean
    transaction?: Uint8Array
    status: TokenAssociationStatus
}> {
    // Skip HBAR
    if (params.tokenId === 'HBAR') {
        return {
            needed: false,
            status: {
                isAssociated: true,
                tokenId: params.tokenId,
            },
        }
    }

    // Check current association
    const status = await checkTokenAssociation(params)

    if (status.isAssociated) {
        return {
            needed: false,
            status,
        }
    }

    // Build association transaction
    const transaction = buildAssociationTransaction(params)

    return {
        needed: true,
        transaction,
        status,
    }
}
