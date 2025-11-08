/**
 * Settings Card Component
 *
 * Card interface for configuring swap settings like slippage tolerance.
 * Matches the SwapCard styling and positioning.
 */

'use client';

import { SlippageSettings } from './SlippageSettings';
import { SwapSettings } from '@/types/swap';
import { SwapRoute } from '@/types/route';
import { ArrowLeft } from 'lucide-react';

interface SettingsCardProps {
  settings: SwapSettings;
  selectedRoute?: SwapRoute | null;
  effectiveSlippage?: number;
  onSlippageChange: (slippage: number) => void;
  onAutoModeChange: () => void;
  onBack: () => void;
}

export function SettingsCard({
  settings,
  selectedRoute,
  effectiveSlippage,
  onSlippageChange,
  onAutoModeChange,
  onBack,
}: SettingsCardProps) {
  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-3xl p-6 min-h-[420px] flex flex-col">
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
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </div>

        {/* Slippage Settings */}
        <SlippageSettings
          value={settings.slippageTolerance}
          autoMode={settings.autoSlippage}
          effectiveValue={effectiveSlippage}
          onChange={onSlippageChange}
          onAutoModeChange={onAutoModeChange}
        />

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400">
            {settings.autoSlippage ? (
              <>
                <span className="font-semibold">Auto mode</span> finds the best route available and automatically calculates the optimal slippage based on the route's price impact.
              </>
            ) : (
              <>
                <span className="font-semibold">Slippage tolerance</span> is the maximum price movement you're willing to accept. Routes with higher price impact may fail.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

