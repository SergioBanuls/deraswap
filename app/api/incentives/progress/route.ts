/**
 * API Route: Get Progress
 * 
 * Returns the user's incentive progress
 * GET /api/incentives/progress?wallet_address=0.0.XXXXX
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import type { GetProgressResponse } from '@/types/incentive'

const INCENTIVE_THRESHOLD_USD = 10 // $10 USD threshold for NFT

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'wallet_address is required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    console.log('🔍 Fetching progress for wallet:', walletAddress)

    // Get user incentive data
    const { data: userIncentive, error } = await supabase
      .from(TABLES.USER_INCENTIVES)
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is OK
      console.error('❌ Error fetching user incentives:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: error.message || 'Failed to fetch progress',
          error: error 
        },
        { status: 500 }
      )
    }

    // If no record exists, return default values
    if (!userIncentive) {
      return NextResponse.json<GetProgressResponse>({
        success: true,
        progress: {
          totalSwappedUsd: 0,
          progress: 0,
          nftEligible: false,
          nftMinted: false,
        },
      })
    }

    // Calculate progress
    const totalSwappedUsd = (userIncentive as any).total_swapped_usd || 0
    const progressPercentage = Math.min(
      (totalSwappedUsd / INCENTIVE_THRESHOLD_USD) * 100,
      100
    )
    const nftEligible = totalSwappedUsd >= INCENTIVE_THRESHOLD_USD
    const nftMinted = (userIncentive as any).nft_minted || false

    let nftInfo = undefined
    if (nftMinted && (userIncentive as any).nft_token_id && (userIncentive as any).nft_serial_number) {
      // Determine explorer URL based on network
      const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'
      const explorerUrl = `https://hashscan.io/${network}/token/${(userIncentive as any).nft_token_id}/${(userIncentive as any).nft_serial_number}`

      nftInfo = {
        tokenId: (userIncentive as any).nft_token_id,
        serialNumber: (userIncentive as any).nft_serial_number,
        mintedAt: (userIncentive as any).nft_minted_at || '',
        explorerUrl,
      }
    }

    return NextResponse.json<GetProgressResponse>({
      success: true,
      progress: {
        totalSwappedUsd,
        progress: progressPercentage,
        nftEligible,
        nftMinted,
        nftInfo,
      },
    })
  } catch (error) {
    console.error('Error in progress endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
