/**
 * Incentive System Types
 * 
 * Types for the NFT incentive system that rewards users
 * for swapping over $10 USD worth of tokens.
 */

/**
 * Record of a single swap transaction in the history
 */
export interface SwapHistoryRecord {
  id: string
  wallet_address: string
  tx_hash: string
  from_token_address: string
  to_token_address: string
  from_amount: string
  to_amount: string
  usd_value: number
  timestamp: string
  created_at: string
}

/**
 * User incentive progress and NFT status
 */
export interface UserIncentive {
  id: string
  wallet_address: string
  total_swapped_usd: number
  nft_minted: boolean
  nft_token_id?: string
  nft_serial_number?: string
  nft_minted_at?: string
  created_at: string
  updated_at: string
}

/**
 * Progress information for the user's incentive journey
 */
export interface IncentiveProgress {
  totalSwappedUsd: number
  progress: number // 0-100 percentage
  nftEligible: boolean // true if >= $10
  nftMinted: boolean
  nftInfo?: NFTInfo
}

/**
 * Information about the minted NFT
 */
export interface NFTInfo {
  tokenId: string
  serialNumber: string
  mintedAt: string
  explorerUrl: string
  transactionId?: string
}

/**
 * Metadata for the NFT (stored on IPFS)
 */
export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
}

/**
 * NFT attribute/trait
 */
export interface NFTAttribute {
  trait_type: string
  value: string | number
}

/**
 * Request body for recording a swap
 */
export interface RecordSwapRequest {
  wallet_address: string
  tx_hash: string
  from_token_address: string
  to_token_address: string
  from_amount: string
  to_amount: string
  usd_value: number
  timestamp: string
}

/**
 * Response from recording a swap
 */
export interface RecordSwapResponse {
  success: boolean
  progress: IncentiveProgress
  message?: string
}

/**
 * Request body for minting NFT
 */
export interface MintNFTRequest {
  wallet_address: string
}

/**
 * Response from minting NFT
 */
export interface MintNFTResponse {
  success: boolean
  nft?: NFTInfo
  message?: string
  error?: string
}

/**
 * Response from getting progress
 */
export interface GetProgressResponse {
  success: boolean
  progress?: IncentiveProgress
  message?: string
}
