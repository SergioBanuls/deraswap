/**
 * Swap Execution Hook
 *
 * Orchestrates the complete swap flow:
 * 1. Validate swap parameters
 * 2. Check/request token association (destination token)
 * 3. Check/request token allowance (source token)
 * 4. Build swap transaction
 * 5. Sign transaction via wallet
 * 6. Send transaction to network
 * 7. Monitor transaction status
 * 8. Handle success/failure
 *
 * This hook is router-agnostic and works with both ETASwap and custom routers.
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useReownContext } from '@/contexts/ReownContext'
import { SwapRoute } from '@/types/route'
import { Token } from '@/types/token'
import { SwapSettings } from '@/types/swap'
import {
    buildSwapTransaction,
    validateSwapParams,
    SwapTransactionParams,
} from '@/utils/transactionBuilder'
import {
    requestApproval,
    calculateAllowanceWithBuffer,
    ApprovalParams,
} from '@/utils/allowanceManager'
import {
    requestTokenAssociation,
    AssociateTokenParams,
} from '@/utils/tokenAssociation'
import { getActiveRouter } from '@/config/contracts'
import {
    monitorTransaction,
    getTransactionExplorerUrl,
} from '@/utils/transactionMonitor'
import { parseHederaError, formatErrorMessage } from '@/utils/errorMessages'
import { useEnsureTokensAssociated } from '@/hooks/useEnsureTokensAssociated'
import { extractAllTokensFromRoute } from '@/utils/pathUtils'
import { calculateSwapUsdValuePrecise } from '@/utils/usdCalculator'
import { useTokenPricesContext } from '@/contexts/TokenPricesProvider'

export interface SwapExecutionParams {
    route: SwapRoute
    fromToken: Token
    toToken: Token
    inputAmount: string // Raw amount in smallest units
    settings: SwapSettings
}

export interface SwapExecutionState {
    isExecuting: boolean
    currentStep: SwapStep
    error: string | null
    txHash: string | null
    explorerUrl: string | null
    monitoringProgress?: { current: number; max: number }
}

export type SwapStep =
    | 'idle'
    | 'checking_association'
    | 'requesting_association'
    | 'checking_allowance'
    | 'requesting_approval'
    | 'building_transaction'
    | 'awaiting_signature'
    | 'monitoring'
    | 'success'
    | 'error'

const STEP_MESSAGES: Record<SwapStep, string> = {
    idle: 'Ready to swap',
    checking_association: 'Checking token association...',
    requesting_association: 'Requesting token association...',
    checking_allowance: 'Checking token allowance...',
    requesting_approval: 'Requesting token approval...',
    building_transaction: 'Preparing swap transaction...',
    awaiting_signature: 'Please sign the transaction in your wallet...',
    monitoring: 'Monitoring transaction...',
    success: 'Swap completed successfully!',
    error: 'Swap failed',
}

export function useSwapExecution() {
    const {
        callNativeMethod,
        executeTransactionWithSigner,
        signer,
        account,
        isConnected,
    } = useReownContext()
    const { ensureTokensAssociated, isEnsuring } = useEnsureTokensAssociated()
    const [state, setState] = useState<SwapExecutionState>({
        isExecuting: false,
        currentStep: 'idle',
        error: null,
        txHash: null,
        explorerUrl: null,
        monitoringProgress: undefined,
    })

    const { prices } = useTokenPricesContext()

    /**
     * Record swap for incentive system (fire and forget)
     */
    const recordSwapForIncentives = async (
        params: SwapExecutionParams,
        txHash: string
    ) => {
        if (!account) {
            console.warn('⚠️ Cannot record swap: No account connected')
            return
        }

        try {
            console.log('📊 Calculating USD value for incentives...')

            // Get price from context if not in token
            const tokenPrice =
                params.fromToken.priceUsd ||
                params.fromToken.price ||
                (prices ? prices[params.fromToken.address] : undefined)

            console.log('💲 Token Price used:', tokenPrice)
            console.log('💰 Input Amount:', params.inputAmount)
            console.log('🪙 Token Decimals:', params.fromToken.decimals)

            // Calculate USD value of the swap
            const usdValue = calculateSwapUsdValuePrecise(
                params.fromToken,
                params.inputAmount,
                tokenPrice
            )

            console.log('💵 Calculated USD Value:', usdValue)

            // Only record if USD value is > 0
            if (usdValue <= 0) {
                console.log(
                    '⚠️ Skipping incentive recording - USD value is 0 or negative'
                )
                return
            }

            console.log('🚀 Sending incentive record request...')

            // Call API to record the swap
            const response = await fetch('/api/incentives/record-swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallet_address: account,
                    tx_hash: txHash,
                    from_token_address: params.fromToken.address,
                    to_token_address: params.toToken.address,
                    from_amount: params.inputAmount,
                    to_amount:
                        typeof params.route.amountTo === 'string'
                            ? params.route.amountTo
                            : Array.isArray(params.route.amountTo)
                                ? params.route.amountTo[0] || '0'
                                : '0',
                    usd_value: usdValue,
                    timestamp: new Date().toISOString(),
                }),
            })

            console.log('📤 Incentive record request sent:', {
                wallet: account,
                txHash,
                usdValue,
                status: response.status
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error(
                    '❌ Failed to record swap for incentives:',
                    errorData
                )
            } else {
                const data = await response.json()
                console.log('✅ Swap recorded for incentives:', data)
            }
        } catch (error) {
            console.warn('❌ Error recording swap for incentives:', error)
            // Silent failure - don't disrupt the user experience
        }
    }

    /**
     * Update execution state and show toast notification
     */
    const updateState = useCallback(
        (
            step: SwapStep,
            error: string | null = null,
            txHash: string | null = null,
            explorerUrl: string | null = null,
            monitoringProgress?: { current: number; max: number }
        ) => {
            setState({
                isExecuting:
                    step !== 'idle' && step !== 'success' && step !== 'error',
                currentStep: step,
                error,
                txHash,
                explorerUrl,
                monitoringProgress,
            })

            // Show toast for important steps
            if (step === 'awaiting_signature') {
                toast.info(STEP_MESSAGES[step])
            } else if (step === 'success') {
                toast.success(STEP_MESSAGES[step])
            } else if (step === 'error' && error) {
                toast.error(error)
            }
        },
        []
    )

    /**
     * Execute swap
     *
     * Main function that orchestrates the entire swap flow
     */
    const executeSwap = useCallback(
        async (
            params: SwapExecutionParams
        ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
            if (!isConnected || !account) {
                const error = 'Please connect your wallet first'
                toast.error(error)
                return { success: false, error }
            }

            try {
                // Show building transaction immediately when dialog opens
                updateState('building_transaction')

                // Step 1: Validate parameters
                // DEBUG: Log token addresses
                console.log('🔍 DEBUG fromToken:', {
                    address: params.fromToken.address,
                    solidityAddress: params.fromToken.solidityAddress,
                    symbol: params.fromToken.symbol,
                    name: params.fromToken.name,
                })
                console.log('🔍 DEBUG toToken:', {
                    address: params.toToken.address,
                    solidityAddress: params.toToken.solidityAddress,
                    symbol: params.toToken.symbol,
                    name: params.toToken.name,
                })
                console.log('🔍 DEBUG route path/route:', {
                    path: params.route.path,
                    route: params.route.route,
                    aggregatorId: params.route.aggregatorId,
                })

                const txParams: SwapTransactionParams = {
                    ...params,
                    userAccountId: account,
                }

                const validation = validateSwapParams(txParams)
                if (!validation.valid) {
                    throw new Error(
                        validation.error || 'Invalid swap parameters'
                    )
                }

                // Step 2: Ensure Exchange and ALL Adapters (V1 + V2) have tokens associated
                // This includes fromToken, toToken, AND all intermediate tokens in the path
                // IMPORTANT: This fixes the "Safe token transfer failed!" error that occurs
                // when intermediate tokens in multi-hop swaps are not associated to the adapter

                // Extract ALL tokens from the route path (V1 and V2 compatible)
                const pathTokens = extractAllTokensFromRoute(
                    params.route,
                    params.route.aggregatorId
                )

                console.log('🔍 Tokens extracted from path:', pathTokens)

                // Also add fromToken and toToken explicitly (they should already be in path, but be safe)
                const tokensToCheck: string[] = []
                if (params.fromToken.address !== '')
                    tokensToCheck.push(params.fromToken.address)
                if (params.toToken.address !== '')
                    tokensToCheck.push(params.toToken.address)

                // Add all path tokens
                tokensToCheck.push(...pathTokens)

                // Remove duplicates
                const uniqueTokens = Array.from(new Set(tokensToCheck))

                console.log(
                    '🔍 All tokens to check for adapter association:',
                    uniqueTokens
                )
                console.log('🔍 Expected token address for toToken:', params.toToken.address)

                if (uniqueTokens.length > 0) {
                    console.log(
                        '🔍 Checking Exchange and Adapters token associations for',
                        uniqueTokens.length,
                        'token(s)'
                    )
                    const allContractsReady = await ensureTokensAssociated(
                        uniqueTokens,
                        params.fromToken.address || 'HBAR' // Pass tokenFrom for fee wallet association
                    )

                    if (!allContractsReady) {
                        throw new Error(
                            'Failed to ensure Exchange and Adapters support these tokens. Please try again.'
                        )
                    }
                    console.log('✅ All tokens verified in Exchange, Adapters, and Fee Wallet (V1 + V2, including intermediates)')
                }

                // Step 3: Check token association for destination token (skip for HBAR)
                if (params.toToken.address !== '') {
                    updateState('checking_association')

                    const associationParams: AssociateTokenParams = {
                        tokenId: params.toToken.address,
                        accountId: account,
                    }

                    const associationResult = await requestTokenAssociation(
                        associationParams
                    )

                    // Step 3b: Request association if needed
                    if (
                        associationResult.needed &&
                        associationResult.transaction
                    ) {
                        updateState('requesting_association')
                        toast.info(
                            'Please associate the token in your wallet to receive it'
                        )

                        try {
                            // Sign and send association transaction
                            const associationTx = await callNativeMethod(
                                'hedera_signAndExecuteTransaction',
                                {
                                    transaction: associationResult.transaction,
                                }
                            )

                            console.log(
                                'Association transaction:',
                                associationTx
                            )
                            toast.success('Token associated successfully')

                            // Wait a bit for association to be processed
                            await new Promise((resolve) =>
                                setTimeout(resolve, 2000)
                            )
                        } catch (associationError) {
                            console.error(
                                'Association error:',
                                associationError
                            )

                            // Parse error and extract clean message
                            const parsedError =
                                parseHederaError(associationError)

                            // Show brief toast
                            toast.error(parsedError.userMessage, {
                                duration: 5000,
                            })

                            throw new Error(parsedError.userMessage)
                        }
                    }
                }

                // Step 3: Check allowance (skip for HBAR)
                if (params.fromToken.address !== '') {
                    updateState('checking_allowance')

                    const router = getActiveRouter()
                    const requiredAmount = calculateAllowanceWithBuffer(
                        params.inputAmount
                    )

                    const approvalParams: ApprovalParams = {
                        tokenId: params.fromToken.address,
                        amount: requiredAmount,
                        ownerAccountId: account,
                        spenderAddress: router.address,
                        spenderAccountId: router.hederaId, // Use Account ID format for Mirror Node lookup
                    }

                    const approvalResult = await requestApproval(approvalParams)

                    // Step 4: Request approval if needed
                    if (approvalResult.needed && approvalResult.transaction) {
                        updateState('requesting_approval')
                        toast.info(
                            'Please approve token spending in your wallet'
                        )

                        try {
                            // Sign and send approval transaction (already in bytes format)
                            const approvalTx = await callNativeMethod(
                                'hedera_signAndExecuteTransaction',
                                {
                                    transaction: approvalResult.transaction,
                                }
                            )

                            console.log('Approval transaction:', approvalTx)
                            toast.success('Token approval confirmed')

                            // Wait a bit for approval to be processed
                            await new Promise((resolve) =>
                                setTimeout(resolve, 2000)
                            )
                        } catch (approvalError) {
                            console.error('Approval error:', approvalError)

                            // Parse error and extract clean message
                            const parsedError = parseHederaError(approvalError)

                            // Show brief toast
                            toast.error(parsedError.userMessage, {
                                duration: 5000,
                            })

                            throw new Error(parsedError.userMessage)
                        }
                    }
                }

                // Step 5: Build swap transaction
                // CRITICAL: When swapping FROM HBAR, we MUST use signer
                // to properly serialize the payableAmount field
                const isHbarSwap = params.fromToken.address === ''
                const txParamsWithSigner = isHbarSwap
                    ? { ...txParams, signer }
                    : txParams

                const swapTx = await buildSwapTransaction(txParamsWithSigner)

                // Step 6: Request signature and execute
                updateState('awaiting_signature')

                let result: any

                // Use different execution method based on whether we're swapping HBAR
                if (
                    isHbarSwap &&
                    swapTx instanceof Object &&
                    'executeWithSigner' in swapTx
                ) {
                    console.log(
                        '🪙 HBAR swap detected - using executeTransactionWithSigner'
                    )
                    result = await executeTransactionWithSigner(swapTx)
                } else {
                    console.log('🪙 Token swap - using callNativeMethod')
                    result = await callNativeMethod(
                        'hedera_signAndExecuteTransaction',
                        {
                            transaction: swapTx as Uint8Array,
                        }
                    )
                }

                console.log('Swap transaction result:', result)

                // Extract transaction ID from result
                const txHash =
                    result?.transactionId || result?.txId || 'unknown'

                // Step 7: Monitor transaction using Mirror Node
                updateState('monitoring', null, txHash)

                // Get network for explorer URL
                const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK ||
                    'testnet') as 'mainnet' | 'testnet'
                const explorerUrl = getTransactionExplorerUrl(txHash, network)

                // Monitor transaction with progress updates
                const txStatus = await monitorTransaction(
                    txHash,
                    (current, max) => {
                        updateState('monitoring', null, txHash, explorerUrl, {
                            current,
                            max,
                        })
                    }
                )

                // Step 8: Check final status
                if (txStatus.success) {
                    updateState('success', null, txHash, explorerUrl)
                    toast.success('Swap completed successfully!')

                    // Step 9: Record swap for incentive system
                    console.log('🏁 Swap success! Initiating incentive recording...')
                    try {
                        await recordSwapForIncentives(params, txHash)
                        console.log('✅ Incentive recording initiated')
                    } catch (error) {
                        console.error('⚠️ Failed to initiate incentive recording:', error)
                    }

                    return { success: true, txHash }
                } else {
                    throw new Error(
                        txStatus.errorMessage || 'Transaction failed'
                    )
                }
            } catch (error) {
                console.error('Swap execution error:', error)

                // Parse error and extract clean message
                const parsedError = parseHederaError(error)
                const errorMessage = parsedError.userMessage

                updateState('error', errorMessage)

                // Don't show toast - the modal will display the error
                // This prevents duplicate error messages

                return { success: false, error: errorMessage }
            }
        },
        [isConnected, account, callNativeMethod, updateState]
    )

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        setState({
            isExecuting: false,
            currentStep: 'idle',
            error: null,
            txHash: null,
            explorerUrl: null,
            monitoringProgress: undefined,
        })
    }, [])

    return {
        executeSwap,
        reset,
        state,
        isExecuting: state.isExecuting,
        currentStep: state.currentStep,
        stepMessage: STEP_MESSAGES[state.currentStep],
        error: state.error,
        txHash: state.txHash,
        explorerUrl: state.explorerUrl,
        monitoringProgress: state.monitoringProgress,
    }
}
