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
}

export function TokenSelectCard({
  label,
  onSelectToken,
  onBack,
}: TokenSelectCardProps) {
  const { data: tokens, isLoading, error } = useTokens();
  const [searchQuery, setSearchQuery] = useState('');

  // Featured tokens for quick access
  const featuredTokenIds = ['', '0.0.456858', '0.0.731861']; // HBAR (empty string), USDC, SAUCE
  const featuredTokens = (tokens || []).filter(token => featuredTokenIds.includes(token.address));

  const filteredTokens = (tokens || []).filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              filteredTokens.map((token) => (
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
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-white font-semibold">{token.symbol}</span>
                    <span className="text-white/50 text-sm">{token.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

