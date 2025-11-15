/**
 * SwapHistory Component
 *
 * Displays the swap transaction history for the connected wallet.
 * Shows token pairs, amounts, timestamps, and links to HashScan explorer.
 * This is the inline version (not a dialog).
 */

'use client'

import { memo, useMemo } from 'react'
import { useSwapHistory } from '@/hooks/useSwapHistory'
import { useTokens } from '@/hooks/useTokens'
import { ExternalLink, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface SwapHistoryProps {
    walletAddress: string | null
    onClose: () => void
}

export const SwapHistory = memo(function SwapHistory({
    walletAddress,
    onClose,
}: SwapHistoryProps) {
    const { history, isLoading, error, hasMore, loadMore, isLoadingMore } =
        useSwapHistory(walletAddress)
    const { data: tokens } = useTokens()

    // Create a map of token addresses to token objects for quick lookup
    const tokenMap = useMemo(() => {
        const map = new Map()
        if (tokens) {
            tokens.forEach((token) => {
                if (token.address) {
                    map.set(token.address, token)
                }

                // HBAR is identified by empty address
                if (
                    token.address === '' ||
                    token.address === null ||
                    token.address === undefined
                ) {
                    map.set('HBAR', token)
                    map.set('', token)
                    map.set('0.0.0', token)
                    map.set('0.0.1456986', token) // wHBAR
                }
            })
        }
        return map
    }, [tokens])

    // Helper function to get token info
    const getTokenInfo = (tokenId: string) => {
        if (
            !tokenId ||
            tokenId === '' ||
            tokenId === 'HBAR' ||
            tokenId === '0.0.0' ||
            tokenId === '0.0.1456986'
        ) {
            return tokenMap.get('HBAR')
        }
        return tokenMap.get(tokenId)
    }

    // Helper function to format timestamp
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Helper function to format amount
    const formatAmount = (amount: string, decimals: number = 8) => {
        try {
            const num = parseFloat(amount) / Math.pow(10, decimals)
            return num.toLocaleString('es-ES', {
                maximumFractionDigits: 6,
                minimumFractionDigits: 2,
            })
        } catch {
            return '0.00'
        }
    }

    return (
        <div className='w-full'>
            <div className='bg-neutral-900 rounded-3xl p-6 min-h-[420px] flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={onClose}
                            className='p-2 rounded-lg hover:bg-neutral-700 text-white/70 hover:text-white transition-all'
                            aria-label='Back'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <h1 className='text-2xl font-bold text-white'>Swap History</h1>
                    </div>
                </div>

            {/* Content */}
            <div className='space-y-4'>
                {/* Loading State */}
                {isLoading && (
                    <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                        <Loader2 className='w-8 h-8 text-purple-400 animate-spin' />
                        <p className='text-neutral-400 text-sm'>
                            Loading history...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                        <div className='bg-red-500/10 rounded-full p-3'>
                            <AlertCircle className='w-6 h-6 text-red-400' />
                        </div>
                        <p className='text-red-400 text-sm text-center'>
                            {error}
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading &&
                    !error &&
                    history.length === 0 &&
                    walletAddress && (
                        <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                            <div className='bg-neutral-800 rounded-full p-4'>
                                <ArrowRight className='w-8 h-8 text-neutral-600' />
                            </div>
                            <p className='text-neutral-400 text-center'>
                                No transactions found
                            </p>
                        </div>
                    )}

                {/* No Wallet Connected */}
                {!walletAddress && (
                    <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                        <div className='bg-neutral-800 rounded-full p-4'>
                            <AlertCircle className='w-8 h-8 text-neutral-600' />
                        </div>
                        <p className='text-neutral-400 text-center'>
                            Connect your wallet to view history
                        </p>
                    </div>
                )}

                {/* History List - Fixed height to show exactly 3 transactions */}
                {!isLoading && !error && history.length > 0 && (
                    <div className='space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800'>
                        {history.map((swap, index) => {
                            const fromToken = getTokenInfo(swap.fromToken)
                            const toToken = getTokenInfo(swap.toToken)

                            return (
                                <div
                                    key={`${swap.txHash}-${index}`}
                                    className='bg-neutral-800/50 rounded-xl p-4 hover:bg-neutral-800 transition-all border border-neutral-700/50'
                                >
                                    {/* Transaction Header */}
                                    <div className='flex items-center justify-between mb-3'>
                                        <span className='text-sm text-neutral-400'>
                                            {formatDate(swap.timestamp)}
                                        </span>
                                        <a
                                            href={swap.explorerUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors'
                                        >
                                            View on HashScan
                                            <ExternalLink className='w-3.5 h-3.5' />
                                        </a>
                                    </div>

                                    {/* Token Swap Details */}
                                    <div className='flex items-center justify-between gap-4'>
                                        {/* From Token */}
                                        <div className='flex items-center gap-3 flex-1'>
                                            {fromToken?.icon ? (
                                                <Image
                                                    src={fromToken.icon}
                                                    alt={fromToken.symbol}
                                                    width={32}
                                                    height={32}
                                                    className='rounded-full'
                                                />
                                            ) : (
                                                <div className='w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs'>
                                                    {fromToken?.symbol?.slice(
                                                        0,
                                                        2
                                                    ) || '?'}
                                                </div>
                                            )}
                                            <div className='flex flex-col'>
                                                <span className='font-semibold'>
                                                    {fromToken?.symbol ||
                                                        'Unknown'}
                                                </span>
                                                <span className='text-sm text-neutral-400'>
                                                    {formatAmount(
                                                        swap.fromAmount,
                                                        fromToken?.decimals || 8
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ArrowRight className='w-5 h-5 text-neutral-500 shrink-0' />

                                        {/* To Token */}
                                        <div className='flex items-center gap-3 flex-1 justify-end'>
                                            <div className='flex flex-col items-end'>
                                                <span className='font-semibold'>
                                                    {toToken?.symbol ||
                                                        'Unknown'}
                                                </span>
                                                <span className='text-sm text-neutral-400'>
                                                    {formatAmount(
                                                        swap.toAmount,
                                                        toToken?.decimals || 8
                                                    )}
                                                </span>
                                            </div>
                                            {toToken?.icon ? (
                                                <Image
                                                    src={toToken.icon}
                                                    alt={toToken.symbol}
                                                    width={32}
                                                    height={32}
                                                    className='rounded-full'
                                                />
                                            ) : (
                                                <div className='w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs'>
                                                    {toToken?.symbol?.slice(
                                                        0,
                                                        2
                                                    ) || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Load More Button - inside scroll container */}
                        {hasMore && (
                            <button
                                onClick={() => loadMore()}
                                disabled={isLoadingMore}
                                className='w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 mt-3'
                            >
                                {isLoadingMore ? (
                                    <>
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                        Loading more...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
            </div>
        </div>
    )
})
