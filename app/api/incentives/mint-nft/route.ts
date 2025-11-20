/**
 * API Route: Mint NFT
 * 
 * Mints an incentive NFT for eligible users
 * POST /api/incentives/mint-nft
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import type { MintNFTRequest, MintNFTResponse } from '@/types/incentive'

const INCENTIVE_THRESHOLD_USD = 10 // $10 USD threshold for NFT

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: MintNFTRequest = await request.json()

    if (!body.wallet_address) {
      return NextResponse.json<MintNFTResponse>(
        { success: false, message: 'wallet_address is required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Get user incentive data
    const { data: userIncentive, error: fetchError } = await supabase
      .from(TABLES.USER_INCENTIVES)
      .select('*')
      .eq('wallet_address', body.wallet_address)
      .single()

    if (fetchError || !userIncentive) {
      return NextResponse.json<MintNFTResponse>(
        { success: false, message: 'User not found or no swaps recorded' },
        { status: 404 }
      )
    }

    // Check eligibility
    const totalSwappedUsd = (userIncentive as any).total_swapped_usd || 0
    if (totalSwappedUsd < INCENTIVE_THRESHOLD_USD) {
      return NextResponse.json<MintNFTResponse>(
        {
          success: false,
          message: `Insufficient swap volume. Need $${INCENTIVE_THRESHOLD_USD}, current: $${totalSwappedUsd.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Check if already minted
    if ((userIncentive as any).nft_minted) {
      return NextResponse.json<MintNFTResponse>(
        {
          success: false,
          message: 'NFT already minted for this wallet',
          nft: {
            tokenId: (userIncentive as any).nft_token_id || '',
            serialNumber: (userIncentive as any).nft_serial_number || '',
            mintedAt: (userIncentive as any).nft_minted_at || '',
            explorerUrl: `https://hashscan.io/mainnet/token/${(userIncentive as any).nft_token_id}/${(userIncentive as any).nft_serial_number}`,
          },
        },
        { status: 400 }
      )
    }

    // TODO: Implement actual NFT minting using Hedera SDK
    // This is a placeholder that will be implemented in Phase 4
    const nftTokenId = process.env.NFT_TOKEN_ID
    const nftTreasuryId = process.env.NFT_TREASURY_ID
    const nftTreasuryKey = process.env.NFT_TREASURY_PRIVATE_KEY

    if (!nftTokenId || !nftTreasuryId || !nftTreasuryKey) {
      return NextResponse.json<MintNFTResponse>(
        {
          success: false,
          message: 'NFT configuration not set. Please contact support.',
          error: 'Missing NFT environment variables',
        },
        { status: 500 }
      )
    }

    // Placeholder for NFT minting logic
    // In Phase 4, this will call the actual minting function
    try {
      // const nftInfo = await mintIncentiveNFT(body.wallet_address, metadata)
      
      // For now, return a simulated response
      const simulatedSerialNumber = `${Date.now()}`
      const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'
      const mintedAt = new Date().toISOString()

      // Update database
      const updateClient: any = supabaseAdmin()
      const { error: updateError } = await updateClient
        .from('user_incentives')
        .update({
          nft_minted: true,
          nft_token_id: nftTokenId,
          nft_serial_number: simulatedSerialNumber,
          nft_minted_at: mintedAt,
          updated_at: mintedAt,
        })
        .eq('wallet_address', body.wallet_address)

      if (updateError) {
        console.error('Error updating user incentives:', updateError)
        return NextResponse.json<MintNFTResponse>(
          { success: false, message: 'Failed to update database after minting' },
          { status: 500 }
        )
      }

      const explorerUrl = `https://hashscan.io/${network}/token/${nftTokenId}/${simulatedSerialNumber}`

      return NextResponse.json<MintNFTResponse>({
        success: true,
        nft: {
          tokenId: nftTokenId,
          serialNumber: simulatedSerialNumber,
          mintedAt,
          explorerUrl,
        },
        message: 'NFT minted successfully!',
      })
    } catch (mintError) {
      console.error('Error minting NFT:', mintError)
      return NextResponse.json<MintNFTResponse>(
        {
          success: false,
          message: 'Failed to mint NFT',
          error: mintError instanceof Error ? mintError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in mint-nft endpoint:', error)
    return NextResponse.json<MintNFTResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
