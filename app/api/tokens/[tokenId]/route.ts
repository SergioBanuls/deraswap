/**
 * API Route Handler for fetching individual token price from SaucerSwap
 *
 * This route protects the API key by keeping it server-side only.
 * Accepts tokenId as a dynamic parameter.
 *
 * Rate Limiting Strategy:
 * - Implements request throttling to prevent 429 errors
 * - Adds minimum delay between requests to same endpoint
 * - Caches responses for 60 seconds
 */

import { NextResponse } from 'next/server';

const API_KEY = process.env.SAUCERSWAP_PRICE_API_KEY;
const MIN_REQUEST_INTERVAL = 200; // Minimum 200ms between requests to same token

// In-memory cache for request throttling
const lastRequestTime = new Map<string, number>();

async function throttleRequest(tokenId: string): Promise<void> {
  const now = Date.now();
  const lastTime = lastRequestTime.get(tokenId) || 0;
  const timeSinceLastRequest = now - lastTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  lastRequestTime.set(tokenId, Date.now());
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;

  if (!API_KEY) {
    console.error('SAUCERSWAP_PRICE_API_KEY is not configured');
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  if (!tokenId) {
    return NextResponse.json(
      { error: 'Token ID is required' },
      { status: 400 }
    );
  }

  try {
    // Throttle requests to prevent rate limiting
    await throttleRequest(tokenId);

    const response = await fetch(
      `https://api.saucerswap.finance/tokens/${tokenId}`,
      {
        headers: {
          'x-api-key': API_KEY,
        },
        // Increased cache to 60 seconds to reduce API calls
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Rate limited for token ${tokenId}, returning stale data`);
        // Return a specific error that the client can handle
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
    console.error(`Error fetching price for token ${tokenId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 }
    );
  }
}
