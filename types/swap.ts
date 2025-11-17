/**
 * Type definitions for swap-related functionality
 *
 * Includes swap settings, validation results, and transaction parameters.
 */

export interface SwapSettings {
  slippageTolerance: number; // Percentage (e.g., 0.5 = 0.5%)
  deadline: number; // Unix timestamp (seconds)
  autoSlippage: boolean; // Whether to auto-calculate based on price impact
}

export interface SwapValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export const DEFAULT_SWAP_SETTINGS: SwapSettings = {
  slippageTolerance: 0.5, // 0.5% default (used when autoSlippage is off)
  deadline: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes from now
  autoSlippage: true, // Auto mode enabled by default
};

export const SLIPPAGE_PRESETS = [0.5, 1.0, 2.0, 4.0]; // Common slippage presets

export const MAX_SLIPPAGE = 50; // 50% maximum allowed
export const HIGH_SLIPPAGE_WARNING = 5; // Warn if > 5%
export const HIGH_PRICE_IMPACT_WARNING = 15; // Warn if price impact > 15%
