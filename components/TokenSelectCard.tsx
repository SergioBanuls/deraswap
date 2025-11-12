/**
 * Token Select Card Component
 *
 * Card interface for selecting tokens for swap.
 * Matches the SettingsCard styling and positioning.
 *
 * Performance optimizations:
 * - Virtual scrolling: only renders visible items
 * - Memoized row components
 * - Optimized sorting and filtering
 */

'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Token } from '@/types/token'
import { useTokens } from '@/hooks/useTokens'
import { useTokenPrice } from '@/hooks/useTokenPrice'
import { useTokenPricesContext } from '@/contexts/TokenPricesProvider'
import { useVirtualScroll } from '@/hooks/useVirtualScroll'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface TokenSelectCardProps {
    label: 'From' | 'To'
    onSelectToken: (token: Token) => void
    onBack: () => void
    balances: Record<string, string>
    account: string | null
}

function formatBalance(balance: string, decimals: number): string {
    const num = Number(balance) / Math.pow(10, decimals)

    // Format with appropriate decimal places
    if (num === 0) return '0'
    if (num < 0.01) return parseFloat(num.toFixed(6)).toString()
    if (num < 1) return parseFloat(num.toFixed(4)).toString()
    if (num < 1000) return parseFloat(num.toFixed(4)).toString()

    // For larger numbers, use compact notation
    if (num >= 1_000_000) {
        return parseFloat((num / 1_000_000).toFixed(2)).toString() + 'M'
    }
    if (num >= 1_000) {
        return parseFloat((num / 1_000).toFixed(2)).toString() + 'K'
    }

    return parseFloat(num.toFixed(4)).toString()
}

/**
 * Component for displaying a single token row with live price
 * Memoized to prevent unnecessary re-renders
 */
interface TokenRowProps {
    token: Token
    balance: string | null
    account: string | null
    onClick: () => void
}

const TokenRow = memo(function TokenRow({
    token,
    balance,
    account,
    onClick,
}: TokenRowProps) {
    // Get price from cache (already loaded at app start)
    const currentPrice = useTokenPrice(
        token.address || null,
        token.priceUsd || 0
    )
    const { isLoading: pricesLoading } = useTokenPricesContext()

    return (
        <button
            onClick={onClick}
            className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group'
        >
            <div className='relative w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0'>
                <Image
                    src={token?.icon || '/NotFound.png'}
                    alt={token.symbol}
                    fill
                    className='object-cover'
                    unoptimized
                />
            </div>
            <div className='flex flex-col items-start flex-1 min-w-0'>
                <span className='text-white font-semibold'>{token.symbol}</span>
                <span className='text-white/50 text-sm'>{token.name}</span>
            </div>
            <div className='flex flex-col items-end shrink-0 min-w-[80px]'>
                {balance && account &&
                    <>
                        <span className='text-white font-semibold'>
                            {balance}
                        </span>
                        {pricesLoading ? (
                            <Skeleton className='h-3 w-16 mt-1' />
                        ) : currentPrice > 0 ? (
                            <span className='text-white/50 text-xs'>
                                ${(currentPrice * Number(balance)).toFixed(4)}
                            </span>
                        ) : null}
                    </>
                }
            </div>
        </button>
    )
})

