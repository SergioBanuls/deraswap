/**
 * useSwapHistory Hook
 *
 * Fetches and manages swap transaction history for a wallet address.
 * Uses infinite scroll pagination with cursor-based loading.
 * Caches results for 10 minutes to minimize API calls.
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getActiveRouter } from '@/config/contracts'

export interface SwapHistoryItem {
    timestamp: number
    fromToken: string
    toToken: string
    fromAmount: string
    toAmount: string
    txHash: string
    explorerUrl: string
    aggregatorId?: string
}

interface SwapHistoryResponse {
    transactions: any[]
    next_cursor: string | null
    has_more: boolean
}

/**
 * Get network name for HashScan URLs
 */
function getNetworkName(): string {
    if (typeof window !== 'undefined') {
        const network = localStorage.getItem('hedera_network')
        if (network) {
            return network
        }
    }
    return process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'
}

/**
 * Get HashScan explorer URL based on network
 */
function getExplorerUrl(txHash: string): string {
    const network = getNetworkName()
    return `https://hashscan.io/${network}/transaction/${txHash}`
}

/**
 * Fetch a single page of swap history
 */
async function fetchSwapHistoryPage(
    walletAddress: string,
    cursor?: string
): Promise<SwapHistoryResponse> {
    const routerConfig = getActiveRouter()
    if (!routerConfig) {
        throw new Error('No active router configured')
    }

    const contractId = routerConfig.hederaId
    let url = `/api/swap-history?contractId=${contractId}&walletAddress=${walletAddress}`

    if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`
    }

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('Failed to fetch swap history')
    }

    return response.json()
}

/**
 * Transform API response to SwapHistoryItem format
 */
function transformTransaction(tx: any): SwapHistoryItem {
    // Parse timestamp (format: "1234567890.123456789")
    const timestamp = parseFloat(tx.consensus_timestamp) * 1000

    return {
        timestamp,
        fromToken: tx.token_from,
        toToken: tx.token_to,
        fromAmount: tx.amount_from,
        toAmount: tx.amount_to,
        txHash: tx.transaction_id,
        explorerUrl: getExplorerUrl(tx.transaction_id),
    }
}

/**
 * Hook to fetch paginated swap history for a wallet address
 */
export function useSwapHistory(walletAddress: string | null) {
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['swapHistory', walletAddress],
        queryFn: ({ pageParam }) => {
            if (!walletAddress) {
                return {
                    transactions: [],
                    next_cursor: null,
                    has_more: false,
                }
            }
            return fetchSwapHistoryPage(walletAddress, pageParam)
        },
        getNextPageParam: (lastPage) => {
            return lastPage.has_more ? lastPage.next_cursor : undefined
        },
        initialPageParam: undefined as string | undefined,
        enabled: !!walletAddress,
        staleTime: 10 * 60 * 1000, // 10 minutes - swap history doesn't change frequently
        gcTime: 30 * 60 * 1000, // 30 minutes cache
        refetchOnWindowFocus: false,
    })

    // Flatten all pages into a single history array
    const history = useMemo(() => {
        if (!data?.pages) return []

        return data.pages.flatMap((page) =>
            page.transactions.map(transformTransaction)
        )
    }, [data])

    return {
        history,
        isLoading,
        isFetching,
        error: error ? 'Failed to load swap history' : null,
        hasMore: hasNextPage,
        loadMore: fetchNextPage,
        isLoadingMore: isFetchingNextPage,
        refresh: refetch,
    }
}
