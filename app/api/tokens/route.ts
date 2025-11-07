/**
 * API Route Handler for fetching known tokens
 *
 * Returns tokens based on network parameter:
 * - testnet: HBAR and USDC testnet tokens
 * - mainnet: Full SaucerSwap token list
 */

import { NextResponse } from 'next/server';

const API_URL = 'https://api.saucerswap.finance/tokens/known';
const API_KEY = process.env.SAUCERSWAP_API_KEY;

// Testnet tokens - Using HBAR native (no WHBAR in testnet)
const TESTNET_TOKENS = [
  {
    id: 'HBAR',
    symbol: 'HBAR',
    name: 'HBAR',
    decimals: 8,
    icon: 'https://www.saucerswap.finance/tokens/HBAR.svg',
  },
  {
    id: '0.0.429274',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'https://www.saucerswap.finance/tokens/USDC.svg',
  },
  {
    id: '0.0.1490393',
    symbol: 'SAUCE',
    name: 'SAUCE',
    decimals: 6,
    icon: 'https://www.saucerswap.finance/tokens/SAUCE.svg',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network') || 'testnet';

  // Return testnet tokens
  if (network === 'testnet') {
    return NextResponse.json(TESTNET_TOKENS);
  }

  // Fetch mainnet tokens from SaucerSwap
  if (!API_KEY) {
    console.error('SAUCERSWAP_API_KEY is not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        'x-api-key': API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Rate limited when fetching tokens list');
        return NextResponse.json(
          { error: 'Rate limited', code: 429 },
          { status: 429 }
        );
      }
      throw new Error(`SaucerSwap API error: ${response.status}`);
    }

    const tokens = await response.json();
    
    // Add native HBAR at the beginning (SaucerSwap only returns WHBAR)
    const nativeHBAR = {
      id: 'HBAR',
      symbol: 'HBAR',
      name: 'HBAR',
      decimals: 8,
      icon: 'https://www.saucerswap.finance/tokens/HBAR.svg',
    };
    
    // Filter out WHBAR [old] (0.0.1062664) - not supported in V2 pools
    // Only keep WHBAR [new] (0.0.1456986)
    const filteredTokens = tokens
      .filter((token: any) => {
        // Remove old WHBAR
        if (token.id === '0.0.1062664') return false;
        return true;
      })
      .map((token: any) => {
        // Fix wHBAR symbol (SaucerSwap API returns it as "HBAR" which conflicts with native HBAR)
        if (token.id === '0.0.1456986') {
          return {
            ...token,
            symbol: 'WHBAR',  // Change from "HBAR" to "WHBAR"
          };
        }
        return token;
      });

    return NextResponse.json([nativeHBAR, ...filteredTokens]);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
