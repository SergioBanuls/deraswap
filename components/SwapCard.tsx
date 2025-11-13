/**
 * Swap Card Component
 *
 * Main interface for configuring and executing swaps.
 * Optimized with React.memo and useCallback to prevent unnecessary re-renders.
 */

'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { Token } from '@/types/token'
import { SwapRoute } from '@/types/route'
import { SwapSettings } from '@/types/swap'
import { TokenSelector } from './TokenSelector'
import { AmountInput } from './AmountInput'
import { SwapButton } from './SwapButton'
import { SwapProgressDialog } from './SwapProgressDialog'
import { useReownConnect } from '@/hooks/useReownConnect'
import { useSwapExecution } from '@/hooks/useSwapExecution'
import { useCheckUserTokenAssociation } from '@/hooks/useCheckUserTokenAssociation'
import { useAssociateToken } from '@/hooks/useAssociateToken'
import { validateAmount } from '@/utils/amountValidation'
import { Settings, History } from 'lucide-react'

interface SwapCardProps {
    fromToken: Token | null
    toToken: Token | null
    amount: string
    selectedRoute: SwapRoute | null
    settings: SwapSettings
    effectiveSlippage?: number // The actual slippage to use (auto-calculated or manual)
    onSettingsClick: () => void
    onHistoryClick: () => void
    onFromTokenClick: () => void
    onToTokenClick: () => void
    onAmountChange: (amount: string) => void
    onSwapTokens: () => void
    fromTokenBalance?: string // Balance of the from token in raw units
    hasBalanceError?: boolean // Whether there's insufficient balance
    onBalanceError?: (hasError: boolean) => void // Callback for balance error state
    isHistoryOpen?: boolean // Whether the history view is open
}

