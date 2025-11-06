'use client';

import { useState } from 'react';
import { SwapCard } from '@/components/SwapCard';
import { SwapRoutes } from '@/components/SwapRoutes';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';

export default function Home() {
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [dialogType, setDialogType] = useState<'from' | 'to' | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SwapRoute | null>(null);

  // Determine if routes should be shown
  const showRoutes = fromToken !== null && toToken !== null && amount !== '' && parseFloat(amount) > 0;

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleFromTokenSelect = (token: Token) => {
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
  };

  const handleToTokenSelect = (token: Token) => {
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
  };

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
              onFromTokenSelect={handleFromTokenSelect}
              onToTokenSelect={handleToTokenSelect}
              onAmountChange={setAmount}
              onSwapTokens={handleSwapTokens}
              dialogType={dialogType}
              onDialogChange={setDialogType}
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
                amount={amount}
                onRouteSelect={setSelectedRoute}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
