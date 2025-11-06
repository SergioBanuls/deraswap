'use client';

import { useState, useEffect } from 'react';

const API_KEY = '875e1017-87b8-4b12-8301-6aa1f1aa073b';
const REFRESH_INTERVAL = 10000; // 10 seconds

export function useTokenPrice(tokenId: string | null, initialPrice: number = 0) {
  const [price, setPrice] = useState(initialPrice);

  useEffect(() => {
    if (!tokenId) {
      setPrice(initialPrice);
      return;
    }

    // Set initial price
    setPrice(initialPrice);

    const fetchPrice = async () => {
      try {
        const response = await fetch(
          `https://api.saucerswap.finance/tokens/${tokenId}`,
          { headers: { 'x-api-key': API_KEY } }
        );
        
        if (response.ok) {
          const data = await response.json();
          setPrice(data.priceUsd);
        }
      } catch (error) {
        // Keep existing price on error
        console.error('Failed to fetch token price:', error);
      }
    };

    const interval = setInterval(fetchPrice, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [tokenId, initialPrice]);

  return price;
}

