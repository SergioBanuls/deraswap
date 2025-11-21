'use client'

import { useIncentives } from '@/hooks/useIncentives'
import { Button } from '@/components/ui/button'
import { Gift, Sparkles, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface IncentiveProgressProps {
  walletAddress: string
}

export function IncentiveProgress({ walletAddress }: IncentiveProgressProps) {
  const { progress, loading, isClaiming, claimNFT, refetchProgress } = useIncentives(walletAddress)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleClaim = async () => {
    const success = await claimNFT()
    if (success) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      // Refetch progress to update UI
      refetchProgress()
    }
  }

  if (loading) {
    return (
      <div className='w-full py-2 animate-pulse space-y-3'>
        <div className='flex justify-between'>
          <div className='h-3 bg-white/10 rounded w-1/4'></div>
          <div className='h-3 bg-white/10 rounded w-1/4'></div>
        </div>
        <div className='h-4 bg-white/10 rounded-full w-full'></div>
        <div className='h-3 bg-white/10 rounded w-1/2'></div>
      </div>
    )
  }

  if (!progress) return null

  const progressPercentage = Math.min((progress.totalSwappedUsd / 10) * 100, 100)
  const isEligible = progress.nftEligible && !progress.nftMinted
  const alreadyClaimed = progress.nftMinted

  return (
    <div className='w-full space-y-4 relative'>
      {showConfetti && (
        <div className='absolute inset-0 pointer-events-none flex items-center justify-center z-50'>
          <div className='text-6xl animate-bounce'>🎉</div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className='space-y-2'>
        <div className='flex justify-between items-end'>
          <span className='text-xs font-medium text-neutral-400'>
            Progress Tracker
          </span>
          <div className='flex items-baseline gap-1'>
            <span className='text-lg font-bold text-white'>
              ${progress.totalSwappedUsd.toFixed(2)}
            </span>
            <span className='text-xs font-medium text-neutral-500'>
              / $10.00
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='relative w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner'>
          <div
            className='absolute top-0 left-0 h-full bg-linear-to-r from-purple-600 via-pink-500 to-purple-600 transition-all duration-1000 ease-out rounded-full'
            style={{ width: `${progressPercentage}%` }}
          >
            <div className='absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12' />
            {progressPercentage > 0 && (
              <div className='absolute right-0 top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.5)]' />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className='flex items-center gap-2'>
          {alreadyClaimed ? (
            <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400'>
              <CheckCircle2 className='w-4 h-4' />
              <span className='text-xs font-bold'>
                Mission Complete!
              </span>
            </div>
          ) : isEligible ? (
            <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 animate-pulse'>
              <Sparkles className='w-4 h-4' />
              <span className='text-xs font-bold'>
                Goal Reached! Claim Reward
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-neutral-400'>
              <TrendingUp className='w-3 h-3' />
              <span className='text-xs'>
                <span className='text-white font-medium'>${(10 - progress.totalSwappedUsd).toFixed(2)}</span> more to unlock
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Claim Button */}
      {isEligible && (
        <Button
          onClick={handleClaim}
          disabled={isClaiming}
          className='w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-purple-900/20 transition-all duration-300 hover:shadow-purple-900/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
        >
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />

          {isClaiming ? (
            <span className='flex items-center gap-2'>
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              Minting Badge...
            </span>
          ) : (
            <span className='flex items-center gap-2'>
              <Gift className='w-5 h-5 animate-bounce' />
              Claim NFT Reward
              <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </span>
          )}
        </Button>
      )}

      {/* Already Claimed Info */}
      {alreadyClaimed && progress.nftInfo && (
        <div className='mt-4 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl relative overflow-hidden group'>
          <div className='absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors' />

          <div className='flex items-start gap-3 relative z-10'>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-bold text-green-400 mb-1 uppercase tracking-wider'>
                Reward Claimed
              </p>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-neutral-400'>Token ID</span>
                  <span className='text-white font-mono'>{progress.nftInfo.tokenId}</span>
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-neutral-400'>Serial</span>
                  <span className='text-white font-mono'>#{progress.nftInfo.serialNumber}</span>
                </div>
              </div>

              <a
                href={progress.nftInfo.explorerUrl || `https://hashscan.io/${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'}/token/${progress.nftInfo.tokenId}/${progress.nftInfo.serialNumber}`}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-3 flex items-center justify-center w-full py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-xs font-medium text-green-400 transition-colors'
              >
                View on HashScan
                <ArrowRight className='w-3 h-3 ml-1' />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
