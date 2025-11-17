/**
 * Hook for fetching swap routes from ETASwap API
 *
 * Uses TanStack Query for intelligent caching and deduplication.
 * Validates inputs before making API calls to prevent overflow/underflow.
 * Routes are cached for 30 seconds and deduplicated within 5 seconds.
 *
 * @param fromToken - Source token
 * @param toToken - Destination token
 * @param amount - Amount to swap (human-readable format)
 * @param balance - Optional user balance for validation
 * @returns {Object} - TanStack Query result with routes data
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TokenId } from '@hashgraph/sdk'
import axios from 'axios'
import { Token } from '@/types/token'
import { SwapRoute } from '@/types/route'
import { validateAmount, formatAmount } from '@/utils/amountValidation'
import {
    filterValidRoutes,
    DEFAULT_ROUTE_CONFIG,
} from '@/utils/routeValidation'

const ETASWAP_API_BASE_URL = 'https://api.etaswap.com/v1'
const WHBAR_TOKEN_ID = '0.0.1456986'
const USDC_TOKEN_ID = '0.0.456858' // USDC - most liquid stablecoin

interface FetchRoutesParams {
    fromToken: Token
    toToken: Token
    amount: string
    balance?: string
    slippageTolerance?: number
    prices?: Record<string, number>
    isAutoMode?: boolean
}

/**
 * Try to find a route via USDC as intermediary token
 * Returns a synthetic route that represents: fromToken → USDC → toToken
 */
async function tryRouteViaUSDC(
    fromToken: Token,
    toToken: Token,
    inputAmount: string
): Promise<SwapRoute[] | null> {
    // Don't try if either token is USDC itself
    if (
        fromToken.address === USDC_TOKEN_ID ||
        toToken.address === USDC_TOKEN_ID
    ) {
        return null
    }

    try {
        // Use solidity addresses from token objects
        const fromTokenAddress = fromToken.solidityAddress
        const toTokenAddress = toToken.solidityAddress
        const usdcAddress =
            '0x' + TokenId.fromString(USDC_TOKEN_ID).toSolidityAddress()

        // Step 1: Get route from fromToken → USDC
        console.log(`  📍 Step 1: ${fromToken.symbol} → USDC`)
        const step1Response = await axios.get(`${ETASWAP_API_BASE_URL}/rates`, {
            params: {
                tokenFrom: fromTokenAddress,
                tokenTo: usdcAddress,
                amount: inputAmount,
                isReverse: false,
            },
        })

        const step1Routes =
            step1Response.data?.filter(
                (r: any) => r.aggregatorId === 'SaucerSwapV2'
            ) || []
        if (step1Routes.length === 0) {
            console.log('  ❌ No V2 route for step 1')
            return null
        }

        // Use the best route from step 1
        const step1Route = step1Routes[0]
        const usdcAmount = Array.isArray(step1Route.amountTo)
            ? step1Route.amountTo.reduce(
                  (sum: string, amt: string) =>
                      (BigInt(sum) + BigInt(amt)).toString(),
                  '0'
              )
            : step1Route.amountTo

        // Step 2: Get route from USDC → toToken
        console.log(
            `  📍 Step 2: USDC → ${toToken.symbol} (amount: ${usdcAmount})`
        )
        const step2Response = await axios.get(`${ETASWAP_API_BASE_URL}/rates`, {
            params: {
                tokenFrom: usdcAddress,
                tokenTo: toTokenAddress,
                amount: usdcAmount,
                isReverse: false,
            },
        })

        const step2Routes =
            step2Response.data?.filter(
                (r: any) => r.aggregatorId === 'SaucerSwapV2'
            ) || []
        if (step2Routes.length === 0) {
            console.log('  ❌ No V2 route for step 2')
            return null
        }

        console.log(
            `  ✅ Found 2-step route: ${fromToken.symbol} → USDC → ${toToken.symbol}`
        )

        // Return note: For now, we just inform the user
        // TODO: Implement actual 2-step swap execution
        console.warn(
            '⚠️  2-step swaps not yet implemented. Please swap manually:'
        )
        console.warn(`   1. ${fromToken.symbol} → USDC`)
        console.warn(`   2. USDC → ${toToken.symbol}`)

        return null // Don't return route yet, need to implement execution first
    } catch (error) {
        console.error('Error trying route via USDC:', error)
        return null
    }
}

