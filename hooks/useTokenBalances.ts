/**
 * Hook for fetching token balances for a connected account
 *
 * Uses Hedera Mirror Node API to fetch all token balances for an account.
 * Automatically refreshes balances periodically.
 *
 * @param accountId - The Hedera account ID (e.g., "0.0.123456")
 * @returns {Object} - balances map, loading state, error, and refresh function
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';
const REFRESH_INTERVAL = 30000; // 30 seconds

export interface TokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
}

interface MirrorNodeBalance {
  token_id: string;
  balance: number;
  decimals: number;
}

interface MirrorNodeResponse {
  balances: MirrorNodeBalance[];
}

export function useTokenBalances(accountId: string | null) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!accountId) {
      setBalances({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch from Hedera Mirror Node
      const response = await fetch(
        `${MIRROR_NODE_URL}/api/v1/accounts/${accountId}/tokens?limit=100`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch balances from mirror node');
      }

      const data: MirrorNodeResponse = await response.json();

      const balanceMap: Record<string, string> = {};

      // Process token balances
      if (data.balances) {
        data.balances.forEach((tokenBalance) => {
          balanceMap[tokenBalance.token_id] = tokenBalance.balance.toString();
        });
      }

      // Also fetch HBAR balance
      const accountResponse = await fetch(
        `${MIRROR_NODE_URL}/api/v1/accounts/${accountId}`
      );

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        if (accountData.balance) {
          balanceMap['HBAR'] = accountData.balance.balance.toString();
        }
      }

      setBalances(balanceMap);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Fetch on mount and when accountId changes
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Auto-refresh balances
  useEffect(() => {
    if (!accountId) return;

    const interval = setInterval(() => {
      fetchBalances();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [accountId, fetchBalances]);

  return {
    balances,
    loading,
    error,
    refresh: fetchBalances,
  };
}
