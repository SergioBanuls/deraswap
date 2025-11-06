/**
 * Hook for fetching and auto-updating token price
 *
 * Uses TanStack Query for intelligent caching and automatic refetching.
 * Optimized to prevent rate limiting by:
 * - Using longer cache times (60s stale, 2min refetch)
 * - Smart retry strategy with exponential backoff
 * - Graceful handling of 429 errors
 *
 * @param tokenId - The token ID to fetch price for
 * @param initialPrice - Initial price to use as placeholder
 * @returns Current price in USD
 */

'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchTokenPrice(tokenId: string): Promise<number> {
  const response = await fetch(`/api/tokens/${tokenId}`);

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - throw specific error to trigger retry
      throw new Error('RATE_LIMITED');
    }
    throw new Error('Failed to fetch price');
  }

  const data = await response.json();
  return data.priceUsd;
}

export function useTokenPrice(tokenId: string | null, initialPrice: number = 0) {
  const { data } = useQuery({
    queryKey: ['tokenPrice', tokenId],
    queryFn: () => fetchTokenPrice(tokenId!),
    enabled: !!tokenId,
    staleTime: 60 * 1000, // 60s - keep cached data fresh longer
    gcTime: 5 * 60 * 1000, // 5min - keep in cache
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes (less aggressive)
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid bursts
    placeholderData: initialPrice,
    retry: (failureCount, error) => {
      // Don't retry rate limit errors aggressively
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        return failureCount < 2; // Only retry twice for rate limits
      }
      return failureCount < 3; // Standard retry for other errors
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 2s, 4s, 8s...
      return Math.min(2000 * Math.pow(2, attemptIndex), 30000);
    },
  });

  return data ?? initialPrice;
}

