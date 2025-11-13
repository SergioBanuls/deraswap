'use client'

import { X } from 'lucide-react'

interface SwapButtonProps {
    onSwap: () => void
    isHistoryOpen?: boolean
}

export function SwapButton({ onSwap, isHistoryOpen = false }: SwapButtonProps) {
    return (
        <button
            onClick={onSwap}
            className='bg-neutral-800 hover:bg-neutral-700 p-3 rounded-full border-2 border-neutral-900 transition-colors'
            aria-label={isHistoryOpen ? 'Close History' : 'Swap Tokens'}
        >
            {isHistoryOpen ? (
                <X className='w-4 h-4 text-white' />
            ) : (
                <svg
                    className='w-4 h-4 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17 8l4 4m0 0l-4 4m4-4H3'
                    />
                </svg>
            )}
        </button>
    )
}
