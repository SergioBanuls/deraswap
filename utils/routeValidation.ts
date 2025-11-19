/**
 * Utility functions for validating swap routes
 *
 * Protects against malicious routes, untrusted aggregators,
 * suspicious token paths, and non-existent tokens.
 */

import { TokenId } from '@hashgraph/sdk';
import { SwapRoute } from '@/types/route';
import { Token } from '@/types/token';
import { extractAllTokensFromRoute } from '@/utils/pathUtils';

export interface RouteValidationConfig {
  trustedAggregators: string[];
  trustedTokens: Set<string>;
  blacklistedTokens: Set<string>; // Tokens that should NEVER be used in routes
  maxHops: number;
  maxPriceImpact: number;
  userSlippageTolerance?: number; // User's selected slippage tolerance
  isAutoMode?: boolean; // If true, always show at least one route even with high price impact
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
  blacklistedTokens: new Set([
    '0.0.4431990', // BSL (BankSocial) - Hedera ID format
    '0x43a076', // BSL (BankSocial) - EVM short format
    '0x000000000000000000000000000000000043a076', // BSL (BankSocial) - EVM full format
    // Known to cause swap failures due to non-existent intermediate tokens in routes
    // Add more problematic tokens here as they are discovered
  ]),
  maxHops: 3,
  maxPriceImpact: 20, // 20%
};

export interface RouteValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Cache for token existence checks to avoid repeated API calls
 */
const tokenExistsCache = new Map<string, boolean>();

/**
 * Convert EVM address to Hedera token ID
 * @param evmAddress - EVM address (0x...)
 * @returns Hedera token ID (0.0.X) or null if invalid
 */
function evmAddressToTokenId(evmAddress: string): string | null {
  if (!evmAddress || evmAddress === '0x0000000000000000000000000000000000000000') {
    return null; // HBAR native address
  }

  try {
    // Remove 0x prefix if present
    const cleanHex = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;

    // Convert hex to decimal
    const decimal = parseInt(cleanHex, 16);

    if (isNaN(decimal) || decimal === 0) {
      return null;
    }

    return `0.0.${decimal}`;
  } catch (error) {
    console.error('Error converting EVM address to token ID:', error);
    return null;
  }
}

/**
 * Check if a token exists on Hedera network
 * Uses Mirror Node API to verify token existence
 * Results are cached to avoid repeated API calls
 *
 * @param tokenAddress - Token address in Hedera format (0.0.X) or EVM format (0x...)
 * @returns Promise<boolean> - true if token exists, false otherwise
 */
async function checkTokenExists(tokenAddress: string): Promise<boolean> {
  // Check cache first
  if (tokenExistsCache.has(tokenAddress)) {
    return tokenExistsCache.get(tokenAddress)!;
  }

  // Convert EVM address to Hedera ID if needed
  let tokenId = tokenAddress;
  if (tokenAddress.startsWith('0x')) {
    const converted = evmAddressToTokenId(tokenAddress);
    if (!converted) {
      // HBAR native or invalid address
      return true; // Don't reject HBAR routes
    }
    tokenId = converted;
  }

  try {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet';
    const mirrorNodeUrl = network === 'mainnet'
      ? 'https://mainnet.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';

    const response = await fetch(`${mirrorNodeUrl}/api/v1/tokens/${tokenId}`, {
      // Use a short timeout to avoid blocking the UI
      signal: AbortSignal.timeout(5000),
    });

    const exists = response.ok;

    // Cache the result
    tokenExistsCache.set(tokenAddress, exists);
    tokenExistsCache.set(tokenId, exists);

    return exists;
  } catch (error) {
    console.warn(`Failed to verify token existence: ${tokenId}`, error);
    // On error, assume token exists to avoid rejecting valid routes
    // due to network issues
    return true;
  }
}

/**
 * Validate that a route does not contain blacklisted tokens
 * Checks both Hedera ID format (0.0.X) and EVM format (0x...)
 * @param route - The swap route to validate
 * @param config - Validation configuration with blacklist
 * @returns RouteValidationResult
 */
