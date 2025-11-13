'use client'

import { useEffect, useState } from 'react'
import { SwapStep } from '@/hooks/useSwapExecution'
import { Token } from '@/types/token'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
    CheckCircle2,
    Loader2,
    XCircle,
    ExternalLink,
    ArrowRight,
} from 'lucide-react'

interface SwapProgressDialogProps {
    isOpen: boolean
    currentStep: SwapStep
    stepMessage: string
    error: string | null
    txHash: string | null
    explorerUrl: string | null
    monitoringProgress?: { current: number; max: number }
    onClose: () => void
    receivedAmount?: string
    receivedToken?: Token | null
}

export function SwapProgressDialog({
    isOpen,
    currentStep,
    stepMessage,
    error,
    txHash,
    explorerUrl,
    monitoringProgress,
    onClose,
    receivedAmount,
    receivedToken,
}: SwapProgressDialogProps) {
    const isSuccess = currentStep === 'success'
    const isError = currentStep === 'error'
    const isProcessing = !isSuccess && !isError && currentStep !== 'idle'

    // Reset when dialog closes
    useEffect(() => {
        if (!isOpen) {
            // Reset logic if needed
        }
    }, [isOpen])

    // Prevent closing during processing
    const handleOpenChange = (open: boolean) => {
        if (!open && (isSuccess || isError)) {
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className='sm:max-w-[440px] bg-neutral-900 border border-neutral-800 p-0 gap-0 overflow-hidden'
                onInteractOutside={(e) => {
                    if (isProcessing) {
                        e.preventDefault()
                    }
                }}
            >
                {/* Success State */}
                {isSuccess && (
                    <div className='p-8 text-center space-y-6'>
                        <div className='flex justify-center'>
                            <div className='relative'>
                                <div className='absolute inset-0 bg-green-500/20 rounded-full blur-xl' />
                                <div className='relative bg-green-500/10 p-4 rounded-full'>
                                    <CheckCircle2 className='w-12 h-12 text-green-500' />
                                </div>
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='text-2xl font-bold text-white'>
                                Swap Complete!
                            </h3>

                            {/* Received Amount Display */}
                            {receivedAmount && receivedToken && (
                                <div className='py-4'>
                                    <p className='text-sm text-neutral-500 mb-2'>
                                        You received
                                    </p>
                                    <div className='flex items-center justify-center gap-3'>
                                        {receivedToken.icon && (
                                            <img
                                                src={receivedToken.icon}
                                                alt={receivedToken.symbol}
                                                className='w-8 h-8 rounded-full'
                                            />
                                        )}
                                        <div className='flex items-baseline gap-2'>
                                            <span className='text-3xl font-bold text-white'>
                                                {receivedAmount}
                                            </span>
                                            <span className='text-xl font-semibold text-neutral-400'>
                                                {receivedToken.symbol}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className='text-neutral-400 text-sm'>
                                Your transaction has been confirmed on the
                                network
                            </p>
                        </div>

                        {txHash && (
                            <div className='bg-neutral-800/50 rounded-xl p-4 space-y-2'>
                                <p className='text-xs text-neutral-500 uppercase tracking-wide'>
                                    Transaction ID
                                </p>
                                <p className='text-xs font-mono text-neutral-300 break-all leading-relaxed'>
                                    {txHash}
                                </p>
                            </div>
                        )}

                        <div className='space-y-3 pt-2'>
                            {explorerUrl && (
                                <a
                                    href={explorerUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium group'
                                >
                                    <span>View on HashScan</span>
                                    <ExternalLink className='w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                                </a>
                            )}

                            <button
                                onClick={onClose}
                                className='w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all duration-200 font-medium'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className='p-8 text-center space-y-6'>
                        <div className='flex justify-center'>
                            <div className='relative'>
                                <div className='absolute inset-0 bg-red-500/20 rounded-full blur-xl' />
                                <div className='relative bg-red-500/10 p-4 rounded-full'>
                                    <XCircle className='w-12 h-12 text-red-500' />
                                </div>
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <h3 className='text-2xl font-bold text-white'>
                                Transaction Failed
                            </h3>
                            <p className='text-neutral-400 text-sm'>
                                Something went wrong with your swap
                            </p>
                        </div>

                        {error && (
                            <div className='bg-red-500/5 border border-red-500/20 rounded-xl p-4 max-h-32 overflow-y-auto'>
                                <p className='text-sm text-red-400 leading-relaxed break-words'>
                                    {error.length > 200
                                        ? error.substring(0, 200) + '...'
                                        : error}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className='w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-all duration-200 font-medium'
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Processing State */}
                {isProcessing && (
                    <div className='p-8 space-y-8'>
                        {/* Animated loader */}
                        <div className='flex justify-center'>
                            <div className='relative'>
                                <div className='absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse' />
                                <div className='relative'>
                                    <svg
                                        className='w-20 h-20'
                                        viewBox='0 0 80 80'
                                    >
                                        <circle
                                            cx='40'
                                            cy='40'
                                            r='36'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='6'
                                            className='text-neutral-800'
                                        />
                                        <circle
                                            cx='40'
                                            cy='40'
                                            r='36'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='6'
                                            strokeLinecap='round'
                                            strokeDasharray='226'
                                            strokeDashoffset='56'
                                            className='text-blue-500'
                                            style={{
                                                animation:
                                                    'spin 1.5s linear infinite',
                                            }}
                                        />
                                    </svg>
                                    <div className='absolute inset-0 flex items-center justify-center'>
                                        <ArrowRight className='w-8 h-8 text-blue-500' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status text */}
                        <div className='text-center space-y-3'>
                            <h3 className='text-xl font-semibold text-white'>
                                Processing Swap
                            </h3>
                            <p className='text-sm text-neutral-400 leading-relaxed px-4'>
                                {stepMessage}
                            </p>

                            {currentStep === 'monitoring' &&
                                monitoringProgress && (
                                    <div className='flex items-center justify-center gap-2 text-xs text-neutral-500'>
                                        <div className='flex gap-1'>
                                            {Array.from({
                                                length: monitoringProgress.max,
                                            }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                                        i <
                                                        monitoringProgress.current
                                                            ? 'bg-blue-500 scale-100'
                                                            : 'bg-neutral-700 scale-75'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span>
                                            {monitoringProgress.current}/
                                            {monitoringProgress.max}
                                        </span>
                                    </div>
                                )}
                        </div>

                        {/* Info message */}
                        <div className='bg-neutral-800/50 rounded-xl p-4 border border-neutral-800'>
                            <p className='text-xs text-neutral-400 text-center leading-relaxed'>
                                Please don't close this window while the
                                transaction is being processed
                            </p>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
