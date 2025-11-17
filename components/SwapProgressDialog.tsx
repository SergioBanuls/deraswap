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
    Circle,
    AlertCircle,
} from 'lucide-react'

// Define all swap process steps in order (simplified view)
const SWAP_PROCESS_STEPS: Array<{
    keys: SwapStep[] // Multiple steps can map to one display step
    label: string
    description: string
}> = [
    {
        keys: ['validating'],
        label: 'Validating',
        description: 'Validating swap parameters',
    },
    {
        keys: ['ensuring_adapter_tokens'],
        label: 'Preparing Adapters',
        description: 'Ensuring adapter supports tokens',
    },
    {
        keys: [
            'checking_association',
            'requesting_association',
            'checking_allowance',
            'requesting_approval',
        ],
        label: 'Token Permissions',
        description: 'Checking association and allowances',
    },
    {
        keys: ['building_transaction'],
        label: 'Building Transaction',
        description: 'Preparing swap transaction',
    },
    {
        keys: ['awaiting_signature'],
        label: 'Sign Transaction',
        description: 'Waiting for wallet signature',
    },
    {
        keys: ['sending_transaction'],
        label: 'Sending Transaction',
        description: 'Broadcasting to network',
    },
    {
        keys: ['monitoring'],
        label: 'Confirming',
        description: 'Waiting for confirmation',
    },
]

type StepStatus = 'pending' | 'active' | 'completed' | 'error'

interface ProcessStepProps {
    label: string
    description: string
    status: StepStatus
    isLast: boolean
}

