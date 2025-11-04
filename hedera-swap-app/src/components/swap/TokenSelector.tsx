'use client';

import { useState } from 'react';
import { HederaToken } from '@/types/hedera';
import { getTokenList } from '@/lib/utils/constants';
import { formatTokenAmount } from '@/lib/utils/formatters';
import { useTokenBalance } from '@/hooks/useTokenBalance';

interface TokenSelectorProps {
  selectedToken: HederaToken | null;
  onSelectToken: (token: HederaToken) => void;
  excludeToken?: HederaToken | null;
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
  excludeToken,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tokens = getTokenList();
  const { balance } = useTokenBalance(selectedToken);

  const filteredTokens = tokens.filter(
    (token) => !excludeToken || token.symbol !== excludeToken.symbol
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[140px]"
      >
        {selectedToken ? (
          <>
            <span className="font-semibold">{selectedToken.symbol}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTokenAmount(balance, selectedToken.decimals)}
            </span>
          </>
        ) : (
          <span>Seleccionar</span>
        )}
        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => {
                  onSelectToken(token);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
