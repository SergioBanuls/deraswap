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

/**
 * Request body for claiming NFT
 */
export interface ClaimNFTRequest {
  wallet_address: string
  mission_id?: string // Optional mission ID, uses default if not provided
}

/**
 * Response from claiming NFT with transaction bytes for user to sign
 */
export interface ClaimNFTResponse {
  success: boolean
  transactionBytes?: string // Base64 encoded transaction bytes for user to sign
  mission_id?: string // Mission ID for confirmation
  serial_number?: number // Serial number being claimed
  message?: string
  error?: string
}

/**
 * Request body for confirming NFT claim after user signs transaction
 */
export interface ConfirmClaimNFTRequest {
  wallet_address: string
  transaction_id: string // Hedera transaction ID
  mission_id: string // Mission UUID
}

/**
 * Response from confirming NFT claim
 */
export interface ConfirmClaimNFTResponse {
  success: boolean
  nft?: NFTInfo
  message?: string
  error?: string
}

/**
 * Mission definition
 */
export interface Mission {
  id: string
  name: string
  description: string | null
  mission_type: 'swap_volume' | 'swap_count' | 'custom'
  requirement_value: number
  nft_token_id: string
  available_serials: number[]
  max_claims: number
  current_claims: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * User mission claim record
 */
export interface UserMissionClaim {
  id: string
  user_wallet_address: string
  mission_id: string
  nft_serial_number: number
  claimed_at: string
  transaction_id: string
}
