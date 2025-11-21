'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Copy, LogOut, Check, Trophy, Target, Sparkles, Zap, Shield, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useReownConnect } from '@/hooks/useReownConnect'
import { IncentiveProgress } from '@/components/IncentiveProgress'

interface MissionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
}

export function MissionsSheet({
  open,
  onOpenChange,
  accountId,
}: MissionsSheetProps) {
  const { disconnect } = useReownConnect()
  const [isCopied, setIsCopied] = useState(false)

  const handleDisconnect = async () => {
    try {
      await disconnect()
      onOpenChange(false)
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(accountId)
      setIsCopied(true)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-md border-l border-white/10 bg-[#0a0a0a] p-0 overflow-hidden flex flex-col'>
        {/* Background Effects */}
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          <div className='absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px]' />
          <div className='absolute bottom-[-20%] left-[-20%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]' />
        </div>

        {/* Header */}
        <div className='relative z-10 p-6 pb-4 border-b border-white/5 backdrop-blur-xl bg-black/20'>
          <SheetHeader className='mb-6'>
            <SheetTitle className='flex items-center gap-3 text-white text-xl font-bold tracking-tight'>
              <div className='p-2 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30'>
                <Trophy className='w-5 h-5 text-amber-400' />
              </div>
              Mission Center
            </SheetTitle>
          </SheetHeader>

          {/* Profile Card */}
          <div className='relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all'>
            <div className='absolute inset-0 bg-linear-to-r from-blue-500/10 to-cyan-500/10 opacity-0 transition-opacity duration-500' />
            
            <div className='relative flex items-center gap-4'>
              <div className='relative'>
                <div className='w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 p-[2px]'>
                  <div className='w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden'>
                    <div className='w-full h-full bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center'>
                      <span className='text-lg font-bold text-white'>
                        {accountId.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center'>
                  <div className='w-1.5 h-1.5 bg-white rounded-full animate-pulse' />
                </div>
              </div>

              <div className='flex-1 min-w-0'>
                <p className='text-xs text-neutral-400 font-medium mb-0.5'>Connected Account</p>
                <p className='text-sm font-mono text-white font-semibold truncate'>
                  {accountId}
                </p>
              </div>
            </div>

            <div className='relative mt-4 flex gap-2'>
              <Button
                onClick={handleCopyAddress}
                variant='ghost'
                size='sm'
                className={`flex-1 h-8 text-xs font-medium transition-all duration-300 ${
                  isCopied
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className='w-3 h-3 mr-2' />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className='w-3 h-3 mr-2' />
                    Copy ID
                  </>
                )}
              </Button>

              <Button
                onClick={handleDisconnect}
                variant='ghost'
                size='sm'
                className='flex-1 h-8 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300'
              >
                <LogOut className='w-3 h-3 mr-2' />
                Disconnect
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className='relative z-10 flex-1 overflow-y-auto p-6 pt-2 space-y-6'>
          {/* Active Missions */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-bold text-white flex items-center gap-2'>
                <Target className='w-4 h-4 text-blue-400' />
                Active Missions
              </h3>
              <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30'>
                LIVE
              </span>
            </div>

            {/* Mission Card */}
            <div className='relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-900/20 to-black/40 p-1'>
              <div className='absolute inset-0 bg-linear-to-br from-blue-500/10 via-transparent to-transparent opacity-50' />
              
              <div className='relative bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl p-4 space-y-4'>
                <div className='flex items-start gap-4'>
                  <div className='relative group'>
                    <div className='absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity' />
                    <div className='relative w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-xl'>
                      <Crown className='w-6 h-6 text-white' />
                    </div>
                  </div>
                  
                  <div className='flex-1'>
                    <h4 className='text-base font-bold text-white mb-1'>
                      Early Swaper
                    </h4>
                    <p className='text-xs text-neutral-400 leading-relaxed'>
                      Reach a <span className='text-blue-300 font-bold'>$10+ USD</span> swap volume.
                    </p>
                  </div>
                </div>

                <div className='h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent' />

                {/* Progress Component */}
                <IncentiveProgress walletAddress={accountId} />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
