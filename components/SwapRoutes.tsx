/**
 * Swap Routes Component
 *
 * Displays available swap routes with price impact, gas estimates, and time estimates.
 * Optimized with React.memo and useCallback to prevent unnecessary re-renders.
 */

'use client'

import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Token } from '@/types/token'
import { SwapRoute } from '@/types/route'
import { useSwapRoutes } from '@/hooks/useSwapRoutes'
import { useTokenPricesContext } from '@/contexts/TokenPricesProvider'
import { useTokens } from '@/hooks/useTokens'
import { Fuel, ArrowRight, ChevronDown } from 'lucide-react'
import { RouteCardSkeleton } from './RouteCardSkeleton'
import { CountdownRing } from './CountdownRing'

interface SwapRoutesProps {
    fromToken: Token | null
    toToken: Token | null
    amount: string
    balance?: string // Balance of the from token in raw units
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
    const costInHbar = gasEstimate * approxCost1Gas * (1 / hbarPrice)

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
    balance,
    slippageTolerance,
    autoSlippage,
    onRouteSelect,
}: SwapRoutesProps) {
    const queryClient = useQueryClient()
    const {
        data: routes,
        isLoading,
        isRefetching,
        error,
    } = useSwapRoutes(
        fromToken,
        toToken,
        amount,
        balance,
        slippageTolerance,
        autoSlippage
    )
    const { prices } = useTokenPricesContext()
    const { data: allTokens } = useTokens()
    const [selectedRoute, setSelectedRoute] = useState<number>(0)
    const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set())
    
    // Track previous params to detect changes
    const prevParamsRef = useRef({
        fromToken: fromToken?.address,
        toToken: toToken?.address,
        amount,
        slippageTolerance,
    })
    
    // State to trigger countdown reset
    const [countdownKey, setCountdownKey] = useState(0)

    // Filter routes: if auto mode is enabled, show only the best route (first one)
    const displayRoutes =
        autoSlippage && routes && routes.length > 0 ? [routes[0]] : routes

    // Log refetching state changes
    useEffect(() => {
        if (isRefetching) {
            console.log('🔄 Routes refetching started...')
        } else if (!isLoading) {
            console.log('✅ Routes refetch completed')
        }
    }, [isRefetching, isLoading])

    // Reset countdown when params change
    useEffect(() => {
        const currentParams = {
            fromToken: fromToken?.address,
            toToken: toToken?.address,
            amount,
            slippageTolerance,
        }
        
        const prevParams = prevParamsRef.current
        
        // Check if any param changed
        if (
            prevParams.fromToken !== currentParams.fromToken ||
            prevParams.toToken !== currentParams.toToken ||
            prevParams.amount !== currentParams.amount ||
            prevParams.slippageTolerance !== currentParams.slippageTolerance
        ) {
            console.log('🔄 Swap params changed - resetting countdown timer')
            console.log('  Previous:', prevParams)
            console.log('  Current:', currentParams)
            
            // Reset countdown by changing the key
            setCountdownKey((prev) => prev + 1)
            prevParamsRef.current = currentParams
        }
    }, [fromToken?.address, toToken?.address, amount, slippageTolerance])
    
    // Handle countdown complete - refetch routes
    const handleCountdownComplete = useCallback(() => {
        if (fromToken && toToken && amount) {
            console.log('⏰ Countdown complete - triggering route refetch')
            console.log('  Params:', {
                fromToken: fromToken.symbol,
                toToken: toToken.symbol,
                amount,
                slippageTolerance,
                autoSlippage,
            })
            
            queryClient.refetchQueries({
                queryKey: [
                    'swapRoutes',
                    fromToken?.address,
                    toToken?.address,
                    amount,
                    autoSlippage ? 'auto' : slippageTolerance,
                ],
            })
            
            console.log('✅ Refetch triggered')
            // Reset countdown after refetch
            setCountdownKey((prev) => prev + 1)
        }
    }, [queryClient, fromToken, toToken, amount, slippageTolerance, autoSlippage])

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

    const toggleRouteDetails = useCallback((index: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedRoutes((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(index)) {
                newSet.delete(index)
            } else {
                newSet.add(index)
            }
            return newSet
        })
    }, [])

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
                            return (
                                <div
                                    key={idx}
                                    className='flex items-center gap-1.5 text-xs text-white/60'
                                >
                                    {tokenPath.map((tokenAddress, tokenIdx) => {
                                        const tokenInfo =
                                            getTokenInfo(tokenAddress)
                                        return (
                                            <span
                                                key={tokenIdx}
                                                className='flex items-center gap-1'
                                            >
                                                {tokenIdx > 0 && (
                                                    <ArrowRight className='w-4 h-4' />
                                                )}
                                                <span className='flex items-center gap-1.5 text-white/70 font-medium'>
                                                    <img
                                                        src={tokenInfo.icon || '/NotFound.png'}
                                                        alt={
                                                            tokenInfo.symbol
                                                        }
                                                        className='w-6 h-6 rounded-full'
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

            return (
                <div className='flex items-center gap-2 text-xs'>
                    <div className='flex items-center gap-1.5 text-white/70'>
                        {tokenPath.map((tokenAddress, idx) => {
                            const tokenInfo = getTokenInfo(tokenAddress)
                            return (
                                <span
                                    key={idx}
                                    className='flex items-center gap-1.5'
                                >
                                    {idx > 0 && (
                                        <ArrowRight className='w-4 h-4 text-white/40' />
                                    )}
                                    <span className='flex items-center gap-1.5 font-medium'>
                                        <img
                                            src={tokenInfo.icon || '/NotFound.png'}
                                            alt={tokenInfo.symbol}
                                            className='w-6 h-6 rounded-full'
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
        <div className='w-full relative'>
            {/* Header */}
            <div className='bg-neutral-900 rounded-t-3xl p-6 pb-4'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-2xl font-bold text-white'>Receive</h2>
                    <div className='flex items-center gap-3'>
                        {/* Countdown Ring - only show when routes are loaded and not initially loading */}
                        {!isLoading && routes && routes.length > 0 && (
                            <CountdownRing
                                key={countdownKey}
                                duration={30000}
                                isRefetching={isRefetching}
                                onComplete={handleCountdownComplete}
                            />
                        )}
                        {/* Loading spinner during initial load */}
                        {isLoading && (
                            <div className='animate-spin rounded-full border-b-2 border-blue-500' style={{ width: 28, height: 28 }}></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Routes Container */}
            <div className='bg-neutral-900 rounded-b-3xl p-6 pt-2 space-y-3 max-h-[600px] overflow-y-auto'>
                {(isLoading || isRefetching) && (
                    <>
                        {[1, 2, 3].map((i) => (
                            <RouteCardSkeleton key={i} showBadge={i === 1} />
                        ))}
                    </>
                )}

                {error && !isLoading && !isRefetching && (
                    <div className='text-red-400 text-sm text-center py-4'>
                        {error instanceof Error
                            ? error.message
                            : 'Failed to load routes'}
                    </div>
                )}

                {!isLoading &&
                    !isRefetching &&
                    !error &&
                    (!displayRoutes || displayRoutes.length === 0) && (
                        <div className='text-white/60 text-sm text-center py-4'>
                            No routes available
                        </div>
                    )}

                {!isLoading &&
                    !isRefetching &&
                    fromToken &&
                    toToken &&
                    displayRoutes &&
                    displayRoutes.map((route: SwapRoute, index: number) => {
                        const isBestRoute = index === 0
                        const isSelected = index === selectedRoute

                        // Format aggregator display
                        const routeNames = formatRouteName(route.aggregatorId)

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

                                {/* High Price Impact Warning - Only for negative impact */}
                                {route.priceImpact < -10 && (
                                    <div className='mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30'>
                                        <div className='flex items-start gap-2'>
                                            <span className='text-yellow-500 text-lg'>⚠️</span>
                                            <div className='flex-1'>
                                                <div className='text-yellow-500 text-xs font-semibold mb-1'>
                                                    High Price Impact Warning
                                                </div>
                                                <div className='text-yellow-500/90 text-xs'>
                                                    This swap has a negative price impact of {Math.abs(route.priceImpact).toFixed(2)}%.
                                                    {route.priceImpact < -15 && ' This is extremely high and may result in significant loss.'}
                                                    {route.priceImpact >= -15 && ' Consider splitting this into smaller trades or waiting for better liquidity.'}
                                                </div>
                                            </div>
                                        </div>
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
                                    {/* Toggle Details Arrow */}
                                    <button
                                        onClick={(e) => toggleRouteDetails(index, e)}
                                        className='text-white/70 hover:text-white transition-all p-1 rounded-full bg-white/10 hover:bg-white/15'
                                    >
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                expandedRoutes.has(index) ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Collapsible Details */}
                                <div
                                    className={`overflow-hidden transition-all duration-600 ease-in-out ${
                                        expandedRoutes.has(index)
                                            ? 'max-h-96'
                                            : 'max-h-0'
                                    }`}
                                >
                                    {/* Swap Route Path */}
                                    {route.route && (
                                        <div className='mt-1 pt-1'>
                                            {renderSwapPath(route)}
                                        </div>
                                    )}

                                    {/* Minimum Receive */}
                                    <div className='mt-1 pt-1'>
                                        <div className='flex items-center justify-start text-sm'>
                                            <span className='text-white/50'>
                                                Min. receive: 
                                            </span>
                                            <span className='text-white font-medium ml-1'>
                                                {calculateMinimumReceive(
                                                    route.outputAmountFormatted,
                                                    slippageTolerance,
                                                    toToken.decimals
                                                )}{' '}
                                                {toToken.symbol}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Exchange Summary and Gas/Time */}
                                <div className='flex items-end justify-between text-sm mt-2'>
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
                            </div>
                        )
                    })}
            </div>
        </div>
    )
})