function validateNoBlacklistedTokens(
  route: SwapRoute,
  config: RouteValidationConfig
): RouteValidationResult {
  if (!config.blacklistedTokens || config.blacklistedTokens.size === 0) {
    return { valid: true }; // No blacklist configured
  }

  try {
    // Extract all token addresses from the route
    const tokenAddresses = extractAllTokensFromRoute(route, route.aggregatorId);

    // Check each address in both formats
    const blacklistedFound: string[] = [];

    for (const address of tokenAddresses) {
      // Normalize address to lowercase for comparison
      const normalizedAddress = address.toLowerCase();

      // Check if the address itself is blacklisted (EVM format)
      if (config.blacklistedTokens.has(normalizedAddress)) {
        blacklistedFound.push(address);
        continue;
      }

      // Convert to Hedera ID and check if blacklisted
      if (address.startsWith('0x')) {
        const hederaId = evmAddressToTokenId(address);
        if (hederaId && config.blacklistedTokens.has(hederaId)) {
          blacklistedFound.push(`${hederaId} (${address})`);
        }
      } else {
        // Already in Hedera format, check directly
        if (config.blacklistedTokens.has(address)) {
          blacklistedFound.push(address);
        }
      }
    }

    if (blacklistedFound.length > 0) {
      return {
        valid: false,
        reason: `Route contains blacklisted token(s): ${blacklistedFound.join(', ')}. This token is known to cause swap failures.`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error checking blacklisted tokens:', error);
    // On error, allow the route (conservative approach)
    return { valid: true };
  }
}

/**
 * Validate that all tokens in a route exist on the network
 * @param route - The swap route to validate
 * @returns Promise<RouteValidationResult>
 */
async function validateTokensExist(route: SwapRoute): Promise<RouteValidationResult> {
  try {
    // Extract all token addresses from the route
    const tokenAddresses = extractAllTokensFromRoute(route, route.aggregatorId);

    if (tokenAddresses.length === 0) {
      return { valid: true }; // No tokens to validate (shouldn't happen)
    }

    // Check each token exists
    const existenceChecks = await Promise.all(
      tokenAddresses.map(async (address) => ({
        address,
        exists: await checkTokenExists(address),
      }))
    );

    // Find any non-existent tokens
    const missingTokens = existenceChecks.filter((check) => !check.exists);

    if (missingTokens.length > 0) {
      const missingAddresses = missingTokens.map((t) => {
        const tokenId = evmAddressToTokenId(t.address);
        return tokenId || t.address;
      }).join(', ');

      return {
        valid: false,
        reason: `Route contains non-existent tokens: ${missingAddresses}`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating tokens existence:', error);
    // On error, assume tokens exist to avoid rejecting valid routes
    return { valid: true };
  }
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
  // In auto mode, we don't reject routes based on price impact
  // We'll show at least one route with a warning instead
  if (!config.isAutoMode) {
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
 * Filter and validate multiple routes (async version with token existence checks)
 *
 * @param routes - Array of routes to validate
 * @param fromToken - Source token
 * @param toToken - Destination token
 * @param config - Validation configuration
 * @returns Promise of filtered array of valid routes
 */
export async function filterValidRoutes(
  routes: SwapRoute[],
  fromToken: Token,
  toToken: Token,
  config?: RouteValidationConfig
): Promise<SwapRoute[]> {
  const results: SwapRoute[] = [];

  // Validate all routes in parallel for better performance
  const validationResults = await Promise.all(
    routes.map(async (route, index) => {
      // Step 0: Check blacklist FIRST (highest priority, sync, fastest)
      // This runs EVEN IN AUTO MODE - blacklisted tokens are NEVER allowed
      if (config) {
        const blacklistValidation = validateNoBlacklistedTokens(route, config);
        if (!blacklistValidation.valid) {
          return {
            route,
            index,
            valid: false,
            reason: blacklistValidation.reason,
          };
        }
      }

      // Step 1: Check basic route validity (sync)
      const basicValidation = validateRoute(route, fromToken, toToken, config);
      if (!basicValidation.valid) {
        return {
          route,
          index,
          valid: false,
          reason: basicValidation.reason,
        };
      }

      // Step 2: Check token existence (async)
      const tokenValidation = await validateTokensExist(route);
      if (!tokenValidation.valid) {
        return {
          route,
          index,
          valid: false,
          reason: tokenValidation.reason,
        };
      }

      return {
        route,
        index,
        valid: true,
      };
    })
  );

  // Process results
  validationResults.forEach(({ route, index, valid, reason }) => {
    if (!valid) {
      console.warn(`Route #${index + 1} rejected:`, {
        reason,
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

  // In auto mode, try to return at least one route (the best available)
  // HOWEVER: NEVER return routes with blacklisted tokens, even in auto mode
  if (config?.isAutoMode && results.length === 0 && routes.length > 0) {
    // Find the best route that is NOT blacklisted
    let bestNonBlacklistedRoute = null;

    for (const route of routes) {
      const blacklistCheck = config ? validateNoBlacklistedTokens(route, config) : { valid: true };
      if (blacklistCheck.valid) {
        bestNonBlacklistedRoute = route;
        break; // Routes are already sorted by best output, so first valid one is best
      }
    }

    if (bestNonBlacklistedRoute) {
      console.warn('⚠️ Auto mode: Showing best route despite validation issues:', {
        aggregator: bestNonBlacklistedRoute.aggregatorId,
        output: bestNonBlacklistedRoute.outputAmountFormatted,
        priceImpact: bestNonBlacklistedRoute.priceImpact.toFixed(2) + '%'
      });
      results.push(bestNonBlacklistedRoute);
    } else {
      console.error('❌ Auto mode: All routes contain blacklisted tokens - cannot show any route');
    }
  }

  return results;
}
