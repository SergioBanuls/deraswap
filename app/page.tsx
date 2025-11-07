'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { SwapCard } from '@/components/SwapCard';
import { SwapRoutes } from '@/components/SwapRoutes';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSwapSettings } from '@/hooks/useSwapSettings';
import { useTokens } from '@/hooks/useTokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useReownConnect } from '@/hooks/useReownConnect';

export default function Home() {
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [dialogType, setDialogType] = useState<'from' | 'to' | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasBalanceError, setHasBalanceError] = useState(false);

  // Get connected account
  const { account } = useReownConnect();
  
  // Fetch tokens list
  const { data: tokens } = useTokens();
  
  // Fetch token balances for connected account
  const { balances } = useTokenBalances(account || null);
  
  // Debug: log balances
  useEffect(() => {
    if (Object.keys(balances).length > 0) {
      console.log('💰 Balances obtenidos:', balances);
      console.log('💰 From token:', fromToken?.id, fromToken?.symbol);
    }
  }, [balances, fromToken]);
  
  // Get balance for the from token
  // Check multiple possible keys: token.id, HBAR, or token.symbol
  const fromTokenBalance = fromToken 
    ? (balances[fromToken.id] || 
       (fromToken.symbol === 'HBAR' ? balances['HBAR'] : undefined) ||
       (fromToken.symbol === 'WHBAR' ? balances['HBAR'] : undefined))
    : undefined;
    
  // Debug: log the balance we're using
  useEffect(() => {
    if (fromToken) {
      console.log('💵 Balance para', fromToken.symbol, ':', fromTokenBalance);
    }
  }, [fromToken, fromTokenBalance]);

  // Swap settings (slippage, deadline)
  const { settings, setSlippageTolerance, enableAutoSlippage, getEffectiveSlippage } = useSwapSettings();

  // Set default tokens (HBAR new and USDC) on mount
  useEffect(() => {
    if (tokens && tokens.length > 0 && !fromToken && !toToken) {
      // WHBAR [new] token ID
      const hbarToken = tokens.find(t => t.id === '0.0.1456986');
      // USDC token ID on Hedera
      const usdcToken = tokens.find(t => t.id === '0.0.456858');
      
      if (hbarToken) setFromToken(hbarToken);
      if (usdcToken) setToToken(usdcToken);
    }
  }, [tokens, fromToken, toToken]);

  // Calculate effective slippage (auto or manual)
  const effectiveSlippage = getEffectiveSlippage(selectedRoute);

  // Debounce amount to reduce API calls while user is typing
  const debouncedAmount = useDebouncedValue(amount, 500);

  // Memoize showRoutes calculation
  const showRoutes = useMemo(() => {
    return fromToken !== null && toToken !== null && amount !== '' && parseFloat(amount) > 0;
  }, [fromToken, toToken, amount]);

  // Memoize handler functions
  const handleSwapTokens = useCallback(() => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  }, [fromToken, toToken]);

  const handleFromTokenSelect = useCallback((token: Token) => {
    // If new From token matches To token
    if (toToken && token.id === toToken.id) {
      // If both tokens are selected, swap them
      if (fromToken) {
        setToToken(fromToken);
      } else {
        // Otherwise just clear To
        setToToken(null);
      }
    }
    setFromToken(token);
  }, [toToken, fromToken]);

  const handleToTokenSelect = useCallback((token: Token) => {
    // If new To token matches From token
    if (fromToken && token.id === fromToken.id) {
      // If both tokens are selected, swap them
      if (toToken) {
        setFromToken(toToken);
      } else {
        // Otherwise just clear From
        setFromToken(null);
      }
    }
    setToToken(token);
  }, [fromToken, toToken]);

  return (
    <div className="flex items-center justify-center mt-36 w-full">
      <div className="max-w-5xl w-full px-4">
        {/* Grid layout - always present, mobile stack, desktop side-by-side */}
        <div className={`grid grid-cols-1 gap-6 items-center lg:items-start transition-all duration-700 ${
          showRoutes ? 'lg:grid-cols-2 lg:justify-center' : 'lg:grid-cols-1 lg:justify-items-center'
        }`}>
          {/* Left Column - Swap Card */}
          <div className="w-full max-w-md mx-auto transition-all duration-700 ease-in-out relative z-10">
            <SwapCard
              fromToken={fromToken}
              toToken={toToken}
              amount={amount}
              selectedRoute={selectedRoute}
              settings={settings}
              effectiveSlippage={effectiveSlippage}
              onSettingsClick={() => setSettingsOpen(true)}
              onFromTokenSelect={handleFromTokenSelect}
              onToTokenSelect={handleToTokenSelect}
              onAmountChange={setAmount}
              onSwapTokens={handleSwapTokens}
              dialogType={dialogType}
              onDialogChange={setDialogType}
              fromTokenBalance={fromTokenBalance}
              hasBalanceError={hasBalanceError}
              onBalanceError={setHasBalanceError}
            />
          </div>

          {/* Right Column - Swap Routes */}
          <div className={`w-full max-w-md mx-auto transition-all duration-700 ease-in-out relative z-0 ${
            showRoutes
              ? 'opacity-100 scale-100'
              : 'opacity-0 lg:-translate-x-[50%] scale-95 pointer-events-none'
          }`}>
            {showRoutes && (
              <SwapRoutes
                fromToken={fromToken}
                toToken={toToken}
                amount={debouncedAmount}
                slippageTolerance={effectiveSlippage}
                autoSlippage={settings.autoSlippage}
                onRouteSelect={setSelectedRoute}
              />
            )}
          </div>
        </div>

        {/* Settings Dialog */}
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          selectedRoute={selectedRoute}
          effectiveSlippage={effectiveSlippage}
          onSlippageChange={setSlippageTolerance}
          onAutoModeChange={enableAutoSlippage}
        />
      </div>
    </div>
  );
}
