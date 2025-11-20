/**
 * useIncentives Hook
 * 
 * Manages user incentive progress and NFT claiming
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import type {
  IncentiveProgress,
  NFTInfo,
  GetProgressResponse,
  ClaimNFTResponse,
  ConfirmClaimNFTResponse,
} from '@/types/incentive'
import { toast } from 'sonner'
import { useReownConnect } from './useReownConnect'
import { useAssociateToken } from './useAssociateToken'

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
  const { signer, executeTransactionWithSigner, callNativeMethod } = useReownConnect()
  const { associateToken } = useAssociateToken()

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
   * This implements a 3-step flow:
   * 1. Request transaction bytes from backend
   * 2. Sign and execute transaction with user's wallet
   * 3. Confirm claim in backend database
   */
  const claimNFT = useCallback(async (): Promise<{
    success: boolean
    nft?: NFTInfo
  }> => {
    if (!walletAddress) {
      toast.error('Please connect your wallet')
      return { success: false }
    }

    if (!signer) {
      toast.error('Wallet signer not available. Please reconnect your wallet.')
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
      // Step 0: Get NFT token ID from backend to associate
      toast.loading('Preparing NFT claim...', { id: 'claim-nft' })
      
      const nftTokenId = process.env.NEXT_PUBLIC_NFT_TOKEN_ID || process.env.NFT_TOKEN_ID
      
      if (!nftTokenId) {
        throw new Error('NFT Token ID not configured')
      }

      // Step 1: Associate NFT token to user's account
      toast.loading('Associating NFT to your account...', { id: 'claim-nft' })
      
      const associationSuccess = await associateToken(nftTokenId)
      
      if (!associationSuccess) {
        throw new Error('Failed to associate NFT token. Please try again.')
      }

      toast.success('NFT token associated successfully!', { id: 'claim-nft', duration: 2000 })

      // Small delay to ensure association is processed
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 2: Get transaction bytes from backend
      toast.loading('Creating claim transaction...', { id: 'claim-nft' })
      
      // Use default mission ID if not in env
      const missionId = process.env.NEXT_PUBLIC_DEFAULT_MISSION_ID

      const claimResponse = await fetch('/api/incentives/claim-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          wallet_address: walletAddress,
          mission_id: missionId,
        }),
      })

      const claimData: ClaimNFTResponse = await claimResponse.json()

      if (!claimResponse.ok || !claimData.success || !claimData.transactionBytes) {
        throw new Error(claimData.message || 'Failed to create claim transaction')
      }

      // Step 3: Sign and execute transaction with user's wallet
      toast.loading('Please sign the transaction in your wallet...', { id: 'claim-nft' })
      
      // Execute using WalletConnect method
      // The transaction bytes are already in base64 format from the backend
      const result = await callNativeMethod('hedera_signAndExecuteTransaction', {
        transaction: claimData.transactionBytes, // Send as base64 string
      })
      
      toast.loading('Waiting for transaction confirmation...', { id: 'claim-nft' })
      
      if (!result?.transactionId) {
        throw new Error('Transaction execution failed - no transaction ID returned')
      }

      const transactionId = result.transactionId

      // Step 4: Confirm claim in backend
      toast.loading('Confirming NFT claim...', { id: 'claim-nft' })

      const confirmResponse = await fetch('/api/incentives/confirm-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          transaction_id: transactionId,
          mission_id: claimData.mission_id || missionId, // Use mission_id from claim response
        }),
      })

      const confirmData: ConfirmClaimNFTResponse = await confirmResponse.json()

      if (!confirmResponse.ok || !confirmData.success) {
        throw new Error(confirmData.message || 'Failed to confirm claim')
      }

      // Update local progress
      if (confirmData.nft) {
        setProgress((prev) =>
          prev
            ? {
                ...prev,
                nftMinted: true,
                nftInfo: confirmData.nft,
              }
            : null
        )

        toast.success('NFT claimed successfully! 🎉', {
          id: 'claim-nft',
          description: 'Check your wallet for the DeraSwap Badge NFT',
          duration: 5000,
        })

        return { success: true, nft: confirmData.nft }
      }

      toast.success('NFT claimed successfully!', { id: 'claim-nft' })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error claiming NFT:', err)
      
      toast.error('Failed to claim NFT', {
        id: 'claim-nft',
        description: errorMessage,
      })

      return { success: false }
    } finally {
      setIsClaiming(false)
    }
  }, [walletAddress, progress, signer])

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
