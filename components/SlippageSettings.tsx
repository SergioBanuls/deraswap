/**
 * Slippage Settings Component
 *
 * Allows users to configure slippage tolerance with Auto mode,
 * preset buttons, and custom input. Shows warnings for high slippage values.
 *
 * Auto mode calculates optimal slippage based on route's price impact.
 */

'use client';

import { useState } from 'react';
import { SLIPPAGE_PRESETS, HIGH_SLIPPAGE_WARNING } from '@/types/swap';
import { validateSlippage } from '@/utils/swapValidation';

interface SlippageSettingsProps {
  value: number;
  autoMode: boolean;
  effectiveValue?: number; // The actual slippage being used (auto-calculated or manual)
  onChange: (value: number) => void;
  onAutoModeChange: () => void;
}

export function SlippageSettings({
  value,
  autoMode,
  effectiveValue,
  onChange,
  onAutoModeChange,
}: SlippageSettingsProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutoClick = () => {
    setShowCustom(false);
    setCustomInput('');
    setError(null);
    onAutoModeChange();
  };

  const handlePresetClick = (preset: number) => {
    setShowCustom(false);
    setCustomInput('');
    setError(null);
    onChange(preset);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomInput(inputValue);

    // Clear error if input is empty
    if (!inputValue) {
      setError(null);
      return;
    }

    const numValue = parseFloat(inputValue);
    const validation = validateSlippage(numValue);

    if (!validation.valid) {
      setError(validation.error || 'Invalid slippage');
      return;
    }

    setError(null);
    onChange(numValue);
  };

  const handleCustomBlur = () => {
    if (!customInput) {
      setShowCustom(false);
      // Reset to default if no custom value
      if (!SLIPPAGE_PRESETS.includes(value)) {
        onChange(SLIPPAGE_PRESETS[1]); // Default to 0.5%
      }
    }
  };

  const isPresetSelected = (preset: number) => {
    return !autoMode && !showCustom && value === preset;
  };

  const isCustomSelected = !autoMode && (showCustom || !SLIPPAGE_PRESETS.includes(value));

  // Display value (show effective value in auto mode, or manual value otherwise)
  const displayValue = effectiveValue !== undefined ? effectiveValue : value;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">
          Slippage Tolerance
        </label>
        <div className="text-xs text-white/50">
          {autoMode ? `Auto (${displayValue.toFixed(2)}%)` : `${displayValue}%`}
        </div>
      </div>

      {/* Auto + Preset Buttons */}
      <div className="flex gap-2">
        {/* Auto Button */}
        <button
          onClick={handleAutoClick}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            autoMode
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-800 text-white/70 hover:bg-neutral-700'
          }`}
          title="Auto mode calculates optimal slippage based on route price impact"
        >
          Auto
        </button>

        {SLIPPAGE_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              isPresetSelected(preset)
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-800 text-white/70 hover:bg-neutral-700'
            }`}
          >
            {preset}%
          </button>
        ))}

        {/* Custom Button */}
        <button
          onClick={() => setShowCustom(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isCustomSelected
              ? 'bg-blue-500 text-white'
              : 'bg-neutral-800 text-white/70 hover:bg-neutral-700'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom Input */}
      {showCustom && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={customInput}
              onChange={handleCustomChange}
              onBlur={handleCustomBlur}
              placeholder="Enter custom slippage"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
              %
            </span>
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )}

      {/* High Slippage Warning */}
      {displayValue > HIGH_SLIPPAGE_WARNING && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <svg
            className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-500">
              High Slippage Warning
            </p>
            <p className="text-xs text-yellow-500/80 mt-1">
              Your transaction may be front-run. Consider using a lower slippage tolerance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
