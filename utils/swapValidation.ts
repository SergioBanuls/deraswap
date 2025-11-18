/**
 * Utility functions for validating swap parameters
 *
 * Includes validation for slippage, price impact, deadlines, and overall swap safety.
 */

import { SwapSettings, SwapValidationResult } from '@/types/swap';
import { SwapRoute } from '@/types/route';
import {
  MAX_SLIPPAGE,
  HIGH_SLIPPAGE_WARNING,
  HIGH_PRICE_IMPACT_WARNING,
} from '@/types/swap';

interface ValidateSwapParams {
  route: SwapRoute;
  settings: SwapSettings;
  currentPrice?: number;
  isAutoMode?: boolean;
}

/**
 * Validate all swap parameters before execution
 */
export function validateSwap(params: ValidateSwapParams): SwapValidationResult {
  const { route, settings, isAutoMode } = params;

  // Validate price impact
  // In auto mode, show warning instead of blocking when price impact is high
  if (Math.abs(route.priceImpact) > HIGH_PRICE_IMPACT_WARNING) {
    if (isAutoMode) {
      return {
        valid: true,
        warning: `High price impact (${Math.abs(route.priceImpact).toFixed(2)}%). This swap may result in significant loss. Proceed with caution.`,
      };
    }
    return {
      valid: false,
      error: `Price impact too high (${Math.abs(route.priceImpact).toFixed(2)}%). Transaction likely to fail or result in significant loss.`,
    };
  }

  // Validate slippage is reasonable
  if (settings.slippageTolerance > MAX_SLIPPAGE) {
    return {
      valid: false,
      error: `Slippage tolerance exceeds maximum (${MAX_SLIPPAGE}%).`,
    };
  }

  if (settings.slippageTolerance <= 0) {
    return {
      valid: false,
      error: 'Slippage tolerance must be greater than 0.',
    };
  }

  // Warn about high slippage (but don't block)
  if (settings.slippageTolerance > HIGH_SLIPPAGE_WARNING) {
    return {
      valid: true,
      warning: `High slippage tolerance (${settings.slippageTolerance}%).`,
    };
  }

  // Validate deadline
  const now = Math.floor(Date.now() / 1000);
  if (settings.deadline <= now) {
    return {
      valid: false,
      error: 'Transaction deadline has already passed.',
    };
  }

  // Validate gas estimate is reasonable
  if (route.gasEstimate <= 0 || route.gasEstimate > 10000000) {
    return {
      valid: false,
      error: 'Invalid gas estimate. Route may be malicious.',
    };
  }

  return { valid: true };
}

/**
 * Validate slippage tolerance value
 */
export function validateSlippage(slippage: number): SwapValidationResult {
  if (isNaN(slippage) || slippage < 0) {
    return {
      valid: false,
      error: 'Slippage must be a positive number.',
    };
  }

  if (slippage === 0) {
    return {
      valid: false,
      error: 'Slippage cannot be 0. Transaction will likely fail.',
    };
  }

  if (slippage > MAX_SLIPPAGE) {
    return {
      valid: false,
      error: `Slippage cannot exceed ${MAX_SLIPPAGE}%.`,
    };
  }

  if (slippage > HIGH_SLIPPAGE_WARNING) {
    return {
      valid: true,
      warning: `High slippage (${slippage}%).`,
    };
  }

  return { valid: true };
}

/**
 * Calculate recommended slippage based on price impact
 */
export function calculateRecommendedSlippage(priceImpact: number): number {
  const absPriceImpact = Math.abs(priceImpact);

  if (absPriceImpact < 0.1) return 0.5; // Low impact
  if (absPriceImpact < 1) return 1.0; // Medium impact
  if (absPriceImpact < 3) return 2.0; // Higher impact
  return 3.0; // High impact
}
