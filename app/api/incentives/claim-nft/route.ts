/**
 * API Route: Claim NFT
 * 
 * Creates a transaction for the user to claim their mission NFT reward
 * The user must sign and pay for the transaction
 * POST /api/incentives/claim-nft
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  TokenId,
  TransactionId,
} from '@hashgraph/sdk'
import type { ClaimNFTRequest, ClaimNFTResponse, Mission } from '@/types/incentive'

const INCENTIVE_THRESHOLD_USD = 10 // $10 USD threshold for NFT
const DEFAULT_MISSION_ID = process.env.DEFAULT_MISSION_ID || '' // Pioneer mission ID

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ClaimNFTRequest = await request.json()

    if (!body.wallet_address) {
      return NextResponse.json<ClaimNFTResponse>(
        { success: false, message: 'wallet_address is required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    const nftWalletId = process.env.NFT_WALLET_ID
    const nftWalletPrivateKey = process.env.NFT_WALLET_PRIVATE_KEY
    const hederaNetwork = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'

    if (!nftWalletId || !nftWalletPrivateKey) {
      console.error('Missing NFT configuration:', {
        hasWalletId: !!nftWalletId,
        hasPrivateKey: !!nftWalletPrivateKey,
      })
      return NextResponse.json<ClaimNFTResponse>(
        {
          success: false,
          message: 'NFT configuration not set. Please contact support.',
          error: 'Missing NFT environment variables',
        },
        { status: 500 }
      )
    }

    const supabase = supabaseAdmin()

    // Get mission ID (use default Pioneer mission for now)
    const missionId = body.mission_id || DEFAULT_MISSION_ID
    
    if (!missionId) {
      return NextResponse.json<ClaimNFTResponse>(
        { success: false, message: 'Mission ID is required' },
        { status: 400 }
      )
    }

    // Get mission details
    const { data: mission, error: missionError } = (await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .eq('is_active', true)
      .single()) as { data: Mission | null; error: any }

    if (missionError || !mission) {
      console.error('❌ Error fetching mission:', missionError)
      return NextResponse.json<ClaimNFTResponse>(
        { success: false, message: 'Mission not found or inactive' },
        { status: 404 }
      )
    }

    // Check if user already claimed this mission
    const { data: existingClaim } = await supabase
      .from('user_mission_claims')
      .select('*')
      .eq('user_wallet_address', body.wallet_address)
      .eq('mission_id', missionId)
      .single()

    if (existingClaim) {
      return NextResponse.json<ClaimNFTResponse>(
        {
          success: false,
          message: 'Mission already claimed',
        },
        { status: 400 }
      )
    }

    // Check eligibility based on mission type
    if (mission.mission_type === 'swap_volume') {
      const { data: userIncentive } = (await supabase
        .from(TABLES.USER_INCENTIVES)
        .select('total_swapped_usd')
        .eq('wallet_address', body.wallet_address)
        .single()) as { data: any; error: any }

      const totalSwappedUsd = Number(userIncentive?.total_swapped_usd) || 0
      if (totalSwappedUsd < mission.requirement_value) {
        return NextResponse.json<ClaimNFTResponse>(
          {
            success: false,
            message: `Insufficient swap volume. Need $${mission.requirement_value}, current: $${totalSwappedUsd.toFixed(2)}`,
          },
          { status: 400 }
        )
      }
    }

    // Check if mission has available claims
    if (mission.current_claims >= mission.max_claims) {
      return NextResponse.json<ClaimNFTResponse>(
        {
          success: false,
          message: 'Mission has reached maximum claims',
        },
        { status: 400 }
      )
    }

    // Check if there are available serial numbers
    if (!mission.available_serials || mission.available_serials.length === 0) {
      return NextResponse.json<ClaimNFTResponse>(
        {
          success: false,
          message: 'No available NFTs for this mission',
        },
        { status: 400 }
      )
    }

    // Get the first available serial number
    const serialNumber = mission.available_serials[0]
    const nftTokenId = mission.nft_token_id

    try {
      // Initialize Hedera client
      const client =
        hederaNetwork === 'mainnet' ? Client.forMainnet() : Client.forTestnet()

      console.log('🔍 Claim NFT Debug Info:')
      console.log('  - User wallet:', body.wallet_address)
      console.log('  - NFT Token ID:', nftTokenId)
      console.log('  - NFT Wallet ID:', nftWalletId)
      console.log('  - Network:', hederaNetwork)

      // Parse accounts and keys
      const nftAccount = AccountId.fromString(nftWalletId)
      const nftPrivateKey = PrivateKey.fromString(nftWalletPrivateKey)
      const userAccount = AccountId.fromString(body.wallet_address)
      const tokenId = TokenId.fromString(nftTokenId)

      console.log('✅ Parsed successfully:')
      console.log('  - NFT Account:', nftAccount.toString())
      console.log('  - User Account:', userAccount.toString())
      console.log('  - Token ID:', tokenId.toString())
      console.log('  - NFT Serial Number:', serialNumber)
      console.log('  - Mission ID:', missionId)

      // Create transfer transaction
      // The NFT wallet transfers the NFT to the user
      // Important: The user will be the payer when they sign and execute
      const transaction = await new TransferTransaction()
        .addNftTransfer(tokenId, serialNumber, nftAccount, userAccount)
        .setTransactionMemo('DeraSwap Incentive NFT Claim')
        .setTransactionId(TransactionId.generate(userAccount)) // User is the payer
        .freezeWith(client)

      // Sign with NFT wallet's private key (authorizes the NFT transfer)
      const signedTransaction = await transaction.sign(nftPrivateKey)

      // Convert transaction to bytes for the user to sign
      const transactionBytes = Buffer.from(
        signedTransaction.toBytes()
      ).toString('base64')

      // Close client
      client.close()

      // Return transaction bytes for user to sign
      // DO NOT update database yet - will be updated after user confirms transaction
      return NextResponse.json<ClaimNFTResponse>({
        success: true,
        transactionBytes,
        mission_id: missionId,
        serial_number: serialNumber,
        message:
          'Transaction created. Please sign with your wallet to claim the NFT.',
      } as any)
    } catch (hederaError) {
      console.error('Error creating Hedera transaction:', hederaError)
      return NextResponse.json<ClaimNFTResponse>(
        {
          success: false,
          message: 'Failed to create claim transaction',
          error:
            hederaError instanceof Error
              ? hederaError.message
              : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in claim-nft endpoint:', error)
    return NextResponse.json<ClaimNFTResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
