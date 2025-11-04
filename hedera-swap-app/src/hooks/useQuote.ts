'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { getContracts, FeeAmount } from '@/config/saucerswap';
import { HederaToken } from '@/types/hedera';
import { QuoteResult } from '@/types/swap';
import QuoterABI from '@/lib/contracts/abis/Quoter.json';
import { parseTokenAmount } from '@/lib/utils/formatters';

export function useQuote(
  tokenIn: HederaToken | null,
  tokenOut: HederaToken | null,
  amountIn: string,
  feeAmount: FeeAmount = FeeAmount.MEDIUM
) {
  const publicClient = usePublicClient();
  const contracts = getContracts();

  const { data: quote, isLoading, error } = useQuery({
    queryKey: [
      'quote',
      tokenIn?.evmAddress,
      tokenOut?.evmAddress,
      amountIn,
      feeAmount,
    ],
    queryFn: async (): Promise<QuoteResult> => {
      if (!tokenIn || !tokenOut || !publicClient) {
        throw new Error('Missing required parameters');
      }

      const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals);

      const result = await publicClient.readContract({
        address: contracts.quoter,
        abi: QuoterABI,
        functionName: 'quoteExactInputSingle',
        args: [
          tokenIn.evmAddress,
          tokenOut.evmAddress,
          feeAmount,
          amountInWei,
          0, // sqrtPriceLimitX96
        ],
      });

      const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];

      // Calcular price impact (simplificado)
      const priceImpact = 0.1; // TODO: calcular correctamente

      return {
        amountOut: amountOut.toString(),
        priceImpact,
        gasEstimate: gasEstimate.toString(),
        route: {
          tokenIn,
          tokenOut,
          fee: feeAmount,
          amountIn: amountInWei,
          amountOut: amountOut.toString(),
          priceImpact,
          minimumAmountOut: (amountOut * BigInt(995) / BigInt(1000)).toString(), // 0.5% slippage
        },
      };
    },
    enabled: !!tokenIn && !!tokenOut && !!amountIn && parseFloat(amountIn) > 0 && !!publicClient,
    staleTime: 1000 * 10, // 10 segundos - quotes se vuelven stale rápido
    gcTime: 1000 * 30, // 30 segundos en cache
    refetchInterval: 1000 * 15, // Refetch cada 15 segundos para mantener precios actualizados
  });

  return {
    quote: quote ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null
  };
}