export function TokenSelectCard({
    label,
    onSelectToken,
    onBack,
    balances,
    account,
}: TokenSelectCardProps) {
    const { data: tokens, isLoading, error } = useTokens()
    const { prices } = useTokenPricesContext()
    const [searchQuery, setSearchQuery] = useState('')

    // Get balance for a token - memoized
    const getTokenBalance = useCallback(
        (token: Token): string | null => {
            const tokenId = token.address || 'HBAR'
            const rawBalance = balances[tokenId]

            if (!rawBalance) return null

            return formatBalance(rawBalance, token.decimals)
        },
        [balances]
    )

    // Get USD value of token balance - memoized
    const getTokenUsdValue = useCallback(
        (token: Token): number => {
            const tokenId = token.address || 'HBAR'
            const rawBalance = balances[tokenId]

            // Use live price from context, fallback to static price
            const tokenPrice = prices?.[tokenId] || token.priceUsd || token.price

            if (!rawBalance || !tokenPrice) return 0

            const numericBalance =
                Number(rawBalance) / Math.pow(10, token.decimals)
            return numericBalance * tokenPrice
        },
        [balances, prices]
    )

    // Format USD value
    const formatUsdValue = (usdValue: number): string => {
        if (usdValue === 0) return '$0.00'
        if (usdValue < 0.01) return '<$0.01'
        if (usdValue < 1) return `$${usdValue.toFixed(2)}`
        if (usdValue < 1000) return `$${usdValue.toFixed(2)}`
        if (usdValue >= 1_000_000) {
            return `$${(usdValue / 1_000_000).toFixed(2)}M`
        }
        if (usdValue >= 1_000) {
            return `$${(usdValue / 1_000).toFixed(2)}K`
        }
        return `$${usdValue.toFixed(2)}`
    }

    // Featured tokens for quick access - memoized
    const featuredTokens = useMemo(() => {
        const featuredTokenIds = ['', '0.0.456858', '0.0.731861'] // HBAR, USDC, SAUCE
        return (tokens || []).filter((token) =>
            featuredTokenIds.includes(token.address)
        )
    }, [tokens])

    // Filtered and sorted tokens - memoized for performance
    const filteredTokens = useMemo(() => {
        if (!tokens) return []

        const query = searchQuery.toLowerCase()

        return tokens
            .filter(
                (token) =>
                    token.symbol.toLowerCase().includes(query) ||
                    token.name.toLowerCase().includes(query)
            )
            .sort((a, b) => {
                const usdValueA = getTokenUsdValue(a)
                const usdValueB = getTokenUsdValue(b)

                // If both have USD values, compare them
                if (usdValueA > 0 && usdValueB > 0) {
                    return usdValueB - usdValueA // Descending order (highest USD value first)
                }

                // Tokens with USD value come before tokens without
                if (usdValueA > 0 && usdValueB === 0) return -1
                if (usdValueA === 0 && usdValueB > 0) return 1

                // For tokens without USD value, check if they have balances
                const tokenIdA = a.address || 'HBAR'
                const tokenIdB = b.address || 'HBAR'
                const balanceA = balances[tokenIdA]
                const balanceB = balances[tokenIdB]

                // Tokens with balance (but no price) come before tokens without balance
                if (balanceA && !balanceB) return -1
                if (!balanceA && balanceB) return 1

                // If neither has balance, maintain original order
                return 0
            })
    }, [tokens, searchQuery, getTokenUsdValue, balances])

    const handleSelectToken = useCallback(
        (token: Token) => {
            onSelectToken(token)
            onBack()
        },
        [onSelectToken, onBack]
    )

    // Virtual scrolling for performance
    const ITEM_HEIGHT = 62 // Height of each token row in pixels
    const CONTAINER_HEIGHT = 400 // Approximate height of scrollable area

    const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
        itemCount: filteredTokens.length,
        itemHeight: ITEM_HEIGHT,
        containerHeight: CONTAINER_HEIGHT,
        overscan: 5,
    })

    return (
        <div className='w-full'>
            <div className='bg-neutral-900 rounded-3xl p-6 h-[620px] flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={onBack}
                            className='p-2 rounded-lg hover:bg-neutral-700 text-white/70 hover:text-white transition-all'
                            aria-label='Back'
                        >
                            <ArrowLeft className='w-5 h-5' />
                        </button>
                        <h1 className='text-2xl font-bold text-white'>
                            Swap {label}
                        </h1>
                    </div>
                </div>

                {/* Search Input */}
                <div className='mb-3'>
                    <input
                        type='text'
                        placeholder='Search by name or symbol...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/30'
                    />
                </div>

                {/* Quick Access Tokens */}
                {!isLoading && featuredTokens.length > 0 && (
                    <div className='flex gap-2 mb-3'>
                        {featuredTokens.map((token) => (
                            <button
                                key={token.address || 'HBAR'}
                                onClick={() => handleSelectToken(token)}
                                className='flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 flex-1'
                            >
                                <div className='relative w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0'>
                                    <Image
                                        src={token.icon}
                                        alt={token.symbol}
                                        fill
                                        className='object-cover'
                                        unoptimized
                                    />
                                </div>
                                <span className='text-sm font-medium text-white'>
                                    {token.symbol}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className='text-center py-8 text-white/70'>
                        Loading tokens...
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className='text-center py-8 text-red-400'>
                        Error:{' '}
                        {error instanceof Error
                            ? error.message
                            : 'Failed to load tokens'}
                    </div>
                )}

                {/* Token List - Virtual scrolling for performance */}
                {!isLoading && !error && (
                    <div
                        ref={containerRef}
                        className='flex-1 overflow-y-auto'
                        style={{ position: 'relative' }}
                    >
                        {filteredTokens.length === 0 ? (
                            <div className='text-center py-8 text-white/70'>
                                No tokens found
                            </div>
                        ) : (
                            <div
                                style={{
                                    height: `${totalHeight}px`,
                                    position: 'relative',
                                }}
                            >
                                {virtualItems.map(({ index, start }) => {
                                    const token = filteredTokens[index]
                                    const balance = getTokenBalance(token)
                                    return (
                                        <div
                                            key={token.address || 'HBAR'}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${ITEM_HEIGHT}px`,
                                                transform: `translateY(${start}px)`,
                                            }}
                                        >
                                            <TokenRow
                                                token={token}
                                                balance={balance}
                                                account={account}
                                                onClick={() =>
                                                    handleSelectToken(token)
                                                }
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
