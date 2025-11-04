'use client';

import { useState } from 'react';
import { HederaToken } from '@/types/hedera';
import { TokenSelector } from './TokenSelector';
import { useQuote } from '@/hooks/useQuote';
import { useSwap } from '@/hooks/useSwap';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useHederaWallet } from '@/hooks/useHederaWallet';
import { formatTokenAmount } from '@/lib/utils/formatters';
import { FeeAmount, DEFAULT_SLIPPAGE_TOLERANCE } from '@/config/saucerswap';

export function SwapWidget() {
  const { address, isConnected, isTestnet, isMainnet, switchToTestnet } = useHederaWallet();
  const [tokenIn, setTokenIn] = useState<HederaToken | null>(null);
  const [tokenOut, setTokenOut] = useState<HederaToken | null>(null);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE_TOLERANCE);

  const { quote, loading: quoteLoading } = useQuote(
    tokenIn,
    tokenOut,
    amountIn,
    FeeAmount.MEDIUM
  );
  const { executeSwapAsync, loading: swapLoading, error: swapError, isSuccess, reset } = useSwap();
  const { balance: balanceIn } = useTokenBalance(tokenIn);

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !quote || !address) return;

    try {
      const txHash = await executeSwapAsync({
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance: parseFloat(quote.route.minimumAmountOut),
        deadline: 0, // Se calcula en el hook
        recipient: address,
        fee: FeeAmount.MEDIUM,
      });

      alert(`Swap exitoso! TX: ${txHash}`);
      setAmountIn('');
      reset(); // Resetear estado de la mutación
    } catch (error) {
      // El error se maneja en el estado del hook
      console.error('Error en swap:', error);
    }
  };

  const handleSwitchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn('');
  };

  const amountOut = quote
    ? formatTokenAmount(quote.amountOut, tokenOut?.decimals || 18)
    : '0';

  const isInsufficientBalance =
    tokenIn && parseFloat(amountIn) > parseFloat(formatTokenAmount(balanceIn, tokenIn.decimals));

  const canSwap =
    isConnected &&
    tokenIn &&
    tokenOut &&
    amountIn &&
    parseFloat(amountIn) > 0 &&
    !isInsufficientBalance &&
    !quoteLoading;

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Swap</h2>

      {/* Network Warning */}
      {isConnected && !isTestnet && !isMainnet && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Red no soportada
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Conecta a Hedera Testnet para usar esta aplicación.
              </p>
              <button
                onClick={switchToTestnet}
                className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-md transition-colors"
              >
                Cambiar a Testnet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token In */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">From</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <TokenSelector
            selectedToken={tokenIn}
            onSelectToken={setTokenIn}
            excludeToken={tokenOut}
          />
        </div>
        {tokenIn && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Balance: {formatTokenAmount(balanceIn, tokenIn.decimals)} {tokenIn.symbol}
          </div>
        )}
        {isInsufficientBalance && (
          <div className="text-xs text-red-500 mt-1">Balance insuficiente</div>
        )}
      </div>

      {/* Switch Button */}
      <div className="flex justify-center my-2">
        <button
          onClick={handleSwitchTokens}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Token Out */}
      <div className="mb-6">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">To</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={amountOut}
            readOnly
            placeholder="0.0"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <TokenSelector
            selectedToken={tokenOut}
            onSelectToken={setTokenOut}
            excludeToken={tokenIn}
          />
        </div>
      </div>

      {/* Quote Info */}
      {quote && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600 dark:text-gray-400">Price Impact:</span>
            <span className={quote.route.priceImpact > 5 ? 'text-red-500' : 'text-gray-900 dark:text-white'}>
              {quote.route.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600 dark:text-gray-400">Minimum Received:</span>
            <span className="text-gray-900 dark:text-white">
              {formatTokenAmount(quote.route.minimumAmountOut, tokenOut?.decimals || 18)}{' '}
              {tokenOut?.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Fee Tier:</span>
            <span className="text-gray-900 dark:text-white">{(quote.route.fee / 10000).toFixed(2)}%</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!canSwap || swapLoading}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
          canSwap && !swapLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        {!isConnected
          ? 'Conectar Wallet'
          : swapLoading
          ? 'Procesando...'
          : quoteLoading
          ? 'Obteniendo cotización...'
          : isInsufficientBalance
          ? 'Balance Insuficiente'
          : !tokenIn || !tokenOut
          ? 'Seleccionar Tokens'
          : !amountIn || parseFloat(amountIn) <= 0
          ? 'Ingresar Cantidad'
          : 'Swap'}
      </button>

      {swapError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {swapError}
        </div>
      )}

      {/* Settings */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
              max="50"
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-gray-600 dark:text-gray-400">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
