/**
 * Transaction Monitor for Hedera Network
 *
 * Monitors transaction status using Hedera Mirror Node.
 * Implements polling strategy with exponential backoff to track
 * transaction consensus and final status.
 */

const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'

const MIRROR_NODE_URL =
    HEDERA_NETWORK === 'mainnet'
        ? 'https://mainnet.mirrornode.hedera.com'
        : 'https://testnet.mirrornode.hedera.com'

// Polling configuration
const MAX_POLLING_ATTEMPTS = 12 // Maximum number of polling attempts (~1 minute total)
const INITIAL_POLL_INTERVAL = 2000 // Start with 2 seconds
const MAX_POLL_INTERVAL = 8000 // Max 8 seconds between polls
const BACKOFF_MULTIPLIER = 1.4 // Increase interval by 40% each time

export interface TransactionStatus {
    success: boolean
    status: 'pending' | 'success' | 'failed' | 'unknown'
    consensusTimestamp?: string
    result?: string
    errorMessage?: string
    transactionId: string
}

export interface MirrorNodeTransaction {
    consensus_timestamp: string
    transaction_id: string
    result: string
    name: string
    charged_tx_fee: number
}

/**
 * Normalize transaction ID format
 *
 * Hedera transaction IDs can come in different formats:
 * - With @ separator: "0.0.1234@1234567890.123456789"
 * - With - separator: "0.0.1234-1234567890-123456789"
 *
 * Mirror Node API expects format with - separator for REST API
 *
 * @param txId - Transaction ID in any format
 * @returns Normalized transaction ID with - separators
 */
function normalizeTransactionId(txId: string): string {
    // Convert @ to - for Mirror Node API
    // "0.0.1234@1234567890.123456789" -> "0.0.1234-1234567890-123456789"
    if (txId.includes('@')) {
        const [accountId, timestamp] = txId.split('@')
        const [seconds, nanos] = timestamp.split('.')
        return `${accountId}-${seconds}-${nanos}`
    }

    // If already has -, return as is
    return txId
}

/**
 * Query Mirror Node for transaction details
 *
 * @param transactionId - Hedera transaction ID
 * @returns Transaction details from Mirror Node
 */
async function queryMirrorNode(
    transactionId: string
): Promise<MirrorNodeTransaction | null> {
    try {
        const normalizedId = normalizeTransactionId(transactionId)
        const url = `${MIRROR_NODE_URL}/api/v1/transactions/${normalizedId}`

        console.log('Querying Mirror Node:', url)

        const response = await fetch(url)

        if (!response.ok) {
            if (response.status === 404) {
                // Transaction not yet in Mirror Node
                return null
            }
            throw new Error(`Mirror Node API error: ${response.status}`)
        }

        const data = await response.json()

        // Mirror Node returns transactions array
        if (data.transactions && data.transactions.length > 0) {
            return data.transactions[0]
        }

        return null
    } catch (error) {
        console.error('Error querying Mirror Node:', error)
        throw error
    }
}

/**
 * Check if transaction result indicates success
 *
 * Hedera uses result codes where SUCCESS = "SUCCESS"
 * and various error codes for failures
 *
 * @param result - Result code from Mirror Node
 * @returns Whether transaction was successful
 */
function isSuccessResult(result: string): boolean {
    return result === 'SUCCESS'
}

/**
 * Wait with exponential backoff
 *
 * @param attempt - Current attempt number (0-indexed)
 * @returns Promise that resolves after waiting
 */
async function waitWithBackoff(attempt: number): Promise<void> {
    const delay = Math.min(
        INITIAL_POLL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, attempt),
        MAX_POLL_INTERVAL
    )

    console.log(
        `Waiting ${delay}ms before next poll (attempt ${
            attempt + 1
        }/${MAX_POLLING_ATTEMPTS})`
    )

    return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Monitor transaction until consensus is reached
 *
 * Polls Mirror Node API with exponential backoff until:
 * - Transaction is found and has final status (success/failed)
 * - Maximum polling attempts reached
 *
 * @param transactionId - Hedera transaction ID from wallet response
 * @param onProgress - Optional callback for progress updates
 * @returns Final transaction status
 */
export async function monitorTransaction(
    transactionId: string,
    onProgress?: (attempt: number, maxAttempts: number) => void
): Promise<TransactionStatus> {
    console.log('🔍 Starting transaction monitoring:', transactionId)

    // Wait before first query to give Mirror Node time to process
    // Mirror Node typically takes 3-5 seconds to index a new transaction
    const INITIAL_DELAY = 4000 // 4 seconds
    console.log(
        `⏳ Waiting ${INITIAL_DELAY}ms for Mirror Node to index transaction...`
    )
    await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY))

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
        try {
            // Notify progress
            if (onProgress) {
                onProgress(attempt + 1, MAX_POLLING_ATTEMPTS)
            }

            // Query Mirror Node
            const tx = await queryMirrorNode(transactionId)

            if (tx) {
                // Transaction found in Mirror Node
                const success = isSuccessResult(tx.result)

                console.log(`✅ Transaction confirmed:`, {
                    status: tx.result,
                    success,
                    consensusTimestamp: tx.consensus_timestamp,
                })

                return {
                    success,
                    status: success ? 'success' : 'failed',
                    consensusTimestamp: tx.consensus_timestamp,
                    result: tx.result,
                    errorMessage: success
                        ? undefined
                        : `Transaction failed with status: ${tx.result}`,
                    transactionId,
                }
            }

            // Transaction not yet in Mirror Node, wait and retry
            if (attempt < MAX_POLLING_ATTEMPTS - 1) {
                await waitWithBackoff(attempt)
            }
        } catch (error) {
            console.error(`Error on attempt ${attempt + 1}:`, error)

            // If we're not on the last attempt, wait and retry
            if (attempt < MAX_POLLING_ATTEMPTS - 1) {
                await waitWithBackoff(attempt)
            } else {
                // Last attempt failed
                return {
                    success: false,
                    status: 'unknown',
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error during monitoring',
                    transactionId,
                }
            }
        }
    }

    // Max attempts reached without finding transaction
    console.warn('⚠️ Max polling attempts reached without confirmation')

    return {
        success: false,
        status: 'unknown',
        errorMessage:
            'Transaction monitoring timeout - transaction may still be processing',
        transactionId,
    }
}

/**
 * Get transaction details (one-time query, no polling)
 *
 * Use this when you just want to check current status without waiting
 *
 * @param transactionId - Hedera transaction ID
 * @returns Transaction status or null if not found
 */
export async function getTransactionStatus(
    transactionId: string
): Promise<TransactionStatus | null> {
    try {
        const tx = await queryMirrorNode(transactionId)

        if (!tx) {
            return null
        }

        const success = isSuccessResult(tx.result)

        return {
            success,
            status: success ? 'success' : 'failed',
            consensusTimestamp: tx.consensus_timestamp,
            result: tx.result,
            errorMessage: success
                ? undefined
                : `Transaction failed with status: ${tx.result}`,
            transactionId,
        }
    } catch (error) {
        console.error('Error getting transaction status:', error)
        return null
    }
}

/**
 * Get transaction explorer URL
 *
 * @param transactionId - Hedera transaction ID
 * @param network - Network (mainnet or testnet)
 * @returns HashScan URL for transaction
 */
export function getTransactionExplorerUrl(
    transactionId: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
): string {
    const baseUrl =
        network === 'mainnet'
            ? 'https://hashscan.io/mainnet'
            : 'https://hashscan.io/testnet'

    return `${baseUrl}/transaction/${transactionId}`
}
