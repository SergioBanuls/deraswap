/**
 * Hook simplificado para testnet - Consulta directa a SaucerSwap
 * 
 * En lugar de usar la API de ETASwap (solo mainnet), consulta
 * directamente los pools de SaucerSwap para calcular el precio.
 * 
 * Útil para testing en testnet antes de ir a mainnet.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Token } from '@/types/token';
import { SwapRoute } from '@/types/route';
import { validateAmount } from '@/utils/amountValidation';

// Direcciones de SaucerSwap en testnet
const SAUCERSWAP_TESTNET_API = 'https://api.saucerswap.finance/v1'; // Verificar si existe
const SAUCERSWAP_TESTNET_POOLS = 'https://api.saucerswap.finance/pools';

interface FetchRoutesParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  balance?: string;
}

/**
 * Calcula el output aproximado basado en una reserva simple x*y=k
 * 
 * @param amountIn - Cantidad de entrada
 * @param reserveIn - Reserva del token de entrada
 * @param reserveOut - Reserva del token de salida
 * @param fee - Fee del pool (ej: 30 para 0.3%)
 */
function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  fee: number = 30 // 0.3% por defecto
): bigint {
  const amountInWithFee = amountIn * BigInt(10000 - fee);
  const numerator = amountInWithFee * reserveOut;
  const denominator = (reserveIn * BigInt(10000)) + amountInWithFee;
  return numerator / denominator;
}

/**
 * Obtiene info del pool de SaucerSwap
 */
async function getSaucerSwapPool(tokenAId: string, tokenBId: string) {
  try {
    // Intenta obtener info del pool desde SaucerSwap
    // Nota: Esto depende de si SaucerSwap tiene API pública de testnet
    
    // Opción 1: Si tienen API
    // const response = await fetch(`${SAUCERSWAP_TESTNET_API}/pools/${tokenAId}/${tokenBId}`);
    // const pool = await response.json();
    // return pool;
    
    // Opción 2: Valores mock para testing
    // Simula un pool HBAR/USDC con liquidez razonable
    return {
      tokenA: tokenAId,
      tokenB: tokenBId,
      reserveA: '10000000000000', // 100k HBAR (8 decimals)
      reserveB: '1000000000',     // 10k USDC (6 decimals)
      fee: 30, // 0.3%
    };
  } catch (error) {
    console.error('Error fetching SaucerSwap pool:', error);
    throw error;
  }
}

/**
 * Calcula una ruta simple para testnet
 * Solo soporta swaps directos (no multi-hop)
 */
async function fetchSimpleRoute({
  fromToken,
  toToken,
  amount,
  balance,
}: FetchRoutesParams): Promise<SwapRoute[]> {
  console.log('🧪 TESTNET MODE: Calculando ruta simple desde SaucerSwap');

  // Validar amount
  const validation = validateAmount(amount, fromToken.decimals, balance);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid amount');
  }

  const inputAmount = BigInt(validation.sanitized!);

  try {
    // Obtener info del pool
    const pool = await getSaucerSwapPool(fromToken.id, toToken.id);
    
    // Calcular output usando la fórmula x*y=k
    const reserveIn = BigInt(pool.reserveA);
    const reserveOut = BigInt(pool.reserveB);
    const outputAmount = getAmountOut(inputAmount, reserveIn, reserveOut, pool.fee);
    
    // Calcular price impact
    const priceImpact = Number(inputAmount * BigInt(10000) / reserveIn) / 100;

    // Formatear output amount
    const outputFormatted = (Number(outputAmount) / Math.pow(10, toToken.decimals)).toFixed(toToken.decimals);

    // Crear ruta simple compatible con el tipo SwapRoute
    const route: SwapRoute = {
      transactionType: 'SWAP',
      aggregatorId: 'SaucerSwapV2',
      amountFrom: amount,
      amountTo: outputAmount.toString(),
      path: '0x', // Path simple, se construye en el backend
      route: [[fromToken.symbol, toToken.symbol]], // Ruta directa
      gasEstimate: 200000, // Estimado para testnet
      outputAmountFormatted: outputFormatted,
      priceImpact: priceImpact,
    };

    console.log('Ruta calculada:', {
      from: fromToken.symbol,
      to: toToken.symbol,
      amountIn: amount,
      amountOut: outputAmount.toString(),
      priceImpact: priceImpact.toFixed(2) + '%',
    });

    return [route];
  } catch (error) {
    console.error('Error calculando ruta:', error);
    return [];
  }
}

/**
 * Hook para obtener rutas de swap en testnet
 * 
 * Versión simplificada que calcula rutas localmente
 * en lugar de usar la API de ETASwap.
 */
export function useSwapRoutes(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string,
  balance?: string,
  slippageTolerance?: number
) {
  return useQuery({
    queryKey: ['swapRoutes', 'testnet-simple', fromToken?.id, toToken?.id, amount],
    queryFn: () => {
      if (!fromToken || !toToken || !amount || amount === '0') {
        return Promise.resolve([]);
      }

      return fetchSimpleRoute({
        fromToken,
        toToken,
        amount,
        balance,
      });
    },
    enabled: Boolean(fromToken && toToken && amount && amount !== '0'),
    staleTime: 30000, // 30 segundos
    gcTime: 60000,    // 1 minuto
    retry: 1,
  });
}
