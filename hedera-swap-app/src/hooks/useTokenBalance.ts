'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { HederaToken } from '@/types/hedera';
import ERC20ABI from '@/lib/contracts/abis/ERC20.json';

export function useTokenBalance(token: HederaToken | null) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { data: balance, isLoading } = useQuery({
    queryKey: ['tokenBalance', token?.evmAddress, address],
    queryFn: async (): Promise<string> => {
      if (!token || !address || !publicClient) {
        return '0';
      }

      try {
        // Para HBAR nativo
        if (token.symbol === 'HBAR') {
          const balance = await publicClient.getBalance({ address });
          return balance.toString();
        } else {
          // Para tokens ERC20
          const balance = await publicClient.readContract({
            address: token.evmAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [address],
          });
          return (balance as bigint).toString();
        }
      } catch (err) {
        console.error('Error obteniendo balance:', err);
        return '0';
      }
    },
    enabled: !!token && !!address && !!publicClient,
    staleTime: 1000 * 30, // 30 segundos - balances no cambian tan rápido
    gcTime: 1000 * 60 * 5, // 5 minutos en cache
    refetchInterval: 1000 * 30, // Refetch cada 30 segundos
  });

  return {
    balance: balance ?? '0',
    loading: isLoading
  };
}
