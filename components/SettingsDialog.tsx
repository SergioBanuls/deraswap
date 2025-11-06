/**
 * Settings Dialog Component
 *
 * Dialog for configuring swap settings like slippage tolerance and deadline.
 * Supports Auto mode for automatic slippage calculation based on route price impact.
 */

'use client';

import { SlippageSettings } from './SlippageSettings';
import { SwapSettings } from '@/types/swap';
import { SwapRoute } from '@/types/route';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SwapSettings;
  selectedRoute?: SwapRoute | null;
  effectiveSlippage?: number;
  onSlippageChange: (slippage: number) => void;
  onAutoModeChange: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  selectedRoute,
  effectiveSlippage,
  onSlippageChange,
  onAutoModeChange,
}: SettingsDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div
          className="bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-top-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
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
                  <span className="font-semibold">Auto mode</span> uses a fixed 0.7% slippage tolerance, which works well for most swaps. Switch to manual mode to set a custom value.
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
    </>
  );
}
