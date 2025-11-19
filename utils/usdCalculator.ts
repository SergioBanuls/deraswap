/**
 * USD Calculator Utility
 * 
 * Calculates the USD value of token swaps using token prices
 */

import { Token } from '@/types/token'

/**
 * Calculate the USD value of a swap
 * @param token The token being swapped
 * @param amount The raw amount in smallest units (e.g., wei for ETH)
 * @param tokenPrice The price of the token in USD (from TokenPricesContext)
 * @returns The USD value of the swap, or 0 if price is unavailable
 */
export function calculateSwapUsdValue(
  token: Token,
  amount: string,
  tokenPrice?: number
): number {
  try {
    // If no price available, return 0
    if (!tokenPrice && !token.priceUsd && !token.price) {
      console.warn(`No price available for token ${token.symbol}`)
      return 0
    }

    // Get the price (priority: context price > token.priceUsd > token.price)
    const price = tokenPrice || token.priceUsd || token.price || 0

    // Parse the amount (assumed to be in smallest units)
    const amountBigInt = BigInt(amount)
    
    // Convert to decimal using token decimals
    // Formula: (amount / 10^decimals) * price
    const divisor = BigInt(10 ** token.decimals)
    const amountInTokens = Number(amountBigInt) / Number(divisor)
    
    // Calculate USD value
    const usdValue = amountInTokens * price

    return usdValue
  } catch (error) {
    console.error('Error calculating USD value:', error)
    return 0
  }
}

/**
 * Format USD value for display
 * @param usdValue The USD value to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string like "$10.50"
 */
export function formatUsdValue(usdValue: number, decimals: number = 2): string {
  return `$${usdValue.toFixed(decimals)}`
}

/**
 * Calculate the total USD value from multiple swaps
 * @param swaps Array of {token, amount, price} objects
 * @returns Total USD value
 */
export function calculateTotalUsdValue(
  swaps: Array<{
    token: Token
    amount: string
    price?: number
  }>
): number {
  return swaps.reduce((total, swap) => {
    const swapValue = calculateSwapUsdValue(swap.token, swap.amount, swap.price)
    return total + swapValue
  }, 0)
}

/**
 * Calculate USD value with better precision (uses string math to avoid float issues)
 * @param token The token
 * @param amount Raw amount in smallest units
 * @param tokenPrice Price in USD
 * @returns USD value as number
 */
export function calculateSwapUsdValuePrecise(
  token: Token,
  amount: string,
  tokenPrice?: number
): number {
  try {
    if (!tokenPrice && !token.priceUsd && !token.price) {
      return 0
    }

    const price = tokenPrice || token.priceUsd || token.price || 0
    
    // Use BigInt for precision
    const amountBigInt = BigInt(amount)
    const priceBigInt = BigInt(Math.floor(price * 1e8)) // Store price with 8 decimals
    const divisor = BigInt(10 ** token.decimals)
    
    // Calculate: (amount * price) / (10^decimals * 10^8)
    const usdValueBigInt = (amountBigInt * priceBigInt) / (divisor * BigInt(1e8))
    
    return Number(usdValueBigInt)
  } catch (error) {
    console.error('Error calculating precise USD value:', error)
    return 0
  }
}
