'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { getContracts, DEFAULT_DEADLINE_MINUTES } from '@/config/saucerswap';
import { SwapParams } from '@/types/swap';
import SwapRouterABI from '@/lib/contracts/abis/SwapRouter.json';
import ERC20ABI from '@/lib/contracts/abis/ERC20.json';
import { parseTokenAmount } from '@/lib/utils/formatters';

export function useSwap() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const contracts = getContracts();
  const queryClient = useQueryClient();

  const checkAllowance = async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!address || !publicClient) return false;

    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [address, contracts.router],
      });

      return BigInt(allowance as bigint) >= BigInt(amount);
    } catch (err) {
      console.error('Error verificando allowance:', err);
      return false;
    }
  };

  const approveToken = async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!walletClient || !address) return false;

    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [contracts.router, BigInt(amount)],
        account: address,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return true;
    } catch (err) {
      console.error('Error aprobando token:', err);
      return false;
    }
  };

  const swapMutation = useMutation({
    mutationFn: async (params: SwapParams): Promise<string> => {
      if (!walletClient || !address || !publicClient) {
        throw new Error('Wallet no conectada');
      }

      const amountInWei = parseTokenAmount(params.amountIn, params.tokenIn.decimals);
      const minimumAmountOut = BigInt(params.slippageTolerance);
      const deadline = Math.floor(Date.now() / 1000) + (DEFAULT_DEADLINE_MINUTES * 60);

      // 1. Verificar y aprobar si es necesario (skip para HBAR)
      if (params.tokenIn.symbol !== 'HBAR') {
        const hasAllowance = await checkAllowance(
          params.tokenIn.evmAddress!,
          amountInWei
        );

        if (!hasAllowance) {
          const approved = await approveToken(
            params.tokenIn.evmAddress!,
            amountInWei
          );

          if (!approved) {
            throw new Error('Aprobación de token cancelada o fallida');
          }
        }
      }

      // 2. Ejecutar swap
      const swapParams = {
        tokenIn: params.tokenIn.evmAddress,
        tokenOut: params.tokenOut.evmAddress,
        fee: params.fee || 3000, // Default medium fee
        recipient: params.recipient || address,
        amountIn: BigInt(amountInWei),
        amountOutMinimum: minimumAmountOut,
        sqrtPriceLimitX96: 0n,
      };

      const hash = await walletClient.writeContract({
        address: contracts.router,
        abi: SwapRouterABI,
        functionName: 'exactInputSingle',
        args: [swapParams],
        account: address,
        value: params.tokenIn.symbol === 'HBAR' ? BigInt(amountInWei) : 0n,
      });

      // 3. Esperar confirmación
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        return hash;
      } else {
        throw new Error('Transacción falló');
      }
    },
    onSuccess: (hash, variables) => {
      // Invalidar cache de balances después de un swap exitoso
      queryClient.invalidateQueries({
        queryKey: ['tokenBalance', variables.tokenIn.evmAddress, address]
      });
      queryClient.invalidateQueries({
        queryKey: ['tokenBalance', variables.tokenOut.evmAddress, address]
      });
    },
  });

  return {
    executeSwap: swapMutation.mutate,
    executeSwapAsync: swapMutation.mutateAsync,
    loading: swapMutation.isPending,
    error: swapMutation.error?.message ?? null,
    isSuccess: swapMutation.isSuccess,
    reset: swapMutation.reset,
  };
}
