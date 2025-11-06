'use client';

import { useState, useEffect } from 'react';
import { Token } from '@/types/token';

const API_URL = 'https://api.saucerswap.finance/tokens/known';
const API_KEY = 'apiecc67c61f291370370502bd1e5adf';

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      try {
        setLoading(true);
        const response = await fetch(API_URL, {
          headers: {
            'x-api-key': API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }

        const data = await response.json();
        setTokens(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
        console.error('Error fetching tokens:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, []);

  return { tokens, loading, error };
}