export const SwapCard = memo(function SwapCard({
    fromToken,
    toToken,
    amount,
    selectedRoute,
    settings,
    effectiveSlippage,
    onSettingsClick,
    onHistoryClick,
    isHistoryOpen = false,
    onFromTokenClick,
    onToTokenClick,
    onAmountChange,
    onSwapTokens,
    fromTokenBalance,
    hasBalanceError,
    onBalanceError,
}: SwapCardProps) {
    const { connect, account, isConnected, loading } = useReownConnect()
    const {
        executeSwap,
        isExecuting,
        stepMessage,
        currentStep,
        explorerUrl,
        monitoringProgress,
        error: swapError,
        txHash,
        reset: resetSwap,
    } = useSwapExecution()
    const {
        isAssociated,
        isChecking,
        refresh: refreshTokenAssociation,
    } = useCheckUserTokenAssociation(account, toToken?.address || null)
    const {
        associateToken,
        isAssociating,
        error: associationError,
    } = useAssociateToken()

    // State for progress dialog
    const [showProgressDialog, setShowProgressDialog] = useState(false)

    // Handle token association
    const handleAssociateToken = useCallback(async () => {
        if (!toToken) return

        console.log('🔗 Starting token association for', toToken.symbol)
        const success = await associateToken(toToken.address)

        if (success) {
            console.log('✅ Token associated successfully')
            // Wait a moment for the network to propagate the change
            setTimeout(() => {
                refreshTokenAssociation()
            }, 2000)
        } else {
            console.error('❌ Token association failed:', associationError)
        }
    }, [toToken, associateToken, associationError, refreshTokenAssociation])

    // Handle swap execution
    const handleSwap = useCallback(async () => {
        console.log('🔵 handleSwap called')
        console.log('  fromToken:', fromToken?.symbol)
        console.log('  toToken:', toToken?.symbol)
        console.log('  amount:', amount)
        console.log('  selectedRoute:', selectedRoute?.aggregatorId)

        if (!fromToken || !toToken || !amount || !selectedRoute) {
            console.log('❌ Missing required fields')
            return
        }

        // Validate and convert amount to raw units
        const validation = validateAmount(amount, fromToken.decimals)
        if (!validation.valid || !validation.sanitized) {
            console.log('❌ Amount validation failed')
            return
        }

        console.log('✅ Starting swap execution...')

        // Show progress dialog
        setShowProgressDialog(true)

        // Use effective slippage if provided, otherwise use settings value
        const slippage =
            effectiveSlippage !== undefined
                ? effectiveSlippage
                : settings.slippageTolerance

        await executeSwap({
            route: selectedRoute,
            fromToken,
            toToken,
            inputAmount: validation.sanitized,
            settings: {
                ...settings,
                slippageTolerance: slippage, // Use effective slippage
            },
        })
    }, [
        fromToken,
        toToken,
        amount,
        selectedRoute,
        settings,
        effectiveSlippage,
        executeSwap,
    ])

    // Handle dialog close
    const handleCloseProgressDialog = useCallback(() => {
        setShowProgressDialog(false)
        resetSwap()
    }, [resetSwap])

    // Determine if swap button should be enabled
    const canSwap =
        fromToken &&
        toToken &&
        amount &&
        parseFloat(amount) > 0 &&
        selectedRoute &&
        !isExecuting &&
        !hasBalanceError && // Disable if insufficient balance
        isAssociated && // Only enable if token is associated
        !isHistoryOpen // Disable if history is open

    // Determine if we need to show associate button
    const needsAssociation =
        isConnected && toToken && !isAssociated && !isChecking

    // Debug log
    console.log('SwapCard state:', {
        fromToken: fromToken?.symbol,
        toToken: toToken?.symbol,
        amount,
        hasBalanceError,
        canSwap,
        isExecuting,
        isAssociated,
        isChecking,
        needsAssociation,
    })

    return (
        <>
            <SwapProgressDialog
                isOpen={showProgressDialog}
                currentStep={currentStep}
                stepMessage={stepMessage}
                error={swapError}
                txHash={txHash}
                explorerUrl={explorerUrl}
                monitoringProgress={monitoringProgress}
                onClose={handleCloseProgressDialog}
                receivedAmount={selectedRoute?.outputAmountFormatted}
                receivedToken={toToken}
            />

            <div className='w-full'>
                <div className='bg-neutral-900 rounded-3xl p-6 min-h-[420px] flex flex-col'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-4'>
                        <h1 className='text-2xl font-bold text-white'>
                            Exchange
                        </h1>
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={onHistoryClick}
                                className='p-2 rounded-lg hover:bg-neutral-700 text-white/70 hover:text-white transition-all'
                                aria-label='Historial de swaps'
                                disabled={!isConnected}
                            >
                                <History className='w-5 h-5' />
                            </button>
                            <button
                                onClick={onSettingsClick}
                                className='p-2 rounded-lg hover:bg-neutral-700 text-white/70 hover:text-white transition-all'
                                aria-label='Settings'
                            >
                                <Settings className='w-5 h-5' />
                            </button>
                        </div>
                    </div>

                    {/* Token Selectors - Side by Side with overlapping Swap Button */}
                    <div className='relative flex items-center gap-0'>
                        {/* From Token */}
                        <div className='flex-1 pr-4'>
                            <TokenSelector
                                label='From'
                                selectedToken={fromToken}
                                onClick={onFromTokenClick}
                            />
                        </div>

                        {/* Swap Button - Absolutely positioned */}
                        <div className='absolute left-1/2 -translate-x-1/2 z-10'>
                            <SwapButton
                                onSwap={
                                    isHistoryOpen
                                        ? onHistoryClick
                                        : onSwapTokens
                                }
                                isHistoryOpen={isHistoryOpen}
                            />
                        </div>

                        {/* To Token */}
                        <div className='flex-1 pl-4'>
                            <TokenSelector
                                label='To'
                                selectedToken={toToken}
                                onClick={onToTokenClick}
                            />
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className='mt-6'>
                        <AmountInput
                            amount={amount}
                            account={account}
                            onAmountChange={onAmountChange}
                            token={fromToken}
                            disabled={!fromToken}
                            balance={fromTokenBalance}
                            onBalanceError={onBalanceError}
                        />
                    </div>

                    {/* Connect Wallet / Associate Token / Swap Button */}
                    <div className='mt-6'>
                        {!isConnected ? (
                            <button
                                onClick={connect}
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                                    loading
                                        ? 'bg-blue-500/50 text-white cursor-wait'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                            >
                                {loading ? 'Connecting...' : 'Connect wallet'}
                            </button>
                        ) : needsAssociation ? (
                            <div className='space-y-3'>
                                <button
                                    onClick={handleAssociateToken}
                                    disabled={isAssociating}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                                        isAssociating
                                            ? 'bg-purple-500/50 text-white cursor-wait'
                                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                                    }`}
                                >
                                    {isAssociating
                                        ? 'Associating...'
                                        : `Associate ${
                                              toToken?.symbol || 'Token'
                                          }`}
                                </button>
                                {associationError && (
                                    <div className='text-xs text-red-400 text-center'>
                                        {associationError}
                                    </div>
                                )}
                                <div className='text-xs text-white/50 text-center'>
                                    You need to associate {toToken?.symbol}{' '}
                                    before receiving it
                                </div>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                <button
                                    onClick={handleSwap}
                                    disabled={!canSwap}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                                        !canSwap
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : isExecuting
                                            ? 'bg-yellow-500 text-white cursor-wait'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {isHistoryOpen
                                        ? 'Close history to swap'
                                        : hasBalanceError
                                        ? `Insufficient ${fromToken?.symbol}`
                                        : isExecuting
                                        ? 'Swapping...'
                                        : 'Swap'}
                                </button>
                                {isExecuting && currentStep && (
                                    <div className='text-xs text-white/50 text-center space-y-1'>
                                        <div className='animate-pulse'>
                                            {stepMessage}
                                        </div>
                                        {currentStep === 'monitoring' &&
                                            monitoringProgress && (
                                                <div className='text-white/40'>
                                                    Checking consensus... (
                                                    {monitoringProgress.current}
                                                    /{monitoringProgress.max})
                                                </div>
                                            )}
                                    </div>
                                )}
                                {explorerUrl &&
                                    (currentStep === 'monitoring' ||
                                        currentStep === 'success') && (
                                        <a
                                            href={explorerUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-xs text-blue-400 hover:text-blue-300 text-center block underline'
                                        >
                                            View on HashScan
                                        </a>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
})
