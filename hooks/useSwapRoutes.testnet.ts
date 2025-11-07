/**
 * Hook de prueba para testnet - sin API de ETASwap
 * 
 * Solo para testing básico del contrato.
 * NO usar en producción.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';

interface FetchRoutesParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
}

/**
 * Mock route para testing en testnet
 * 
 * ⚠️ IMPORTANTE: Esta ruta es FALSA, solo para probar
 * que el contrato funciona. En mainnet usa la API real.
 */
async function fetchMockRoutes({
  fromToken,
  toToken,
  amount,
}: FetchRoutesParams): Promise<SwapRoute[]> {
  console.warn('⚠️ USANDO RUTAS MOCK DE TESTNET - Solo para testing');

  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));

  // Ruta mock simple (directo en SaucerSwap)
  const mockRoute: SwapRoute = {
    transactionType: 'SWAP',
    aggregatorId: 'SaucerSwapV2',
    amountFrom: amount,
    amountTo: (BigInt(amount) * BigInt(95) / BigInt(100)).toString(), // -5% aproximado
    path: '0x...', // Path vacío/mock
    route: [],
    gasEstimate: 250000,
    outputAmountFormatted: '0.00',
    priceImpact: 0.5,
  };

  return [mockRoute];
}

export function useSwapRoutes(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string,
  balance?: string,
  slippageTolerance?: number
) {
  return useQuery({
    queryKey: ['swapRoutes', 'testnet', fromToken?.id, toToken?.id, amount],
    queryFn: () => {
      if (!fromToken || !toToken || !amount || amount === '0') {
        return Promise.resolve([]);
      }

      return fetchMockRoutes({
        fromToken,
        toToken,
        amount,
      });
    },
    enabled: Boolean(fromToken && toToken && amount && amount !== '0'),
    staleTime: 30000,
    gcTime: 60000,
  });
}
