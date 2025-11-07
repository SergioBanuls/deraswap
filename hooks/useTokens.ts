/**
 * Hook for fetching the list of known tokens
 *
 * Uses TanStack Query for intelligent caching and background refetching.
 * Tokens are cached for 5 minutes as they don't change frequently.
 *
 * Returns different tokens based on selected network:
 * - Testnet: HBAR and USDC testnet
 * - Mainnet: Full SaucerSwap token list
 *
 * @returns {Object} - TanStack Query result with tokens data
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Token } from '@/types/token';
import { useState, useEffect } from 'react';

async function fetchTokens(network: string): Promise<Token[]> {
  const response = await fetch(`/api/tokens?network=${network}`);

  if (!response.ok) {
    throw new Error('Failed to fetch tokens');
  }

  const data = await response.json();
  return data;
}

export function useTokens() {
  const [network, setNetwork] = useState('testnet');

  useEffect(() => {
    // Get network from localStorage
    const savedNetwork = localStorage.getItem('hedera_network') || 'testnet';
    setNetwork(savedNetwork);
  }, []);

  return useQuery({
    queryKey: ['tokens', network],
    queryFn: () => fetchTokens(network),
    staleTime: 5 * 60 * 1000, // 5min - tokens don't change frequently
    gcTime: 60 * 60 * 1000, // 1h
    refetchOnWindowFocus: false,
  });
}

