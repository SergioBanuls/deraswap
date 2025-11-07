/**
 * Hook for fetching swap routes from ETASwap API
 *
 * Uses TanStack Query for intelligent caching and deduplication.
 * Validates inputs before making API calls to prevent overflow/underflow.
 * Routes are cached for 30 seconds and deduplicated within 5 seconds.
 *
 * @param fromToken - Source token
 * @param toToken - Destination token
 * @param amount - Amount to swap (human-readable format)
 * @param balance - Optional user balance for validation
 * @returns {Object} - TanStack Query result with routes data
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { TokenId } from '@hashgraph/sdk';
import axios from 'axios';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';
import { validateAmount, formatAmount } from '@/utils/amountValidation';
import { filterValidRoutes, DEFAULT_ROUTE_CONFIG } from '@/utils/routeValidation';

const ETASWAP_API_BASE_URL = 'https://api.etaswap.com/v1';
const WHBAR_TOKEN_ID = '0.0.1456986';

interface FetchRoutesParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  balance?: string;
  slippageTolerance?: number;
}

async function fetchSwapRoutes({
  fromToken,
  toToken,
  amount,
  balance,
  slippageTolerance,
}: FetchRoutesParams): Promise<SwapRoute[]> {
  // Validate amount before making API call
  const validation = validateAmount(amount, fromToken.decimals, balance);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid amount');
  }

  // Use validated/sanitized amount
  const inputAmount = validation.sanitized!;

  // Handle HBAR → WHBAR conversion
  const fromTokenId = fromToken.id === 'HBAR' ? WHBAR_TOKEN_ID : fromToken.id;
  const toTokenId = toToken.id === 'HBAR' ? WHBAR_TOKEN_ID : toToken.id;

  // Convert token IDs to Solidity addresses
  const tokenFromAddress =
    '0x' + TokenId.fromString(fromTokenId).toSolidityAddress();
  const tokenToAddress =
    '0x' + TokenId.fromString(toTokenId).toSolidityAddress();

  // Fetch routes from ETASwap API
  const url = `${ETASWAP_API_BASE_URL}/rates`;
  const params = {
    tokenFrom: tokenFromAddress,
    tokenTo: tokenToAddress,
    amount: inputAmount,
    isReverse: false,
  };

  console.log('ETASwap API request:', { url, params });

  const response = await axios.get(url, { params });
  const etaRoutes = response.data;

  console.log(`ETASwap returned ${etaRoutes?.length || 0} routes`);

  if (!Array.isArray(etaRoutes)) {
    throw new Error('Invalid response format from ETASwap API');
  }

  if (etaRoutes.length === 0) {
    console.warn('No routes found from ETASwap');
    return [];
  }

  // IMPORTANTE: Solo usamos rutas de SaucerSwapV2 porque es el único adapter configurado
  // El adapter está registrado como "SaucerSwapV2" en el Exchange
  // All fixes applied: WHBAR address, fee handling via wrap
  // Debug: Ver qué aggregators devuelve ETASwap
  const aggregators = etaRoutes.map((r: any) => r.aggregatorId);
  console.log('Available aggregators from ETASwap:', [...new Set(aggregators)]);
  
  // Try SaucerSwapV2 first, fallback to SaucerSwap (V1) if needed
  let saucerRoutes = etaRoutes.filter((route: any) => 
    route.aggregatorId === 'SaucerSwapV2'
  );
  
  // If no V2 routes, try V1 (they use the same router)
  if (saucerRoutes.length === 0) {
    console.warn('No SaucerSwapV2 routes, trying SaucerSwap V1...');
    saucerRoutes = etaRoutes.filter((route: any) => 
      route.aggregatorId === 'SaucerSwap' || route.aggregatorId === 'SaucerSwapV1'
    );
  }

  // Cambiar el aggregatorId a nuestro nombre registrado
  // EXACT2 = 100% EXACTO como ETASwap (código + configuración)
  saucerRoutes.forEach((route: any) => {
    route.aggregatorId = 'SaucerSwapV2_EXACT2';
  });

  console.log(`Filtered to SaucerSwap routes: ${saucerRoutes.length}/${etaRoutes.length} routes`);

  if (saucerRoutes.length === 0) {
    console.warn('No SaucerSwap routes available. ETASwap returned other DEXs that are not supported.');
    console.warn('Available routes:', etaRoutes.map((r: any) => ({ aggregator: r.aggregatorId, pools: r.pools?.length })));
    throw new Error('No compatible routes found. Only SaucerSwap is supported.');
  }

  // Process routes and add computed fields
  const processedRoutes: SwapRoute[] = saucerRoutes.map((route: any) => {
    // Calculate total output amount
    let totalAmountTo: string;
    if (Array.isArray(route.amountTo)) {
      // Sum up all amounts for split swaps
      totalAmountTo = route.amountTo.reduce(
        (sum: string, amt: string) => (BigInt(sum) + BigInt(amt)).toString(),
        '0'
      );
    } else {
      totalAmountTo = route.amountTo;
    }

    // Format output amount
    const outputAmountFormatted = formatAmount(
      totalAmountTo,
      toToken.decimals
    );

    // Calculate price impact using USD values
    // Price impact = (actualValue - expectedValue) / expectedValue * 100
    const inputAmountHuman = parseFloat(formatAmount(inputAmount, fromToken.decimals));
    const outputAmountHuman = parseFloat(outputAmountFormatted);

    const expectedValueUSD = inputAmountHuman * fromToken.priceUsd;
    const actualValueUSD = outputAmountHuman * toToken.priceUsd;

    // Calculate price impact as percentage difference
    const priceImpact = expectedValueUSD > 0
      ? ((actualValueUSD - expectedValueUSD) / expectedValueUSD) * 100
      : 0;

    return {
      transactionType: route.transactionType,
      aggregatorId: route.aggregatorId,
      amountFrom: route.amountFrom,
      amountTo: route.amountTo,
      path: route.path,
      route: route.route,
      gasEstimate: route.gasEstimate,
      outputAmountFormatted,
      priceImpact,
    };
  });

  // Log processed routes for debugging
  console.log('Processed routes:', processedRoutes.map(r => ({
    type: r.transactionType,
    aggregator: r.aggregatorId,
    output: r.outputAmountFormatted,
    priceImpact: r.priceImpact.toFixed(2) + '%',
    gasEstimate: r.gasEstimate
  })));

  // Filter out malicious or invalid routes
  // Pass user's slippage tolerance to filter routes based on price impact
  const validRoutes = filterValidRoutes(processedRoutes, fromToken, toToken, {
    ...DEFAULT_ROUTE_CONFIG,
    userSlippageTolerance: slippageTolerance,
  });

  console.log(`Valid routes after filtering: ${validRoutes.length}/${processedRoutes.length}`);

  if (validRoutes.length === 0 && processedRoutes.length > 0) {
    console.error('All routes were rejected by validation');
    throw new Error(
      'No valid routes found. All routes failed security validation.'
    );
  }

  return validRoutes;
}

export function useSwapRoutes(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string,
  balance?: string,
  slippageTolerance?: number,
  isAutoMode?: boolean
) {
  return useQuery({
    queryKey: ['swapRoutes', fromToken?.id, toToken?.id, amount, isAutoMode ? 'auto' : slippageTolerance],
    queryFn: () =>
      fetchSwapRoutes({
        fromToken: fromToken!,
        toToken: toToken!,
        amount,
        balance,
        // In auto mode, don't filter by slippage tolerance
        slippageTolerance: isAutoMode ? undefined : slippageTolerance,
      }),
    enabled: !!(
      fromToken &&
      toToken &&
      amount &&
      parseFloat(amount) > 0
    ),
    staleTime: 30 * 1000, // 30s
    gcTime: 5 * 60 * 1000, // 5min
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