async function fetchSwapRoutes({
    fromToken,
    toToken,
    amount,
    balance,
    slippageTolerance,
    prices,
    isAutoMode,
}: FetchRoutesParams): Promise<SwapRoute[]> {
    // Validate amount before making API call
    const validation = validateAmount(amount, fromToken.decimals, balance)
    if (!validation.valid) {
        throw new Error(validation.error || 'Invalid amount')
    }

    // Use validated/sanitized amount
    const inputAmount = validation.sanitized!

    // Use solidity addresses directly from token objects
    // Etaswap API provides solidityAddress for all tokens (HBAR is 0x0...0)
    const tokenFromAddress = fromToken.solidityAddress
    const tokenToAddress = toToken.solidityAddress

    // Fetch routes from ETASwap API
    const url = `${ETASWAP_API_BASE_URL}/rates`
    const params = {
        tokenFrom: tokenFromAddress,
        tokenTo: tokenToAddress,
        amount: inputAmount,
        isReverse: false,
    }

    console.log('ETASwap API request:', { url, params })

    const response = await axios.get(url, { params })
    const etaRoutes = response.data

    console.log(`ETASwap returned ${etaRoutes?.length || 0} routes`)

    if (!Array.isArray(etaRoutes)) {
        throw new Error('Invalid response format from ETASwap API')
    }

    if (etaRoutes.length === 0) {
        console.warn('No routes found from ETASwap')
        return []
    }

    // All fixes applied: WHBAR address, fee handling via wrap
    // Debug: Ver qué aggregators devuelve ETASwap
    const aggregators = etaRoutes.map((r: any) => r.aggregatorId)
    console.log('Available aggregators from ETASwap:', [
        ...new Set(aggregators),
    ])

    // Accept BOTH V1 and V2 routes (we have adapters for both)
    let saucerRoutes = etaRoutes.filter(
        (route: any) =>
            route.aggregatorId === 'SaucerSwapV2' ||
            route.aggregatorId === 'SaucerSwapV1'
    )

    // Map to our registered adapter names
    saucerRoutes.forEach((route: any) => {
        if (route.aggregatorId === 'SaucerSwapV2') {
            route.aggregatorId = 'SaucerSwapV2_EXACT2'
        } else if (route.aggregatorId === 'SaucerSwapV1') {
            route.aggregatorId = 'SaucerSwapV1_v2'
        }
    })

    console.log(
        `Filtered to SaucerSwap routes: ${saucerRoutes.length}/${etaRoutes.length} routes (V1 + V2)`
    )

    if (saucerRoutes.length === 0) {
        console.warn(
            'No SaucerSwap routes available. ETASwap returned other DEXs or mixed routes.'
        )
        console.warn(
            'Available routes:',
            etaRoutes.map((r: any) => ({
                aggregator: r.aggregatorId,
                pools: r.pools?.length,
            }))
        )

        // Try to find route via USDC as intermediary
        console.log('🔄 Attempting to find route via USDC...')
        const alternativeRoute = await tryRouteViaUSDC(
            fromToken,
            toToken,
            inputAmount
        )

        if (alternativeRoute) {
            console.log('✅ Found alternative route via USDC')
            return alternativeRoute
        }

        throw new Error(
            'No compatible routes found. Try swapping in 2 steps: ' +
                fromToken.symbol +
                ' → USDC → ' +
                toToken.symbol
        )
    }

    // Process routes and add computed fields
    const processedRoutes: SwapRoute[] = saucerRoutes.map((route: any) => {
        // Debug: Log route structure to understand path format
        console.log('Route from ETASwap:', {
            transactionType: route.transactionType,
            aggregatorId: route.aggregatorId,
            path: route.path,
            route: route.route,
            routeDetails: JSON.stringify(route.route),
            pools: route.pools,
        })

        // Calculate total output amount
        let totalAmountTo: string
        if (Array.isArray(route.amountTo)) {
            // Sum up all amounts for split swaps
            totalAmountTo = route.amountTo.reduce(
                (sum: string, amt: string) =>
                    (BigInt(sum) + BigInt(amt)).toString(),
                '0'
            )
        } else {
            totalAmountTo = route.amountTo
        }

        // Format output amount
        const outputAmountFormatted = formatAmount(
            totalAmountTo,
            toToken.decimals
        )

        // Calculate price impact using USD values from prices parameter
        // Price impact = (actualValue - expectedValue) / expectedValue * 100
        const inputAmountHuman = parseFloat(
            formatAmount(inputAmount, fromToken.decimals)
        )
        const outputAmountHuman = parseFloat(outputAmountFormatted)

        // Get prices from the prices map
        const fromTokenPrice = prices?.[fromToken.address || 'HBAR'] || 0
        const toTokenPrice = prices?.[toToken.address || 'HBAR'] || 0

        const expectedValueUSD = inputAmountHuman * fromTokenPrice
        const actualValueUSD = outputAmountHuman * toTokenPrice

        // Debug logging for price impact calculation
        console.log('Price Impact Debug:', {
            inputAmountHuman,
            outputAmountHuman,
            fromTokenPrice,
            toTokenPrice,
            expectedValueUSD,
            actualValueUSD,
            fromToken: fromToken.symbol,
            toToken: toToken.symbol,
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
        })

        // Calculate price impact as percentage difference
        const priceImpact =
            expectedValueUSD > 0
                ? ((actualValueUSD - expectedValueUSD) / expectedValueUSD) * 100
                : 0

        return {
            transactionType: route.transactionType,
            aggregatorId: route.aggregatorId,
            amountFrom: route.amountFrom,
            amountTo: route.amountTo,
            path: route.path,
            route: route.route,
            gasEstimate: route.gasEstimate,
            outputAmountFormatted,
            priceImpact,
        }
    })

    // Log processed routes for debugging
    console.log(
        'Processed routes:',
        processedRoutes.map((r) => ({
            type: r.transactionType,
            aggregator: r.aggregatorId,
            output: r.outputAmountFormatted,
            priceImpact: r.priceImpact.toFixed(2) + '%',
            gasEstimate: r.gasEstimate,
        }))
    )

    // Filter out malicious or invalid routes
    // Pass user's slippage tolerance to filter routes based on price impact
    // In auto mode, always show at least one route even with high price impact
    const validRoutes = filterValidRoutes(processedRoutes, fromToken, toToken, {
        ...DEFAULT_ROUTE_CONFIG,
        userSlippageTolerance: slippageTolerance,
        isAutoMode,
    })

    console.log(
        `Valid routes after filtering: ${validRoutes.length}/${processedRoutes.length}`
    )

    if (validRoutes.length === 0 && processedRoutes.length > 0) {
        console.error('All routes were rejected by validation')
        throw new Error(
            'No valid routes found. All routes failed security validation.'
        )
    }

    return validRoutes
}

export function useSwapRoutes(
    fromToken: Token | null,
    toToken: Token | null,
    amount: string,
    balance?: string,
    slippageTolerance?: number,
    isAutoMode?: boolean
) {
    const queryClient = useQueryClient()

    return useQuery({
        queryKey: [
            'swapRoutes',
            fromToken?.address,
            toToken?.address,
            amount,
            isAutoMode ? 'auto' : slippageTolerance,
        ],
        queryFn: () => {
            // Get prices from cache
            const prices = queryClient.getQueryData<Record<string, number>>([
                'tokenPrices',
            ])

            return fetchSwapRoutes({
                fromToken: fromToken!,
                toToken: toToken!,
                amount,
                balance,
                // In auto mode, don't filter by slippage tolerance
                slippageTolerance: isAutoMode ? undefined : slippageTolerance,
                prices,
                isAutoMode,
            })
        },
        enabled: !!(fromToken && toToken && amount && parseFloat(amount) > 0),
        staleTime: 30 * 1000, // 30s
        gcTime: 5 * 60 * 1000, // 5min
        refetchOnWindowFocus: true,
        refetchInterval: false, // Manual refetch control via countdown timer
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}
