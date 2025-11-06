/**
 * Swap Card Component
 *
 * Main interface for configuring and executing swaps.
 * Optimized with React.memo and useCallback to prevent unnecessary re-renders.
 */

'use client';

import { memo, useCallback } from 'react';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';
import { SwapSettings } from '@/types/swap';
import { TokenSelector } from './TokenSelector';
import { TokenSelectDialog } from './TokenSelectDialog';
import { AmountInput } from './AmountInput';
import { SwapButton } from './SwapButton';
import { useReownConnect } from '@/hooks/useReownConnect';
import { useSwapExecution } from '@/hooks/useSwapExecution';
import { validateAmount } from '@/utils/amountValidation';

interface SwapCardProps {
  fromToken: Token | null;
  toToken: Token | null;
  amount: string;
  selectedRoute: SwapRoute | null;
  settings: SwapSettings;
  effectiveSlippage?: number; // The actual slippage to use (auto-calculated or manual)
  onSettingsClick: () => void;
  onFromTokenSelect: (token: Token) => void;
  onToTokenSelect: (token: Token) => void;
  onAmountChange: (amount: string) => void;
  onSwapTokens: () => void;
  dialogType: 'from' | 'to' | null;
  onDialogChange: (type: 'from' | 'to' | null) => void;
}

export const SwapCard = memo(function SwapCard({
  fromToken,
  toToken,
  amount,
  selectedRoute,
  settings,
  effectiveSlippage,
  onSettingsClick,
  onFromTokenSelect,
  onToTokenSelect,
  onAmountChange,
  onSwapTokens,
  dialogType,
  onDialogChange,
}: SwapCardProps) {
  const { connect, isConnected, account, loading } = useReownConnect();
  const { executeSwap, isExecuting, stepMessage, currentStep, explorerUrl, monitoringProgress } = useSwapExecution();

  const handleSelectToken = useCallback((token: Token) => {
    if (dialogType === 'from') {
      onFromTokenSelect(token);
    } else if (dialogType === 'to') {
      onToTokenSelect(token);
    }
    onDialogChange(null);
  }, [dialogType, onFromTokenSelect, onToTokenSelect, onDialogChange]);

  // Handle swap execution
  const handleSwap = useCallback(async () => {
    if (!fromToken || !toToken || !amount || !selectedRoute) {
      return;
    }

    // Validate and convert amount to raw units
    const validation = validateAmount(amount, fromToken.decimals);
    if (!validation.valid || !validation.sanitized) {
      return;
    }

    // Use effective slippage if provided, otherwise use settings value
    const slippage = effectiveSlippage !== undefined ? effectiveSlippage : settings.slippageTolerance;

    await executeSwap({
      route: selectedRoute,
      fromToken,
      toToken,
      inputAmount: validation.sanitized,
      settings: {
        ...settings,
        slippageTolerance: slippage, // Use effective slippage
      },
    });
  }, [fromToken, toToken, amount, selectedRoute, settings, effectiveSlippage, executeSwap]);

  // Determine if swap button should be enabled
  const canSwap =
    fromToken &&
    toToken &&
    amount &&
    parseFloat(amount) > 0 &&
    selectedRoute &&
    !isExecuting;

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Exchange</h1>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white/70 hover:text-white transition-all"
            aria-label="Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
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

        {/* Slippage Tolerance Display */}
        {isConnected && (
          <div className="mt-3 flex items-center justify-between px-3 py-2 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs text-white/60">Tolerancia al slippage</span>
            </div>
            <div className="flex items-center gap-2">
              {settings.autoSlippage && (
                <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                  Auto
                </span>
              )}
              <span className="text-xs font-medium text-white/80">
                {effectiveSlippage !== undefined ? effectiveSlippage.toFixed(2) : settings.slippageTolerance.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

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
              <button
                onClick={handleSwap}
                disabled={!canSwap}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  !canSwap
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : isExecuting
                    ? 'bg-yellow-500 text-white cursor-wait'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isExecuting ? stepMessage : !selectedRoute ? 'Select a route first' : 'Swap'}
              </button>
              {isExecuting && currentStep && (
                <div className="text-xs text-white/50 text-center space-y-1">
                  <div className="animate-pulse">{stepMessage}</div>
                  {currentStep === 'monitoring' && monitoringProgress && (
                    <div className="text-white/40">
                      Checking consensus... ({monitoringProgress.current}/{monitoringProgress.max})
                    </div>
                  )}
                </div>
              )}
              {explorerUrl && (currentStep === 'monitoring' || currentStep === 'success') && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 text-center block underline"
                >
                  View on HashScan
                </a>
              )}
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
});

