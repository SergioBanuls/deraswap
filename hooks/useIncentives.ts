/**
 * useIncentives Hook
 * 
 * Manages user incentive progress and NFT minting
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import type {
  IncentiveProgress,
  NFTInfo,
  GetProgressResponse,
  MintNFTResponse,
} from '@/types/incentive'
import { toast } from 'sonner'

interface UseIncentivesResult {
  progress: IncentiveProgress | null
  loading: boolean
  error: string | null
  refetchProgress: () => Promise<void>
  claimNFT: () => Promise<{ success: boolean; nft?: NFTInfo }>
  isClaiming: boolean
}

export function useIncentives(walletAddress: string | null): UseIncentivesResult {
  const [progress, setProgress] = useState<IncentiveProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  /**
   * Fetch user's incentive progress
   */
  const fetchProgress = useCallback(async () => {
    if (!walletAddress) {
      setProgress(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/incentives/progress?wallet_address=${encodeURIComponent(walletAddress)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`)
      }

      const data: GetProgressResponse = await response.json()

      if (data.success && data.progress) {
        setProgress(data.progress)
      } else {
        throw new Error(data.message || 'Failed to fetch progress')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching incentive progress:', err)
      
      // Set default progress on error
      setProgress({
        totalSwappedUsd: 0,
        progress: 0,
        nftEligible: false,
        nftMinted: false,
      })
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  /**
   * Claim NFT reward
   */
  const claimNFT = useCallback(async (): Promise<{
    success: boolean
    nft?: NFTInfo
  }> => {
    if (!walletAddress) {
      toast.error('Please connect your wallet')
      return { success: false }
    }

    if (!progress?.nftEligible) {
      toast.error('Not eligible for NFT yet')
      return { success: false }
    }

    if (progress?.nftMinted) {
      toast.info('NFT already claimed')
      return { success: false }
    }

    setIsClaiming(true)
    setError(null)

    try {
      const response = await fetch('/api/incentives/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })

      const data: MintNFTResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to mint NFT')
      }

      // Update local progress
      if (data.nft) {
        setProgress((prev) =>
          prev
            ? {
                ...prev,
                nftMinted: true,
                nftInfo: data.nft,
              }
            : null
        )

        toast.success('NFT claimed successfully! 🎉', {
          description: 'Check your wallet for the DeraSwap Pioneer NFT',
          duration: 5000,
        })

        return { success: true, nft: data.nft }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error claiming NFT:', err)
      
      toast.error('Failed to claim NFT', {
        description: errorMessage,
      })

      return { success: false }
    } finally {
      setIsClaiming(false)
    }
  }, [walletAddress, progress])

  /**
   * Refresh progress (alias for fetchProgress)
   */
  const refetchProgress = useCallback(async () => {
    await fetchProgress()
  }, [fetchProgress])

  // Fetch progress on mount and when wallet changes
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return {
    progress,
    loading,
    error,
    refetchProgress,
    claimNFT,
    isClaiming,
  }
}
