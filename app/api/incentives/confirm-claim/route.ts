/**
 * API Route: Confirm Claim NFT
 * 
 * Updates the database after user successfully claims their NFT
 * POST /api/incentives/confirm-claim
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import type {
  ConfirmClaimNFTRequest,
  ConfirmClaimNFTResponse,
  Mission,
} from '@/types/incentive'
import type { Database } from '@/types/supabase.types'

type UserIncentive = Database['public']['Tables']['user_incentives']['Row']

interface ClaimMissionResult {
  success: boolean
  message: string
  serial_number?: number
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ConfirmClaimNFTRequest = await request.json()

    if (!body.wallet_address || !body.transaction_id || !body.mission_id) {
      return NextResponse.json<ConfirmClaimNFTResponse>(
        {
          success: false,
          message: 'wallet_address, transaction_id, and mission_id are required',
        },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // Call PostgreSQL function to atomically claim the mission
    const { data, error: claimError } = (await (supabase as any)
      .rpc('claim_mission', {
        p_user_wallet: body.wallet_address,
        p_mission_id: body.mission_id,
        p_transaction_id: body.transaction_id,
      })
      .single()) as { data: ClaimMissionResult | null; error: any }

    const claimResult = data

    if (claimError || !claimResult) {
      console.error('❌ Error claiming mission:', claimError)
      return NextResponse.json<ConfirmClaimNFTResponse>(
        { 
          success: false, 
          message: claimResult?.message || 'Failed to confirm claim',
          error: claimError?.message 
        },
        { status: 500 }
      )
    }

    // Check if claim was successful
    if (!claimResult.success) {
      return NextResponse.json<ConfirmClaimNFTResponse>(
        {
          success: false,
          message: claimResult.message || 'Failed to claim mission',
        },
        { status: 400 }
      )
    }

    // Get mission details for response
    const { data: missionData } = (await supabase
      .from('missions')
      .select('nft_token_id')
      .eq('id', body.mission_id)
      .single()) as { data: Mission | null; error: any }

    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'
    const mintedAt = new Date().toISOString()
    const serialNumber = claimResult.serial_number?.toString() || '0'

    const explorerUrl = `https://hashscan.io/${network}/transaction/${body.transaction_id}`

    // Also update user_incentives for backward compatibility
    await (supabase as any)
      .from(TABLES.USER_INCENTIVES)
      .update({
        nft_minted: true,
        nft_token_id: missionData?.nft_token_id,
        nft_serial_number: serialNumber,
        nft_minted_at: mintedAt,
        updated_at: mintedAt,
      })
      .eq('wallet_address', body.wallet_address)

    return NextResponse.json<ConfirmClaimNFTResponse>({
      success: true,
      nft: {
        tokenId: missionData?.nft_token_id || '',
        serialNumber,
        mintedAt,
        explorerUrl,
        transactionId: body.transaction_id,
      },
      message: 'NFT claim confirmed successfully!',
    })
  } catch (error) {
    console.error('Error in confirm-claim endpoint:', error)
    return NextResponse.json<ConfirmClaimNFTResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
