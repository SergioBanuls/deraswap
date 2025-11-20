/**
 * API Route: Record Swap
 * 
 * Records a swap transaction in the database and updates user's incentive progress
 * POST /api/incentives/record-swap
 * 
 * SECURITY: Validates transaction on Hedera Mirror Node to prevent fraud
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import type { RecordSwapRequest, RecordSwapResponse } from '@/types/incentive'

const INCENTIVE_THRESHOLD_USD = 10 // $10 USD threshold for NFT

/**
 * Normalize transaction ID format
 * Converts "0.0.1234@1234567890.123456789" to "0.0.1234-1234567890-123456789"
 */
function normalizeTransactionId(txId: string): string {
  if (txId.includes('@')) {
    const [accountId, timestamp] = txId.split('@')
    const [seconds, nanos] = timestamp.split('.')
    return `${accountId}-${seconds}-${nanos}`
  }
  return txId
}

/**
 * Verify transaction on Hedera Mirror Node (via Validation Cloud)
 * Returns the actual transaction data if valid, null if invalid
 */
async function verifyTransactionOnMirrorNode(txHash: string, expectedWallet: string) {
  try {
    const VALIDATION_CLOUD_BASE_URL = process.env.VALIDATION_CLOUD_BASE_URL || 'https://mainnet.hedera.validationcloud.io/v1'
    const VALIDATION_CLOUD_API_KEY = process.env.VALIDATION_CLOUD_API_KEY

    const baseUrlWithKey = VALIDATION_CLOUD_API_KEY
      ? `${VALIDATION_CLOUD_BASE_URL}/${VALIDATION_CLOUD_API_KEY}`
      : VALIDATION_CLOUD_BASE_URL

    const normalizedTxId = normalizeTransactionId(txHash)
    const url = `${baseUrlWithKey}/api/v1/transactions/${normalizedTxId}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Mirror node returned ${response.status} for tx ${txHash} (normalized: ${normalizedTxId})`)
      return null
    }

    const data = await response.json()

    if (!data.transactions || data.transactions.length === 0) {
      console.error(`No transaction found for ${txHash}`)
      return null
    }

    const tx = data.transactions[0]

    // Verify transaction was successful
    if (tx.result !== 'SUCCESS') {
      console.error(`Transaction ${txHash} was not successful: ${tx.result}`)
      return null
    }

    // Verify the wallet address matches
    const txWallet = `${tx.entity_id}` // Format: 0.0.xxxxx
    if (txWallet !== expectedWallet) {
      console.error(`Wallet mismatch: expected ${expectedWallet}, got ${txWallet}`)
      return null
    }

    // Verify transaction type is a token transfer or contract call (swap)
    const validTypes = ['CONTRACTCALL', 'CRYPTOTRANSFER', 'TOKENTRANSFER']
    if (!validTypes.includes(tx.name)) {
      console.error(`Invalid transaction type: ${tx.name}`)
      return null
    }

    return tx
  } catch (error) {
    console.error('Error verifying transaction:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RecordSwapRequest = await request.json()

    // Validate required fields
    if (
      !body.wallet_address ||
      !body.tx_hash ||
      body.from_token_address === undefined ||
      body.to_token_address === undefined ||
      !body.from_amount ||
      !body.to_amount ||
      body.usd_value === undefined ||
      !body.timestamp
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate USD value is positive
    if (body.usd_value <= 0) {
      return NextResponse.json(
        { success: false, message: 'USD value must be greater than 0' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin()

    // SECURITY: Verify transaction on Hedera Mirror Node
    // Can be disabled for development with SKIP_TX_VERIFICATION=true
    const skipVerification = process.env.SKIP_TX_VERIFICATION === 'true'

    if (!skipVerification) {
      console.log(`🔍 Verifying transaction ${body.tx_hash} for wallet ${body.wallet_address}`)
      const verifiedTx = await verifyTransactionOnMirrorNode(body.tx_hash, body.wallet_address)

      if (!verifiedTx) {
        console.error(`❌ Transaction verification failed for ${body.tx_hash}`)
        return NextResponse.json(
          {
            success: false,
            message: 'Transaction verification failed. Invalid or unauthorized transaction.'
          },
          { status: 403 }
        )
      }

      console.log(`✅ Transaction ${body.tx_hash} verified successfully`)
    } else {
      console.warn(`⚠️ Transaction verification SKIPPED (development mode)`)
    }

    // Check if tx_hash already exists (prevent duplicates)
    const { data: existingSwap } = await supabase
      .from(TABLES.SWAP_HISTORY)
      .select('id')
      .eq('tx_hash', body.tx_hash)
      .single()

    if (existingSwap) {
      // Already recorded, just return current progress
      const progress = await getUserProgress(body.wallet_address)
      return NextResponse.json({
        success: true,
        progress,
        message: 'Swap already recorded',
      })
    }

    // Insert swap record
    const insertClient: any = supabase
    const { error: swapError } = await insertClient
      .from(TABLES.SWAP_HISTORY)
      .insert({
        wallet_address: body.wallet_address,
        tx_hash: body.tx_hash,
        from_token_address: body.from_token_address,
        to_token_address: body.to_token_address,
        from_amount: body.from_amount,
        to_amount: body.to_amount,
        usd_value: body.usd_value,
        timestamp: body.timestamp,
      })

    if (swapError) {
      console.error('Error inserting swap record:', swapError)
      return NextResponse.json(
        { success: false, message: 'Failed to record swap' },
        { status: 500 }
      )
    }

    // Update or create user incentive record
    await updateUserIncentives(body.wallet_address, body.usd_value)

    // Get updated progress
    const progress = await getUserProgress(body.wallet_address)

    return NextResponse.json({
      success: true,
      progress,
      message: 'Swap recorded successfully',
    })
  } catch (error) {
    console.error('Error in record-swap endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update user's total swapped USD
 */
async function updateUserIncentives(
  walletAddress: string,
  usdValue: number
): Promise<void> {
  const supabase = supabaseAdmin()

  // Check if user record exists
  const { data: existingUser } = await supabase
    .from(TABLES.USER_INCENTIVES)
    .select('total_swapped_usd')
    .eq('wallet_address', walletAddress)
    .single()

  if (existingUser) {
    // Update existing record
    const newTotal = ((existingUser as any).total_swapped_usd || 0) + usdValue

    const updateClient: any = supabase
    await updateClient
      .from(TABLES.USER_INCENTIVES)
      .update({
        total_swapped_usd: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress)
  } else {
    // Create new record
    const insertClient: any = supabase
    await insertClient.from(TABLES.USER_INCENTIVES).insert({
      wallet_address: walletAddress,
      total_swapped_usd: usdValue,
    })
  }
}

/**
 * Get user's progress toward NFT incentive
 */
async function getUserProgress(walletAddress: string) {
  const supabase = supabaseAdmin()

  const { data: userIncentive } = await supabase
    .from(TABLES.USER_INCENTIVES)
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  if (!userIncentive) {
    return {
      totalSwappedUsd: 0,
      progress: 0,
      nftEligible: false,
      nftMinted: false,
    }
  }

  const totalSwappedUsd = (userIncentive as any).total_swapped_usd || 0
  const progress = Math.min((totalSwappedUsd / INCENTIVE_THRESHOLD_USD) * 100, 100)
  const nftEligible = totalSwappedUsd >= INCENTIVE_THRESHOLD_USD
  const nftMinted = (userIncentive as any).nft_minted || false

  let nftInfo = undefined
  if (nftMinted && (userIncentive as any).nft_token_id && (userIncentive as any).nft_serial_number) {
    nftInfo = {
      tokenId: (userIncentive as any).nft_token_id,
      serialNumber: (userIncentive as any).nft_serial_number,
      mintedAt: (userIncentive as any).nft_minted_at || '',
      explorerUrl: `https://hashscan.io/mainnet/token/${(userIncentive as any).nft_token_id}/${(userIncentive as any).nft_serial_number}`,
    }
  }

  return {
    totalSwappedUsd,
    progress,
    nftEligible,
    nftMinted,
    nftInfo,
  }
}
