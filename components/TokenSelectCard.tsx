/**
 * Token Select Card Component
 *
 * Card interface for selecting tokens for swap.
 * Matches the SettingsCard styling and positioning.
 */

'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Token } from '@/types/token';
import { useTokens } from '@/hooks/useTokens';
import Image from 'next/image';

interface TokenSelectCardProps {
  label: 'From' | 'To';
  onSelectToken: (token: Token) => void;
  onBack: () => void;
  balances: Record<string, string>;
}

function formatBalance(balance: string, decimals: number): string {
  const num = Number(balance) / Math.pow(10, decimals);
  
  // Format with appropriate decimal places
  if (num === 0) return '0';
  if (num < 0.01) return parseFloat(num.toFixed(6)).toString();
  if (num < 1) return parseFloat(num.toFixed(4)).toString();
  if (num < 1000) return parseFloat(num.toFixed(4)).toString();
  
  // For larger numbers, use compact notation
  if (num >= 1_000_000) {
    return parseFloat((num / 1_000_000).toFixed(2)).toString() + 'M';
  }
  if (num >= 1_000) {
    return parseFloat((num / 1_000).toFixed(2)).toString() + 'K';
  }
  
  return parseFloat(num.toFixed(4)).toString();
}

export function TokenSelectCard({
  label,
  onSelectToken,
  onBack,
  balances,
  }: TokenSelectCardProps) {
  const { data: tokens, isLoading, error } = useTokens();
  const [searchQuery, setSearchQuery] = useState('');

  // Get balance for a token
  const getTokenBalance = (token: Token): string | null => {
    const tokenId = token.address || 'HBAR';
    const rawBalance = balances[tokenId];
    
    if (!rawBalance) return null;
    
    return formatBalance(rawBalance, token.decimals);
  };

  // Get USD value of token balance
  const getTokenUsdValue = (token: Token): number => {
    const tokenId = token.address || 'HBAR';
    const rawBalance = balances[tokenId];
    
    // Try both priceUsd and price fields
    const tokenPrice = token.priceUsd || token.price;
    
    if (!rawBalance || !tokenPrice) return 0;
    
    const numericBalance = Number(rawBalance) / Math.pow(10, token.decimals);
    return numericBalance * tokenPrice;
  };

  // Format USD value
  const formatUsdValue = (usdValue: number): string => {
    if (usdValue === 0) return '$0.00';
    if (usdValue < 0.01) return '<$0.01';
    if (usdValue < 1) return `$${usdValue.toFixed(2)}`;
    if (usdValue < 1000) return `$${usdValue.toFixed(2)}`;
    if (usdValue >= 1_000_000) {
      return `$${(usdValue / 1_000_000).toFixed(2)}M`;
    }
    if (usdValue >= 1_000) {
      return `$${(usdValue / 1_000).toFixed(2)}K`;
    }
    return `$${usdValue.toFixed(2)}`;
  };

  // Featured tokens for quick access
  const featuredTokenIds = ['', '0.0.456858', '0.0.731861']; // HBAR (empty string), USDC, SAUCE
  const featuredTokens = (tokens || []).filter(token => featuredTokenIds.includes(token.address));

  const filteredTokens = (tokens || [])
    .filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const usdValueA = getTokenUsdValue(a);
      const usdValueB = getTokenUsdValue(b);

      // If both have USD values, compare them
      if (usdValueA > 0 && usdValueB > 0) {
        return usdValueB - usdValueA; // Descending order (highest USD value first)
      }

      // Tokens with USD value come before tokens without
      if (usdValueA > 0 && usdValueB === 0) return -1;
      if (usdValueA === 0 && usdValueB > 0) return 1;

      // For tokens without USD value, check if they have balances
      const tokenIdA = a.address || 'HBAR';
      const tokenIdB = b.address || 'HBAR';
      const balanceA = balances[tokenIdA];
      const balanceB = balances[tokenIdB];

      // Tokens with balance (but no price) come before tokens without balance
      if (balanceA && !balanceB) return -1;
      if (!balanceA && balanceB) return 1;

      // If neither has balance, maintain original order
      return 0;
    });

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    onBack();
  };

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-3xl p-6 h-[620px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-neutral-700 text-white/70 hover:text-white transition-all"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">Swap {label}</h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Quick Access Tokens */}
        {!isLoading && featuredTokens.length > 0 && (
          <div className="flex gap-2 mb-3">
            {featuredTokens.map((token) => (
              <button
                key={token.address || 'HBAR'}
                onClick={() => handleSelectToken(token)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 flex-1"
              >
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0">
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-sm font-medium text-white">{token.symbol}</span>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-white/70">Loading tokens...</div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-400">
            Error: {error instanceof Error ? error.message : 'Failed to load tokens'}
          </div>
        )}

        {/* Token List */}
        {!isLoading && !error && (
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-white/70">No tokens found</div>
            ) : (
              filteredTokens.map((token) => {
                const balance = getTokenBalance(token);
                const usdValue = getTokenUsdValue(token);
                return (
                  <button
                    key={token.address || 'HBAR'}
                    onClick={() => handleSelectToken(token)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                      <Image
                        src={token?.icon || '/NotFound.png'}
                        alt={token.symbol}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-white font-semibold">{token.symbol}</span>
                      <span className="text-white/50 text-sm">{token.name}</span>
                    </div>
                    {balance && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-white font-semibold">{balance}</span>
                        {usdValue > 0 && (
                          <span className="text-white/40 text-xs">{formatUsdValue(usdValue)}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