function ProcessStep({ label, description, status, isLast }: ProcessStepProps) {
    return (
        <div className='flex gap-3'>
            {/* Icon column */}
            <div className='flex flex-col items-center'>
                {/* Icon */}
                <div className='relative flex-shrink-0'>
                    {status === 'completed' && (
                        <div className='relative'>
                            <div className='absolute inset-0 bg-green-500/20 rounded-full blur-sm' />
                            <CheckCircle2 className='relative w-5 h-5 text-green-500' />
                        </div>
                    )}
                    {status === 'active' && (
                        <div className='relative'>
                            <div className='absolute inset-0 bg-blue-500/20 rounded-full blur-sm animate-pulse' />
                            <Loader2 className='relative w-5 h-5 text-blue-500 animate-spin' />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className='relative'>
                            <div className='absolute inset-0 bg-red-500/20 rounded-full blur-sm' />
                            <XCircle className='relative w-5 h-5 text-red-500' />
                        </div>
                    )}
                    {status === 'pending' && (
                        <Circle className='w-5 h-5 text-neutral-600' />
                    )}
                </div>

                {/* Connector line */}
                {!isLast && (
                    <div
                        className={`w-0.5 h-8 mt-1 transition-colors duration-300 ${
                            status === 'completed'
                                ? 'bg-green-500/30'
                                : status === 'error'
                                  ? 'bg-red-500/30'
                                  : 'bg-neutral-700'
                        }`}
                    />
                )}
            </div>

            {/* Content */}
            <div className='flex-1 pb-8'>
                <div
                    className={`font-medium transition-colors duration-200 ${
                        status === 'completed'
                            ? 'text-green-400'
                            : status === 'active'
                              ? 'text-blue-400'
                              : status === 'error'
                                ? 'text-red-400'
                                : 'text-neutral-500'
                    }`}
                >
                    {label}
                </div>
                <div
                    className={`text-xs mt-0.5 transition-colors duration-200 ${
                        status === 'active'
                            ? 'text-neutral-400'
                            : 'text-neutral-600'
                    }`}
                >
                    {description}
                </div>
            </div>
        </div>
    )
}

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

    // Track the last valid step before error
    const [lastValidStep, setLastValidStep] = useState<SwapStep>(currentStep)

    // Update last valid step
    useEffect(() => {
        if (currentStep !== 'idle' && currentStep !== 'error' && currentStep !== 'success') {
            setLastValidStep(currentStep)
        }
    }, [currentStep])

    // Reset when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setLastValidStep('idle')
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
                className='sm:max-w-[520px] bg-neutral-900 border border-neutral-800 p-0 gap-0 overflow-hidden'
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
                    <div className='p-6 space-y-6'>
                        {/* Header with icon */}
                        <div className='text-center space-y-3'>
                            <div className='flex justify-center'>
                                <div className='relative'>
                                    <div className='absolute inset-0 bg-red-500/20 rounded-full blur-xl' />
                                    <div className='relative bg-red-500/10 p-3 rounded-full'>
                                        <XCircle className='w-10 h-10 text-red-500' />
                                    </div>
                                </div>
                            </div>

                            <div className='space-y-1'>
                                <h3 className='text-xl font-bold text-white'>
                                    Transaction Failed
                                </h3>
                                <p className='text-neutral-400 text-sm'>
                                    Something went wrong with your swap
                                </p>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className='bg-red-500/5 border border-red-500/20 rounded-xl p-4'>
                                <p className='text-sm text-red-400 leading-relaxed break-words'>
                                    {error.length > 200
                                        ? error.substring(0, 200) + '...'
                                        : error}
                                </p>
                            </div>
                        )}

                        {/* Process Steps showing where it failed */}
                        <div>
                            <p className='text-xs text-neutral-500 mb-3 px-1'>
                                Process steps:
                            </p>
                            <div className='bg-neutral-800/30 rounded-xl p-4 border border-neutral-800 max-h-[280px] overflow-y-auto'>
                                {SWAP_PROCESS_STEPS.map((step, index) => {
                                    let status: StepStatus = 'pending'

                                    // Find which step failed using lastValidStep
                                    const errorStepIndex =
                                        SWAP_PROCESS_STEPS.findIndex((s) =>
                                            s.keys.includes(lastValidStep)
                                        )

                                    if (index < errorStepIndex) {
                                        status = 'completed'
                                    } else if (index === errorStepIndex) {
                                        status = 'error'
                                    }

                                    return (
                                        <ProcessStep
                                            key={step.keys.join('-')}
                                            label={step.label}
                                            description={step.description}
                                            status={status}
                                            isLast={
                                                index ===
                                                SWAP_PROCESS_STEPS.length - 1
                                            }
                                        />
                                    )
                                })}
                            </div>
                        </div>

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
                    <div className='p-6 space-y-6'>
                        {/* Header */}
                        <div className='text-center space-y-2'>
                            <h3 className='text-xl font-semibold text-white'>
                                Processing Swap
                            </h3>
                            <p className='text-sm text-neutral-400'>
                                Please wait while we process your transaction
                            </p>
                        </div>

                        {/* Process Steps */}
                        <div className='bg-neutral-800/30 rounded-xl p-5 border border-neutral-800 max-h-[400px] overflow-y-auto'>
                            {SWAP_PROCESS_STEPS.map((step, index) => {
                                // Calculate step status
                                let status: StepStatus = 'pending'

                                // Find which display step the current execution step belongs to
                                const currentStepIndex =
                                    SWAP_PROCESS_STEPS.findIndex((s) =>
                                        s.keys.includes(currentStep)
                                    )

                                if (index < currentStepIndex) {
                                    status = 'completed'
                                } else if (index === currentStepIndex) {
                                    status = 'active'
                                }

                                return (
                                    <ProcessStep
                                        key={step.keys.join('-')}
                                        label={step.label}
                                        description={step.description}
                                        status={status}
                                        isLast={
                                            index ===
                                            SWAP_PROCESS_STEPS.length - 1
                                        }
                                    />
                                )
                            })}
                        </div>

                        {/* Monitoring Progress */}
                        {currentStep === 'monitoring' && monitoringProgress && (
                            <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
                                <div className='flex items-center justify-center gap-3'>
                                    <div className='flex gap-1'>
                                        {Array.from({
                                            length: monitoringProgress.max,
                                        }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                                    i <
                                                    monitoringProgress.current
                                                        ? 'bg-blue-500 scale-100'
                                                        : 'bg-neutral-700 scale-75'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className='text-xs text-blue-400 font-medium'>
                                        {monitoringProgress.current}/
                                        {monitoringProgress.max} confirmations
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Info message */}
                        <div className='bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/50'>
                            <div className='flex items-center justify-center gap-2'>
                                <AlertCircle className='w-4 h-4 text-neutral-500' />
                                <p className='text-xs text-neutral-400'>
                                    Don't close this window during processing
                                </p>
                            </div>
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
