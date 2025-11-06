'use client';

import { useState, useEffect } from 'react';
import { TokenId } from '@hashgraph/sdk';
import axios from 'axios';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';

const ETASWAP_API_BASE_URL = 'https://api.etaswap.com/v1';
const WHBAR_TOKEN_ID = '0.0.1456986';

// Format output amount with token decimals
function formatAmount(amount: string, decimals: number): string {
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = amountBigInt / divisor;
  const fraction = amountBigInt % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '') || '0';
  return `${whole}.${fractionStr}`;
}

export function useSwapRoutes(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string
) {
  const [routes, setRoutes] = useState<SwapRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) === 0) {
      setRoutes([]);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    // Capture tokens to avoid null checks in async context
    const from = fromToken;
    const to = toToken;

    async function fetchRoutes() {
      setLoading(true);
      setError(null);

      try {
        const inputAmount = Math.floor(parseFloat(amount) * 10 ** from.decimals);
        
        // Handle HBAR → WHBAR conversion
        const fromTokenId = from.id === 'HBAR' ? WHBAR_TOKEN_ID : from.id;
        const toTokenId = to.id === 'HBAR' ? WHBAR_TOKEN_ID : to.id;

        // Convert token IDs to Solidity addresses
        const tokenFromAddress = '0x' + TokenId.fromString(fromTokenId).toSolidityAddress();
        const tokenToAddress = '0x' + TokenId.fromString(toTokenId).toSolidityAddress();

        // Fetch routes from ETASwap API
        const url = `${ETASWAP_API_BASE_URL}/rates`;
        const params = {
          tokenFrom: tokenFromAddress,
          tokenTo: tokenToAddress,
          amount: inputAmount.toString(),
          isReverse: false,
        };

        console.log('ETASwap API request:', { url, params });

        const response = await axios.get(url, { params });
        const etaRoutes = response.data;

        if (!isCancelled && Array.isArray(etaRoutes)) {
          // Process routes and add computed fields
          const processedRoutes: SwapRoute[] = etaRoutes.map((route: any) => {
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
            const outputAmountFormatted = formatAmount(totalAmountTo, to.decimals);

            // Calculate price impact
            // Price impact = (output - expected) / expected * 100
            // For simplicity, we'll use the input amount as expected (1:1 ratio baseline)
            const expectedOutput = BigInt(inputAmount);
            const actualOutput = BigInt(totalAmountTo);
            const priceImpact = Number((actualOutput - expectedOutput) * BigInt(10000) / expectedOutput) / 100;

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

          setRoutes(processedRoutes);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('ETASwap API error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch routes');
          setLoading(false);
        }
      }
    }

    fetchRoutes();

    return () => {
      isCancelled = true;
    };
  }, [fromToken, toToken, amount]);

  return { routes, loading, error };
}

