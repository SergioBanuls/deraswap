'use client'

import { useState } from 'react'
import { useReownContext } from '@/contexts/ReownProvider'
import { MissionsSheet } from './MissionsSheet'
import { Button } from './ui/button'
import { Trophy, Loader2, ArrowRight, Wallet } from 'lucide-react'

export function SessionActionButtons() {
    const { account, loading, isConnected, disconnect, connect } =
        useReownContext()

    const [isMissionsSheetOpen, setIsMissionsSheetOpen] = useState(false)

    const handleConnectClick = async () => {
        await connect()
    }

    const formatAccount = (acc: string) => {
        return `${acc.slice(0, 6)}...${acc.slice(-4)}`
    }

    if (account)
        return (
            <>
                <Button
                    onClick={() => setIsMissionsSheetOpen(true)}
                    variant="ghost"
                    className='relative group overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-white rounded-full pl-2 pr-4 h-11 transition-all duration-300'
                >
                    <div className='absolute inset-0 bg-linear-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

                    <div className='flex items-center gap-3 relative z-10'>
                        <div className='w-7 h-7 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 p-[1px] shadow-lg shadow-blue-500/20'>
                            <div className='w-full h-full rounded-full bg-black flex items-center justify-center'>
                                <Trophy className='w-3.5 h-3.5 text-amber-400' />
                            </div>
                        </div>
                        <div className='flex flex-col items-start gap-0.5'>
                            <span className='font-mono font-bold text-sm tracking-tight leading-none'>
                                {formatAccount(account)}
                            </span>
                            <span className='text-[10px] text-blue-300 font-medium leading-none'>
                                View Missions
                            </span>
                        </div>
                    </div>
                </Button>
                <MissionsSheet
                    open={isMissionsSheetOpen}
                    onOpenChange={setIsMissionsSheetOpen}
                    accountId={account}
                />
            </>
        )

    return (
        <Button
            onClick={handleConnectClick}
            disabled={loading}
            className='relative overflow-hidden bg-blue-500 text-white hover:bg-blue-600 font-bold h-11 px-6 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
        >
            {loading ? (
                <span className='flex items-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Connecting...
                </span>
            ) : (
                <span className='flex items-center gap-2'>
                    <Wallet className='w-4 h-4' />
                    Connect Wallet
                </span>
            )}
        </Button>
    )
}
