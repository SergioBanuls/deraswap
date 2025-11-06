/**
 * API Route Handler for fetching known tokens from SaucerSwap
 *
 * This route protects the API key by keeping it server-side only.
 * Client components should call this endpoint instead of directly accessing SaucerSwap API.
 */

import { NextResponse } from 'next/server';

const API_URL = 'https://api.saucerswap.finance/tokens/known';
const API_KEY = process.env.SAUCERSWAP_API_KEY;

export async function GET() {
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
      // Cache for 5 minutes (tokens list doesn't change frequently)
      next: { revalidate: 300 },
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

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
