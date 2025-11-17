/**
 * Hook for managing swap settings (slippage, deadline, etc.)
 *
 * Provides functions to update settings and calculate minimum received amount
 * based on slippage tolerance. Settings are persisted in localStorage.
 *
 * Auto slippage mode calculates optimal slippage based on the selected route's
 * price impact, adding a safety buffer.
 *
 * @returns {Object} - current settings, setter, and utility functions
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { SwapSettings, DEFAULT_SWAP_SETTINGS } from '@/types/swap';
import { SwapRoute } from '@/types/route';

const SETTINGS_STORAGE_KEY = 'deraswap_settings';

/**
 * Load settings from localStorage
 */
function loadSettings(): SwapSettings {
  if (typeof window === 'undefined') return DEFAULT_SWAP_SETTINGS;

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Refresh deadline to prevent expired timestamps
      return {
        ...parsed,
        deadline: Math.floor(Date.now() / 1000) + 5 * 60,
      };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }

  return DEFAULT_SWAP_SETTINGS;
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: SwapSettings) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * Calculate auto slippage based on the selected route's price impact
 * Auto mode calculates slippage dynamically to ensure the transaction succeeds
 */
export function calculateAutoSlippage(route: SwapRoute | null): number {
  if (!route) {
    return 1.0; // Default 1% if no route
  }
  
  // Use the absolute price impact as base, add a 0.5% buffer
  const absoluteImpact = Math.abs(route.priceImpact);
  const slippage = absoluteImpact + 0.5;
  
  // Cap at 15% for safety
  return Math.min(Math.max(slippage, 0.5), 15);
}

export function useSwapSettings() {
  const [settings, setSettings] = useState<SwapSettings>(DEFAULT_SWAP_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings);
    }
  }, [settings, isLoaded]);

  /**
   * Calculate minimum amount to receive after slippage
   */
  const calculateMinimumReceived = useCallback(
    (expectedAmount: string, slippage: number = settings.slippageTolerance): string => {
      const amount = BigInt(expectedAmount);
      const slippageBps = BigInt(Math.floor(slippage * 100)); // Convert to basis points
      const minAmount = amount - (amount * slippageBps) / BigInt(10000);
      return minAmount.toString();
    },
    [settings.slippageTolerance]
  );

  /**
   * Update slippage tolerance and disable auto mode
   */
  const setSlippageTolerance = useCallback((slippage: number) => {
    setSettings((prev) => ({
      ...prev,
      slippageTolerance: slippage,
      autoSlippage: false, // Disable auto when user sets manual value
    }));
  }, []);

  /**
   * Update deadline (in minutes from now)
   */
  const setDeadlineMinutes = useCallback((minutes: number) => {
    const deadline = Math.floor(Date.now() / 1000) + minutes * 60;
    setSettings((prev) => ({ ...prev, deadline }));
  }, []);

  /**
   * Enable auto slippage mode
   */
  const enableAutoSlippage = useCallback(() => {
    setSettings((prev) => ({ ...prev, autoSlippage: true }));
  }, []);

  /**
   * Get effective slippage tolerance (auto or manual)
   */
  const getEffectiveSlippage = useCallback(
    (selectedRoute: SwapRoute | null): number => {
      if (settings.autoSlippage) {
        return calculateAutoSlippage(selectedRoute);
      }
      return settings.slippageTolerance;
    },
    [settings.autoSlippage, settings.slippageTolerance]
  );

  /**
   * Reset to default settings
   */
  const resetSettings = useCallback(() => {
    setSettings({
      ...DEFAULT_SWAP_SETTINGS,
      deadline: Math.floor(Date.now() / 1000) + 5 * 60, // Refresh deadline
    });
  }, []);

  return {
    settings,
    setSettings,
    calculateMinimumReceived,
    setSlippageTolerance,
    setDeadlineMinutes,
    enableAutoSlippage,
    getEffectiveSlippage,
    resetSettings,
  };
}
