/**
 * Utility functions for validating swap routes
 *
 * Protects against malicious routes, untrusted aggregators,
 * and suspicious token paths.
 */

import { TokenId } from '@hashgraph/sdk';
import { SwapRoute } from '@/types/route';
import { Token } from '@/types/token';

export interface RouteValidationConfig {
  trustedAggregators: string[];
  trustedTokens: Set<string>;
  maxHops: number;
  maxPriceImpact: number;
  userSlippageTolerance?: number; // User's selected slippage tolerance
}

/**
 * Default configuration for route validation
 *
 * Add more aggregators and tokens as they are verified
 */
export const DEFAULT_ROUTE_CONFIG: RouteValidationConfig = {
  trustedAggregators: [
    'SaucerSwap',
    'SaucerSwapV1',
    'SaucerSwapV1_v2', // v2: Redeployed with Path library fix ✅ ACTIVE!
    'SaucerSwapV2',
    'SaucerSwapV2_V5', // v5: Direct HBAR transfer (failed)
    'SaucerSwapV2_V8', // v8: Fixed transferFrom (no admin key)
    'SaucerSwapV2_V9', // v9: Fixed transferFrom + admin key
    'SaucerSwapV2_V10', // v10: Correct wHBAR address (0x163b5a) - no auto associations
    'SaucerSwapV2_V12', // v12: Auto token associations enabled + correct wHBAR
    'SaucerSwapV2_EXACT', // EXACT: Código exacto ETASwap - missing auto-associations
    'SaucerSwapV2_EXACT2', // EXACT2: 100% EXACTO como ETASwap ✅ ACTIVE!
    'Pangolin',
    'HeliSwap',
    'ETASwap',
    // Add more trusted aggregators as needed
  ],
  trustedTokens: new Set([
    '0.0.1456986', // WHBAR
    '0.0.456858',  // USDC
    '0.0.731861',  // SAUCE
    '0.0.1449990', // HBARX
    '0.0.1495261', // PACK
    // Add more trusted tokens as needed
  ]),
  maxHops: 3,
  maxPriceImpact: 20, // 20%
};

export interface RouteValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a swap route for safety
 *
 * @param route - The swap route to validate
 * @param fromToken - Source token
 * @param toToken - Destination token
 * @param config - Validation configuration
 * @returns Validation result
 */
export function validateRoute(
  route: SwapRoute,
  fromToken: Token,
  toToken: Token,
  config: RouteValidationConfig = DEFAULT_ROUTE_CONFIG
): RouteValidationResult {
  // 1. Validate aggregators are trusted
  const aggregators = Array.isArray(route.aggregatorId)
    ? route.aggregatorId
    : [route.aggregatorId];

  for (const agg of aggregators) {
    if (!config.trustedAggregators.includes(agg)) {
      return {
        valid: false,
        reason: `Untrusted aggregator: ${agg}`,
      };
    }
  }

  // 2. Validate route paths
  const paths = Array.isArray(route.route[0]) ? route.route : [route.route];

  for (const path of paths as string[][]) {
    // Verify path length (number of hops)
    if (path.length - 1 > config.maxHops) {
      return {
        valid: false,
        reason: `Too many hops: ${path.length - 1} (max: ${config.maxHops})`,
      };
    }

    // Verify first and last tokens match
    const firstToken = path[0];
    const lastToken = path[path.length - 1];

    // Use solidity addresses from token objects
    const fromAddr = fromToken.solidityAddress;
    const toAddr = toToken.solidityAddress;

    // HBAR native address (0x0) - ETASwap sometimes returns this for HBAR
    const HBAR_NATIVE = '0x0000000000000000000000000000000000000000';

    // Check if first token matches (allowing HBAR native address)
    const firstTokenMatches = 
      firstToken.toLowerCase() === fromAddr.toLowerCase() ||
      (fromToken.symbol === 'HBAR' && firstToken.toLowerCase() === HBAR_NATIVE.toLowerCase());

    // Check if last token matches (allowing HBAR native address)
    const lastTokenMatches = 
      lastToken.toLowerCase() === toAddr.toLowerCase() ||
      (toToken.symbol === 'HBAR' && lastToken.toLowerCase() === HBAR_NATIVE.toLowerCase());

    if (!firstTokenMatches) {
      return {
        valid: false,
        reason: 'Route does not start with fromToken',
      };
    }

    if (!lastTokenMatches) {
      return {
        valid: false,
        reason: 'Route does not end with toToken',
      };
    }
  }

  // 3. Validate price impact is reasonable
  // First check against absolute maximum (20%)
  if (Math.abs(route.priceImpact) > config.maxPriceImpact) {
    return {
      valid: false,
      reason: `Price impact too high: ${Math.abs(route.priceImpact).toFixed(2)}% (max: ${config.maxPriceImpact}%)`,
    };
  }

  // Then check against user's slippage tolerance if provided
  // Note: Negative price impact means you're getting MORE than expected (good)
  // Only reject if price impact is negative (bad) and exceeds tolerance
  if (config.userSlippageTolerance !== undefined && route.priceImpact < 0) {
    const absolutePriceImpact = Math.abs(route.priceImpact);
    if (absolutePriceImpact > config.userSlippageTolerance) {
      return {
        valid: false,
        reason: `Price impact (${absolutePriceImpact.toFixed(2)}%) exceeds your slippage tolerance (${config.userSlippageTolerance}%)`,
      };
    }
  }

  // 4. Validate gas estimate is reasonable
  if (route.gasEstimate <= 0) {
    return {
      valid: false,
      reason: 'Invalid gas estimate: must be positive',
    };
  }

  if (route.gasEstimate > 10000000) {
    return {
      valid: false,
      reason: 'Suspicious gas estimate: too high',
    };
  }

  // 5. Validate output amount is positive
  const totalOutput = Array.isArray(route.amountTo)
    ? route.amountTo.reduce(
        (sum, amt) => BigInt(sum) + BigInt(amt),
        BigInt(0)
      )
    : BigInt(route.amountTo);

  if (totalOutput <= BigInt(0)) {
    return {
      valid: false,
      reason: 'Invalid output amount: must be positive',
    };
  }

  // 6. Validate transaction type is recognized
  const validTypes = ['SWAP', 'SPLIT_SWAP', 'INDIRECT_SWAP'];
  if (!validTypes.includes(route.transactionType)) {
    return {
      valid: false,
      reason: `Unknown transaction type: ${route.transactionType}`,
    };
  }

  return { valid: true };
}

/**
 * Filter and validate multiple routes
 *
 * @param routes - Array of routes to validate
 * @param fromToken - Source token
 * @param toToken - Destination token
 * @param config - Validation configuration
 * @returns Filtered array of valid routes
 */
export function filterValidRoutes(
  routes: SwapRoute[],
  fromToken: Token,
  toToken: Token,
  config?: RouteValidationConfig
): SwapRoute[] {
  const results: SwapRoute[] = [];

  routes.forEach((route, index) => {
    const validation = validateRoute(route, fromToken, toToken, config);
    if (!validation.valid) {
      console.warn(`Route #${index + 1} rejected:`, {
        reason: validation.reason,
        aggregator: route.aggregatorId,
        type: route.transactionType,
        priceImpact: route.priceImpact.toFixed(2) + '%',
        gas: route.gasEstimate
      });
    } else {
      console.log(`✓ Route #${index + 1} valid:`, {
        aggregator: route.aggregatorId,
        output: route.outputAmountFormatted,
        priceImpact: route.priceImpact.toFixed(2) + '%'
      });
      results.push(route);
    }
  });

  return results;
}
