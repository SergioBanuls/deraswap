'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SwapCard } from '@/components/SwapCard'
import { SwapRoutes } from '@/components/SwapRoutes'
import { SwapHistory } from '@/components/SwapHistory'
import { SettingsCard } from '@/components/SettingsCard'
import { TokenSelectCard } from '@/components/TokenSelectCard'
import { Token } from '@/types/token'
import { SwapRoute } from '@/types/route'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSwapSettings } from '@/hooks/useSwapSettings'
import { useTokens } from '@/hooks/useTokens'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { useReownConnect } from '@/hooks/useReownConnect'

export default function Home() {
    const [fromToken, setFromToken] = useState<Token | null>(null)
    const [toToken, setToToken] = useState<Token | null>(null)
    const [amount, setAmount] = useState('')
    const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null)
    const [hasBalanceError, setHasBalanceError] = useState(false)
    const [view, setView] = useState<
        'swap' | 'settings' | 'selectToken' | 'history'
    >('swap')
    const [tokenSelectType, setTokenSelectType] = useState<'from' | 'to'>(
        'from'
    )

    // URL state management
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get connected account
    const { account } = useReownConnect()

    // Fetch tokens list
    const { data: tokens } = useTokens()

    // Fetch token balances for connected account
    const { balances, loading: balancesLoading } = useTokenBalances(
        account || null
    )

    // Get balance for the from token
    // Check multiple possible keys: token.address or HBAR special case
    // Return "0" if token is selected but has no balance (not associated or 0 balance)
    const fromTokenBalance = (() => {
        if (!fromToken) return undefined
        if (balancesLoading) return undefined // Still loading

        // For HBAR (empty address), use 'HBAR' as key
        const balanceKey = fromToken.address === '' ? 'HBAR' : fromToken.address
        const balance = balances[balanceKey]

        if (balance !== undefined) return balance

        // Token not found in balances = not associated or 0 balance
        return '0'
    })()

    // Swap settings (slippage, deadline)
    const {
        settings,
        setSlippageTolerance,
        enableAutoSlippage,
        getEffectiveSlippage,
    } = useSwapSettings()

    // Initialize tokens from URL or set defaults on mount
    useEffect(() => {
        if (tokens && tokens.length > 0 && !fromToken && !toToken) {
            // Check if we have tokens in URL
            const fromParam = searchParams.get('from')
            const toParam = searchParams.get('to')

            let initialFromToken: Token | null = null
            let initialToToken: Token | null = null

            // Try to find tokens from URL params
            if (fromParam !== null) {
                if (fromParam === 'HBAR') {
                    // Find HBAR token by address or symbol
                    initialFromToken =
                        tokens.find(
                            (t) => t.address === '' || t.symbol === 'HBAR'
                        ) || null
                } else {
                    // Find token by address
                    initialFromToken =
                        tokens.find((t) => t.address === fromParam) || null
                }
            }
            if (toParam !== null) {
                if (toParam === 'HBAR') {
                    // Find HBAR token by address or symbol
                    initialToToken =
                        tokens.find(
                            (t) => t.address === '' || t.symbol === 'HBAR'
                        ) || null
                } else {
                    // Find token by address
                    initialToToken =
                        tokens.find((t) => t.address === toParam) || null
                }
            }

            // If URL params were provided and found, use them
            if (initialFromToken || initialToToken) {
                if (initialFromToken) setFromToken(initialFromToken)
                if (initialToToken) setToToken(initialToToken)
            } else {
                // Otherwise, set defaults (HBAR and USDC)
                const hbarToken = tokens.find(
                    (t) => t.address === '' || t.symbol === 'HBAR'
                )
                const usdcToken = tokens.find(
                    (t) => t.address === '0.0.456858'
                )

                if (hbarToken) setFromToken(hbarToken)
                if (usdcToken) setToToken(usdcToken)
            }
        }
    }, [tokens, fromToken, toToken, searchParams])

    // Sync token changes to URL
    useEffect(() => {
        // Only update URL if tokens list is loaded (to avoid updating with stale state)
        if (!tokens || tokens.length === 0) return

        const params = new URLSearchParams(searchParams.toString())

        // Update from token in URL
        if (fromToken) {
            // Use "HBAR" for empty address, otherwise use the actual address
            const fromValue = fromToken.address === '' ? 'HBAR' : fromToken.address
            params.set('from', fromValue)
        } else {
            params.delete('from')
        }

        // Update to token in URL
        if (toToken) {
            // Use "HBAR" for empty address, otherwise use the actual address
            const toValue = toToken.address === '' ? 'HBAR' : toToken.address
            params.set('to', toValue)
        } else {
            params.delete('to')
        }

        // Build new URL
        const queryString = params.toString()
        const newURL = queryString ? `${pathname}?${queryString}` : pathname

        // Only update if the URL actually changed
        const currentURL = `${pathname}${
            searchParams.toString() ? `?${searchParams.toString()}` : ''
        }`
        if (newURL !== currentURL) {
            router.push(newURL, { scroll: false })
        }
    }, [fromToken, toToken, tokens, pathname, router, searchParams])

    // Calculate effective slippage (auto or manual)
    const effectiveSlippage = getEffectiveSlippage(selectedRoute)

    // Debounce amount to reduce API calls while user is typing
    const debouncedAmount = useDebouncedValue(amount, 500)

    // Memoize showRoutes calculation
    const showRoutes = useMemo(() => {
        return (
            fromToken !== null &&
            toToken !== null &&
            amount !== '' &&
            parseFloat(amount) > 0
        )
    }, [fromToken, toToken, amount])

    // Memoize handler functions
    const handleSwapTokens = useCallback(() => {
        const temp = fromToken
        setFromToken(toToken)
        setToToken(temp)
        setAmount('')
    }, [fromToken, toToken])

    const handleFromTokenSelect = useCallback(
        (token: Token) => {
            // If new From token matches To token
            if (toToken && token.address === toToken.address) {
                // If both tokens are selected, swap them
                if (fromToken) {
                    setToToken(fromToken)
                } else {
                    // Otherwise just clear To
                    setToToken(null)
                }
            }
            setFromToken(token)
            setView('swap')
        },
        [toToken, fromToken]
    )

    const handleToTokenSelect = useCallback(
        (token: Token) => {
            // If new To token matches From token
            if (fromToken && token.address === fromToken.address) {
                // If both tokens are selected, swap them
                if (toToken) {
                    setFromToken(toToken)
                } else {
                    // Otherwise just clear From
                    setFromToken(null)
                }
            }
            setToToken(token)
            setView('swap')
        },
        [fromToken, toToken]
    )

    const handleFromTokenClick = useCallback(() => {
        setTokenSelectType('from')
        setView('selectToken')
    }, [])

    const handleToTokenClick = useCallback(() => {
        setTokenSelectType('to')
        setView('selectToken')
    }, [])

    const handleHistoryClick = useCallback(() => {
        // Toggle between history and swap view
        setView((prev) => (prev === 'history' ? 'swap' : 'history'))
    }, [])

    return (
        <div className='flex items-center justify-center mt-36 w-full'>
            <div className='max-w-5xl w-full px-4'>
                {/* Grid layout - always present, mobile stack, desktop side-by-side */}
                <div
                    className={`grid grid-cols-1 gap-6 items-center lg:items-start transition-all duration-900 ease-in-out ${
                        showRoutes && view === 'swap'
                            ? 'lg:grid-cols-2 lg:justify-center'
                            : 'lg:grid-cols-1 lg:justify-items-center'
                    }`}
                >
                    {/* Left Column - Swap Card, Settings Card, History, or Token Select Card */}
                    <div className='w-full max-w-md mx-auto transition-all duration-900 ease-in-out relative z-10'>
                        {view === 'swap' ? (
                            <SwapCard
                                fromToken={fromToken}
                                toToken={toToken}
                                amount={amount}
                                selectedRoute={selectedRoute}
                                settings={settings}
                                effectiveSlippage={effectiveSlippage}
                                onSettingsClick={() => setView('settings')}
                                onHistoryClick={handleHistoryClick}
                                onFromTokenClick={handleFromTokenClick}
                                onToTokenClick={handleToTokenClick}
                                onAmountChange={setAmount}
                                onSwapTokens={handleSwapTokens}
                                fromTokenBalance={fromTokenBalance}
                                hasBalanceError={hasBalanceError}
                                onBalanceError={setHasBalanceError}
                                isHistoryOpen={false}
                            />
                        ) : view === 'history' ? (
                            <SwapHistory
                                walletAddress={account}
                                onClose={() => setView('swap')}
                            />
                        ) : view === 'settings' ? (
                            <SettingsCard
                                settings={settings}
                                selectedRoute={selectedRoute}
                                effectiveSlippage={effectiveSlippage}
                                onSlippageChange={setSlippageTolerance}
                                onAutoModeChange={enableAutoSlippage}
                                onBack={() => setView('swap')}
                            />
                        ) : (
                            <TokenSelectCard
                                label={
                                    tokenSelectType === 'from' ? 'From' : 'To'
                                }
                                onSelectToken={
                                    tokenSelectType === 'from'
                                        ? handleFromTokenSelect
                                        : handleToTokenSelect
                                }
                                onBack={() => setView('swap')}
                                balances={balances}
                                account={account}
                            />
                        )}
                    </div>

                    {/* Right Column - Swap Routes */}
                    <div
                        className={`w-full max-w-md mx-auto transition-all duration-700 ease-in-out relative z-0 ${
                            showRoutes && view === 'swap'
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 lg:-translate-x-[50%] scale-95 pointer-events-none'
                        }`}
                    >
                        {showRoutes && view === 'swap' && (
                            <SwapRoutes
                                fromToken={fromToken}
                                toToken={toToken}
                                amount={debouncedAmount}
                                slippageTolerance={effectiveSlippage}
                                autoSlippage={settings.autoSlippage}
                                onRouteSelect={setSelectedRoute}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
