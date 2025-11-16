/**
 * Swap Routes Component
 *
 * Displays available swap routes with price impact, gas estimates, and time estimates.
 * Optimized with React.memo and useCallback to prevent unnecessary re-renders.
 */

'use client'

import { memo, useState, useCallback, useEffect } from 'react'
import { Token } from '@/types/token'
import { SwapRoute } from '@/types/route'
import { useSwapRoutes } from '@/hooks/useSwapRoutes'
import { useTokenPricesContext } from '@/contexts/TokenPricesProvider'
import { useTokens } from '@/hooks/useTokens'
import { Fuel, ArrowRight } from 'lucide-react'
import { RouteCardSkeleton } from './RouteCardSkeleton'

interface SwapRoutesProps {
    fromToken: Token | null
    toToken: Token | null
    amount: string
    slippageTolerance: number
    autoSlippage?: boolean
    onRouteSelect?: (route: SwapRoute) => void
}

// Helper function to format gas cost
function formatGasCost(
    gasEstimate: number,
    hbarPrice: number = 0
): {
    usd: string | null
    hbar: string
} {
    // Gas cost calculation based on EtaSwap's approach:
    // gasEstimate is the estimated gas units
    // Each gas unit costs approximately 0.000000082 HBAR
    const approxCost1Gas = 0.000000082
    const costInHbar = gasEstimate * approxCost1Gas

    const hbar = `${costInHbar.toFixed(4)} HBAR`

    // Convert to USD if price is available
    if (hbarPrice > 0) {
        const costInDollars = costInHbar * hbarPrice
        const usd =
            costInDollars < 0.01 ? '<$0.01' : `$${costInDollars.toFixed(2)}`
        return { usd, hbar }
    }

    // Only HBAR if no price available
    return { usd: null, hbar }
}

// Helper function to calculate minimum receive with slippage
function calculateMinimumReceive(
    outputAmount: string,
    slippageTolerance: number,
    decimals: number
): string {
    // Parse the output amount (human-readable format)
    const amount = parseFloat(outputAmount)

    // Apply slippage: minReceive = amount * (1 - slippage/100)
    const minReceive = amount * (1 - slippageTolerance / 100)

    // Format with appropriate decimals
    return minReceive.toFixed(Math.min(decimals, 6))
}

