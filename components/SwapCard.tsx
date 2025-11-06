'use client';

import { Token } from '@/types/token';
import { TokenSelector } from './TokenSelector';
import { TokenSelectDialog } from './TokenSelectDialog';
import { AmountInput } from './AmountInput';
import { SwapButton } from './SwapButton';
import { useReownConnect } from '@/hooks/useReownConnect';

interface SwapCardProps {
  fromToken: Token | null;
  toToken: Token | null;
  amount: string;
  onFromTokenSelect: (token: Token) => void;
  onToTokenSelect: (token: Token) => void;
  onAmountChange: (amount: string) => void;
  onSwapTokens: () => void;
  dialogType: 'from' | 'to' | null;
  onDialogChange: (type: 'from' | 'to' | null) => void;
}

export function SwapCard({
  fromToken,
  toToken,
  amount,
  onFromTokenSelect,
  onToTokenSelect,
  onAmountChange,
  onSwapTokens,
  dialogType,
  onDialogChange,
}: SwapCardProps) {
  const { connect, isConnected, account, loading } = useReownConnect();

  const handleSelectToken = (token: Token) => {
    if (dialogType === 'from') {
      onFromTokenSelect(token);
    } else if (dialogType === 'to') {
      onToTokenSelect(token);
    }
    onDialogChange(null);
  };

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Exchange</h1>
        </div>

        {/* Token Selectors - Side by Side with overlapping Swap Button */}
        <div className="relative flex items-center gap-0">
          {/* From Token */}
          <div className="flex-1 pr-4">
            <TokenSelector
              label="From"
              selectedToken={fromToken}
              onClick={() => onDialogChange('from')}
            />
          </div>

          {/* Swap Button - Absolutely positioned */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10">
            <SwapButton onSwap={onSwapTokens} />
          </div>

          {/* To Token */}
          <div className="flex-1 pl-4">
            <TokenSelector
              label="To"
              selectedToken={toToken}
              onClick={() => onDialogChange('to')}
            />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mt-6">
          <AmountInput
            amount={amount}
            onAmountChange={onAmountChange}
            token={fromToken}
            disabled={!fromToken}
          />
        </div>

        {/* Connect Wallet / Swap Button */}
        <div className="mt-6">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                loading
                  ? 'bg-blue-500/50 text-white cursor-wait'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Connecting...' : 'Connect wallet'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-white/70 text-center">
                Connected: {account}
              </div>
              <button
                disabled={!fromToken || !toToken || !amount || parseFloat(amount) === 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  !fromToken || !toToken || !amount || parseFloat(amount) === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                Swap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Token Selection Dialog */}
      <TokenSelectDialog
        open={dialogType !== null}
        onOpenChange={(open) => !open && onDialogChange(null)}
        onSelectToken={handleSelectToken}
      />
    </div>
  );
}

