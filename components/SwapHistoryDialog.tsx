/**
 * SwapHistoryDialog Component
 *
 * Displays the swap transaction history for the connected wallet.
 * Shows token pairs, amounts, timestamps, and links to HashScan explorer.
 */

'use client'

import { memo, useMemo } from 'react'
import { useSwapHistory } from '@/hooks/useSwapHistory'
import { useTokens } from '@/hooks/useTokens'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { ExternalLink, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface SwapHistoryDialogProps {
    isOpen: boolean
    onClose: () => void
    walletAddress: string | null
}

export const SwapHistoryDialog = memo(function SwapHistoryDialog({
    isOpen,
    onClose,
    walletAddress,
}: SwapHistoryDialogProps) {
    const { history, isLoading, error, refresh } = useSwapHistory(walletAddress)
    const { data: tokens } = useTokens()

    // Create a map of token addresses to token objects for quick lookup
    // Use Hedera ID format (0.0.123456) as key
    const tokenMap = useMemo(() => {
        const map = new Map()
        if (tokens) {
            tokens.forEach((token) => {
                // Map by Hedera ID format (address field)
                if (token.address) {
                    map.set(token.address, token)
                }

                // Special handling for HBAR (native currency without numeric ID)
                // HBAR is the ONLY token with empty address
                if (
                    token.address === '' ||
                    token.address === null ||
                    token.address === undefined
                ) {
                    map.set('HBAR', token)
                    map.set('', token) // Empty string
                    map.set('0.0.0', token) // Some contracts use this
                    map.set('0.0.1456986', token) // wHBAR treated as HBAR
                }
            })

            // Debug: Log HBAR token details
            const hbarToken = map.get('HBAR')
            console.log('🔍 TokenMap created:', {
                totalTokens: map.size,
                hasHBAR: map.has('HBAR'),
                hbarToken: hbarToken,
                hbarIcon: hbarToken?.icon,
                hbarDecimals: hbarToken?.decimals,
                hbarSymbol: hbarToken?.symbol,
            })
        }
        return map
    }, [tokens])

    // Helper function to get token info by Hedera ID (0.0.123456) or HBAR
    const getTokenInfo = (tokenId: string) => {
        // Normalize HBAR variations (native HBAR and wHBAR)
        if (
            !tokenId ||
            tokenId === '' ||
            tokenId === 'HBAR' ||
            tokenId === '0.0.0' ||
            tokenId === '0.0.1456986'
        ) {
            return tokenMap.get('HBAR')
        }

        // For any other token, use normal lookup
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-3xl max-h-[80vh] bg-neutral-900 border-neutral-800 text-white'>
                <DialogHeader>
                    <DialogTitle className='text-2xl font-bold'>
                        Historial de Swaps
                    </DialogTitle>
                    <DialogDescription className='text-neutral-400'>
                        {walletAddress
                            ? `Transacciones de ${walletAddress.slice(
                                  0,
                                  6
                              )}...${walletAddress.slice(-4)}`
                            : 'Conecta tu wallet para ver el historial'}
                    </DialogDescription>
                </DialogHeader>

                <div className='flex flex-col gap-4 mt-4 overflow-y-auto max-h-[60vh] pr-2'>
                    {/* Loading State */}
                    {isLoading && (
                        <div className='flex flex-col items-center justify-center py-12 gap-3'>
                            <Loader2 className='w-8 h-8 animate-spin text-purple-500' />
                            <p className='text-neutral-400'>
                                Cargando historial...
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className='flex flex-col items-center justify-center py-12 gap-3'>
                            <AlertCircle className='w-12 h-12 text-red-500' />
                            <p className='text-red-400'>{error}</p>
                            <button
                                onClick={() => refresh()}
                                className='px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors'
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && history.length === 0 && (
                        <div className='flex flex-col items-center justify-center py-12 gap-3'>
                            <div className='text-6xl'>📊</div>
                            <p className='text-neutral-400 text-center'>
                                {walletAddress
                                    ? 'No se encontraron swaps recientes'
                                    : 'Conecta tu wallet para ver el historial'}
                            </p>
                            {walletAddress && (
                                <>
                                    <p className='text-xs text-neutral-500 text-center max-w-md'>
                                        Solo se muestran swaps realizados con
                                        este contrato de DeraSwap
                                    </p>
                                    <button
                                        onClick={() => refresh()}
                                        className='text-sm text-purple-400 hover:text-purple-300 underline'
                                    >
                                        Actualizar
                                    </button>
                                    <p className='text-xs text-neutral-600 text-center max-w-md mt-2'>
                                        Abre la consola del navegador (F12) para
                                        ver información de debug
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* History List */}
                    {!isLoading && !error && history.length > 0 && (
                        <div className='space-y-3'>
                            {history.map((swap, index) => {
                                const fromToken = getTokenInfo(swap.fromToken)
                                const toToken = getTokenInfo(swap.toToken)

                                // Debug: Log token lookup
                                if (index === 0) {
                                    console.log('🔍 Token lookup debug:', {
                                        fromTokenId: swap.fromToken,
                                        toTokenId: swap.toToken,
                                        fromTokenFound: fromToken,
                                        toTokenFound: toToken,
                                        totalTokensInMap: tokenMap.size,
                                    })
                                }

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
                                                className='flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors'
                                            >
                                                Ver en HashScan
                                                <ExternalLink className='w-3.5 h-3.5' />
                                            </a>
                                        </div>

                                        {/* Token Swap Details */}
                                        <div className='flex items-center justify-between gap-4'>
                                            {swap.fromToken === 'N/A' ||
                                            swap.toToken === 'N/A' ? (
                                                // Simplified view when token details are not available
                                                <div className='flex items-center gap-3 flex-1'>
                                                    <div className='w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center'>
                                                        <ArrowRight className='w-5 h-5 text-purple-400' />
                                                    </div>
                                                    <div className='flex flex-col'>
                                                        <span className='font-semibold text-purple-400'>
                                                            Swap Ejecutado
                                                        </span>
                                                        <span className='text-xs text-neutral-400'>
                                                            {swap.aggregatorId &&
                                                            swap.aggregatorId !==
                                                                'Unknown'
                                                                ? `vía ${swap.aggregatorId}`
                                                                : 'Detalles en HashScan'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* From Token */}
                                                    <div className='flex items-center gap-3 flex-1'>
                                                        {fromToken?.icon ? (
                                                            <Image
                                                                src={
                                                                    fromToken.icon
                                                                }
                                                                alt={
                                                                    fromToken.symbol
                                                                }
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
                                                                    fromToken?.decimals ||
                                                                        8
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Arrow */}
                                                    <ArrowRight className='w-5 h-5 text-neutral-500 flex-shrink-0' />

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
                                                                    toToken?.decimals ||
                                                                        8
                                                                )}
                                                            </span>
                                                        </div>
                                                        {toToken?.icon ? (
                                                            <Image
                                                                src={
                                                                    toToken.icon
                                                                }
                                                                alt={
                                                                    toToken.symbol
                                                                }
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
                                                </>
                                            )}
                                        </div>

                                        {/* Transaction Hash */}
                                        <div className='mt-3 pt-3 border-t border-neutral-700/50'>
                                            <span className='text-xs text-neutral-500 font-mono'>
                                                {swap.txHash}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Refresh Button */}
                    {!isLoading && walletAddress && (
                        <button
                            onClick={() => refresh()}
                            className='mt-4 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm font-medium'
                        >
                            Actualizar
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
})
