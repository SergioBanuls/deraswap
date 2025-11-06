/**
 * Swap Routes Component
 *
 * Displays available swap routes with price impact, gas estimates, and time estimates.
 * Optimized with React.memo and useCallback to prevent unnecessary re-renders.
 */

'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';
import { useSwapRoutes } from '@/hooks/useSwapRoutes';
import { ChevronDown, Fuel, Clock } from 'lucide-react';

interface SwapRoutesProps {
  fromToken: Token | null;
  toToken: Token | null;
  amount: string;
  slippageTolerance: number;
  autoSlippage?: boolean;
  onRouteSelect?: (route: SwapRoute) => void;
}

// Helper function to estimate time based on gas
function estimateTime(gasEstimate: number): string {
  // Simple estimation: higher gas = potentially longer time
  if (gasEstimate > 3000000) return '35s';
  if (gasEstimate > 2000000) return '4m';
  return '3s';
}

// Helper function to format gas cost
function formatGasCost(gasEstimate: number): string {
  // Simplified gas cost calculation (this should be replaced with actual calculation)
  const costInDollars = (gasEstimate / 1000000) * 0.01;
  return costInDollars < 0.01 ? '<$0.01' : `$${costInDollars.toFixed(2)}`;
}

export const SwapRoutes = memo(function SwapRoutes({ fromToken, toToken, amount, slippageTolerance, autoSlippage, onRouteSelect }: SwapRoutesProps) {
  const { data: routes, isLoading, error } = useSwapRoutes(fromToken, toToken, amount, undefined, slippageTolerance, autoSlippage);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);

  // Filter routes: if auto mode is enabled, show only the best route (first one)
  const displayRoutes = autoSlippage && routes && routes.length > 0 ? [routes[0]] : routes;

  // Auto-select the first route (cheapest) when routes are loaded
  const handleAutoSelect = useCallback(() => {
    if (routes && routes.length > 0 && onRouteSelect) {
      setSelectedRoute(0);
      onRouteSelect(routes[0]);
    }
  }, [routes, onRouteSelect]);

  // Call auto-select when routes change
  useEffect(() => {
    handleAutoSelect();
  }, [handleAutoSelect]);

  const handleSelectRoute = useCallback((index: number) => {
    setSelectedRoute(index);
    if (onRouteSelect && routes && routes[index]) {
      onRouteSelect(routes[index]);
    }
  }, [onRouteSelect, routes]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-neutral-900 rounded-t-3xl p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Receive</h2>
          {isLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>

      {/* Routes Container */}
      <div className="bg-neutral-900 rounded-b-3xl p-6 pt-2 space-y-3 max-h-[600px] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-white/60">Loading routes...</div>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-red-400 text-sm text-center py-4">
            {error instanceof Error ? error.message : 'Failed to load routes'}
          </div>
        )}

        {!isLoading && !error && (!displayRoutes || displayRoutes.length === 0) && (
          <div className="text-white/60 text-sm text-center py-4">No routes available</div>
        )}

        {!isLoading && fromToken && toToken && displayRoutes && displayRoutes.map((route, index) => {
        const isBestRoute = index === 0;
        const isSelected = index === selectedRoute;

        // Format aggregator display
        const aggregatorDisplay = Array.isArray(route.aggregatorId)
          ? route.aggregatorId.join(' + ')
          : route.aggregatorId;

        // Format transaction type for display
        const txTypeDisplay = route.transactionType === 'SPLIT_SWAP'
          ? 'Split Swap'
          : route.transactionType === 'INDIRECT_SWAP'
          ? 'Multi-hop'
          : 'Direct Swap';

          return (
            <div
              key={`${route.transactionType}-${index}`}
              onClick={() => handleSelectRoute(index)}
              className={`bg-neutral-800/50 rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-neutral-800/80 border-blue-500/50' 
                  : 'border-transparent hover:bg-neutral-800/70 hover:border-neutral-700'
              }`}
            >
              {/* Badge */}
              {isBestRoute && (
                <div className="inline-block bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  Best Return
                </div>
              )}

              {/* Token Icon and Output Amount */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={toToken.icon}
                      alt={toToken.symbol}
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {route.outputAmountFormatted}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      ${(parseFloat(route.outputAmountFormatted) * toToken.priceUsd).toFixed(2)}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 text-sm text-white/60 mb-3">
                <span className={route.priceImpact < 0 ? 'text-red-400' : 'text-green-400'}>
                  {route.priceImpact > 0 ? '+' : ''}{route.priceImpact.toFixed(2)}%
                </span>
                <span>•</span>
                <span>{aggregatorDisplay}</span>
              </div>

              {/* Exchange Summary */}
              <div className="text-sm text-white/50 mb-3">
                1 {fromToken.symbol} ≈ {(parseFloat(route.outputAmountFormatted) / parseFloat(amount)).toFixed(6)} {toToken.symbol}
              </div>

              {/* Gas and Time Row */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-white/60">
                  <Fuel className="w-4 h-4" />
                  <span>{formatGasCost(route.gasEstimate)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span>{estimateTime(route.gasEstimate)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