export const SwapRoutes = memo(function SwapRoutes({
    fromToken,
    toToken,
    amount,
    slippageTolerance,
    autoSlippage,
    onRouteSelect,
}: SwapRoutesProps) {
    const {
        data: routes,
        isLoading,
        error,
    } = useSwapRoutes(
        fromToken,
        toToken,
        amount,
        undefined,
        slippageTolerance,
        autoSlippage
    )
    const { prices } = useTokenPricesContext()
    const { data: allTokens } = useTokens()
    const [selectedRoute, setSelectedRoute] = useState<number>(0)

    // Filter routes: if auto mode is enabled, show only the best route (first one)
    const displayRoutes =
        autoSlippage && routes && routes.length > 0 ? [routes[0]] : routes

    // Auto-select the first route (cheapest) when routes are loaded
    const handleAutoSelect = useCallback(() => {
        if (routes && routes.length > 0 && onRouteSelect) {
            setSelectedRoute(0)
            onRouteSelect(routes[0])
        }
    }, [routes, onRouteSelect])

    // Call auto-select when routes change
    useEffect(() => {
        handleAutoSelect()
    }, [handleAutoSelect])

    const handleSelectRoute = useCallback(
        (index: number) => {
            setSelectedRoute(index)
            if (onRouteSelect && routes && routes[index]) {
                onRouteSelect(routes[index])
            }
        },
        [onRouteSelect, routes]
    )
    // Helper function to format route names and identify DEX version
    const formatRouteName = (name: string | string[]) => {
        const routes: string[] = []
        const names = Array.isArray(name) ? name : [name]

        names.forEach((e) => {
            if (e === 'SaucerSwapV1_v2') {
                routes.push('SaucerSwap V1')
            } else if (e === 'SaucerSwapV2_EXACT2') {
                routes.push('SaucerSwap V2')
            } else if (e.includes('SaucerSwap')) {
                // Handle any other SaucerSwap variants
                if (e.includes('V1')) routes.push('SaucerSwap V1')
                else if (e.includes('V2')) routes.push('SaucerSwap V2')
                else routes.push('Other')
            } else {
                routes.push('Other')
            }
        })

        return routes
    }

    // Helper function to render route name with icon
    const renderRouteName = (routeNames: string[]) => {
        return (
            <span className='flex items-center gap-1'>
                {routeNames.map((name, idx) => (
                    <span key={idx} className='flex items-center gap-1'>
                        {idx > 0 && <span className='mx-0.5'>+</span>}
                        {name.startsWith('SaucerSwap') && (
                            <img
                                src='/saucer_swap.webp'
                                alt='SaucerSwap'
                                className='w-3 h-3 inline-block'
                            />
                        )}
                        <span>{name}</span>
                    </span>
                ))}
            </span>
        )
    }

    // Helper function to get token info by address
    const getTokenInfo = useCallback(
        (address: string): { symbol: string; icon: string } => {
            if (!allTokens) return { symbol: '???', icon: '' }

            // Handle HBAR special case (address might be '0x0000000000000000000000000000000000000000' or 'HBAR')
            if (
                address === '0x0000000000000000000000000000000000000000' ||
                address === 'HBAR' ||
                address === '0.0.0'
            ) {
                const hbarToken = allTokens.find((t) => t.symbol === 'HBAR')
                return {
                    symbol: 'HBAR',
                    icon: hbarToken?.icon || '/hbar.svg',
                }
            }

            const token = allTokens.find(
                (t) =>
                    t.solidityAddress?.toLowerCase() ===
                        address.toLowerCase() || t.address === address
            )
            return {
                symbol: token?.symbol || address.substring(0, 6),
                icon: token?.icon || '',
            }
        },
        [allTokens]
    )

    // Helper function to parse and display swap route path
    const renderSwapPath = useCallback(
        (swapRoute: SwapRoute) => {
            if (!swapRoute.route) return null

            // route can be string[] or string[][]
            // For single route: ['0x...', '0x...', '0x...']
            // For split routes: [['0x...', '0x...'], ['0x...', '0x...']]
            const routes = Array.isArray(swapRoute.route[0])
                ? (swapRoute.route as string[][])
                : [swapRoute.route as string[]]

            // For split swaps, show multiple paths
            if (routes.length > 1) {
                return (
                    <div className='space-y-1'>
                        {routes.map((tokenPath, idx) => {
                            const steps = tokenPath.length - 1
                            return (
                                <div
                                    key={idx}
                                    className='flex items-center gap-1.5 text-xs text-white/60'
                                >
                                    <span className='text-white/40'>
                                        Route {idx + 1} ({steps}{' '}
                                        {steps === 1 ? 'hop' : 'hops'}):
                                    </span>
                                    {tokenPath.map((tokenAddress, tokenIdx) => {
                                        const tokenInfo =
                                            getTokenInfo(tokenAddress)
                                        return (
                                            <span
                                                key={tokenIdx}
                                                className='flex items-center gap-1'
                                            >
                                                {tokenIdx > 0 && (
                                                    <ArrowRight className='w-3 h-3' />
                                                )}
                                                <span className='flex items-center gap-1 text-white/70 font-medium'>
                                                    <img
                                                        src={tokenInfo.icon || '/NotFound.png'}
                                                        alt={
                                                            tokenInfo.symbol
                                                        }
                                                        className='w-4 h-4 rounded-full'
                                                    />
                                                    <span>
                                                        {tokenInfo.symbol}
                                                    </span>
                                                </span>
                                            </span>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                )
            }

            // Single path (direct or multi-hop)
            const tokenPath = routes[0]
            const steps = tokenPath.length - 1

            return (
                <div className='flex items-center gap-2 text-xs'>
                    <span className='text-white/50'>
                        {steps === 1
                            ? 'Direct swap'
                            : `${steps} ${steps === 1 ? 'hop' : 'hops'}`}
                        :
                    </span>
                    <div className='flex items-center gap-1.5 text-white/70'>
                        {tokenPath.map((tokenAddress, idx) => {
                            const tokenInfo = getTokenInfo(tokenAddress)
                            return (
                                <span
                                    key={idx}
                                    className='flex items-center gap-1.5'
                                >
                                    {idx > 0 && (
                                        <ArrowRight className='w-3 h-3 text-white/40' />
                                    )}
                                    <span className='flex items-center gap-1 font-medium'>
                                        <img
                                            src={tokenInfo.icon || '/NotFound.png'}
                                            alt={tokenInfo.symbol}
                                            className='w-4 h-4 rounded-full'
                                        />
                                        <span>{tokenInfo.symbol}</span>
                                    </span>
                                </span>
                            )
                        })}
                    </div>
                </div>
            )
        },
        [getTokenInfo]
    )

    return (
        <div className='w-full'>
            {/* Header */}
            <div className='bg-neutral-900 rounded-t-3xl p-6 pb-4'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-2xl font-bold text-white'>Receive</h2>
                    {isLoading && (
                        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
                    )}
                </div>
            </div>

            {/* Routes Container */}
            <div className='bg-neutral-900 rounded-b-3xl p-6 pt-2 space-y-3 max-h-[600px] overflow-y-auto'>
                {isLoading && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <RouteCardSkeleton key={i} showBadge={i === 1} />
                        ))}
                    </>
                )}

                {error && !isLoading && (
                    <div className='text-red-400 text-sm text-center py-4'>
                        {error instanceof Error
                            ? error.message
                            : 'Failed to load routes'}
                    </div>
                )}

                {!isLoading &&
                    !error &&
                    (!displayRoutes || displayRoutes.length === 0) && (
                        <div className='text-white/60 text-sm text-center py-4'>
                            No routes available
                        </div>
                    )}

                {!isLoading &&
                    fromToken &&
                    toToken &&
                    displayRoutes &&
                    displayRoutes.map((route: SwapRoute, index: number) => {
                        const isBestRoute = index === 0
                        const isSelected = index === selectedRoute

                        // Format aggregator display
                        const routeNames = formatRouteName(route.aggregatorId)

                        // Format transaction type for display
                        const txTypeDisplay =
                            route.transactionType === 'SPLIT_SWAP'
                                ? 'Split Swap'
                                : route.transactionType === 'INDIRECT_SWAP'
                                ? 'Multi-hop'
                                : 'Direct Swap'

                        return (
                            <div
                                key={`${route.transactionType}-${index}`}
                                onClick={() => handleSelectRoute(index)}
                                className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
                                    isSelected
                                        ? 'ring-1 ring-blue-500 bg-blue-950/70 border-blue-500/50'
                                        : 'bg-neutral-800/50 border-transparent hover:bg-neutral-800/70 hover:border-neutral-700'
                                }`}
                            >
                                {/* Badge */}
                                {isBestRoute && (
                                    <div className='inline-block bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3'>
                                        Best Return
                                    </div>
                                )}

                                {/* Token Icon and Output Amount */}
                                <div className='flex items-start justify-between mb-3'>
                                    <div className='flex items-center gap-3'>
                                        <div className='relative'>
                                            <img
                                                src={toToken.icon || '/NotFound.png'}
                                                alt={toToken.symbol}
                                                className='w-10 h-10 rounded-full'
                                            />
                                        </div>
                                        <div>
                                            <div className='text-2xl font-bold text-white'>
                                                {route.outputAmountFormatted}
                                            </div>
                                            <div className='flex items-center gap-1 text-sm text-white/60'>
                                                {/* USD Value */}
                                                <span>
                                                    $
                                                    {(
                                                        parseFloat(
                                                            route.outputAmountFormatted
                                                        ) *
                                                        (prices?.[
                                                            toToken.address ||
                                                                'HBAR'
                                                        ] || 0)
                                                    ).toFixed(2)}
                                                </span>
                                                <span>•</span>
                                                {/* Slippage with color coding */}
                                                <span
                                                    className={
                                                        route.priceImpact === 0
                                                            ? 'text-white/60'
                                                            : route.priceImpact <
                                                              0
                                                            ? 'text-red-400'
                                                            : 'text-green-400'
                                                    }
                                                >
                                                    {route.priceImpact > 0
                                                        ? '+'
                                                        : ''}
                                                    {route.priceImpact.toFixed(
                                                        2
                                                    )}
                                                    %
                                                </span>
                                                <span>•</span>
                                                {/* Route Information */}
                                                {renderRouteName(routeNames)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Exchange Summary and Gas/Time */}
                                <div className='flex items-end justify-between text-sm'>
                                    <div className='text-white/50'>
                                        1 {fromToken.symbol} ≈{' '}
                                        {(
                                            parseFloat(
                                                route.outputAmountFormatted
                                            ) / parseFloat(amount)
                                        ).toFixed(6)}{' '}
                                        {toToken.symbol}
                                    </div>
                                    <div className='flex items-center gap-4'>
                                        {(() => {
                                            const gasCost = formatGasCost(
                                                route.gasEstimate,
                                                prices?.['HBAR'] || 0
                                            )
                                            return (
                                                <div className='flex flex-col items-end text-white/60'>
                                                    <div className='flex items-center gap-1.5'>
                                                        <Fuel className='w-4 h-4' />
                                                        <span className='text-sm'>
                                                            {gasCost.usd ||
                                                                gasCost.hbar}
                                                        </span>
                                                    </div>
                                                    {gasCost.usd && (
                                                        <span className='text-xs text-white/40'>
                                                            {gasCost.hbar}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>

                                {/* Swap Route Path */}
                                {route.route && (
                                    <div className='mt-3 pt-3 border-t border-white/10'>
                                        {renderSwapPath(route)}
                                    </div>
                                )}

                                {/* Minimum Receive */}
                                <div className='mt-3 pt-3 border-t border-white/10'>
                                    <div className='flex items-center justify-between text-sm'>
                                        <span className='text-white/50'>
                                            Min. receive
                                        </span>
                                        <span className='text-white font-medium'>
                                            {calculateMinimumReceive(
                                                route.outputAmountFormatted,
                                                slippageTolerance,
                                                toToken.decimals
                                            )}{' '}
                                            {toToken.symbol}
                                        </span>
                                    </div>
                                    <div className='text-xs text-white/40 mt-1 text-right'>
                                        With {slippageTolerance.toFixed(2)}%
                                        slippage tolerance
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
})
