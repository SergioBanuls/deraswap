/**
 * Contract Configuration
 *
 * Centralized configuration for swap router contracts.
 * Designed to be easily switchable between ETASwap and custom routers.
 *
 * To switch to custom contract: Update NEXT_PUBLIC_SWAP_ROUTER_TYPE in .env
 */

import { ETASwapExchangeABI } from '@/contracts/abis';

export interface ContractConfig {
  address: string; // EVM address format (0x...)
  hederaId: string; // Hedera format (0.0.X)
  abi: any[];
  fee: number; // Percentage (e.g., 0.3 for 0.3%)
}

export type SwapRouterType = 'etaswap' | 'custom';

/**
 * ETASwap Exchange Contract (Official)
 */
export const ETASWAP_CONTRACT: ContractConfig = {
  address: '0x00000000000000000000000000000000004983f3',
  hederaId: '0.0.4817907',
  abi: ETASwapExchangeABI,
  fee: 0.3,
};

/**
 * Custom Router Contract (Future)
 *
 * This will be your custom contract with modified fee destination.
 * Simply update these values when deploying your contract.
 */
export const CUSTOM_CONTRACT: ContractConfig = {
  address: process.env.NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS || '',
  hederaId: process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID || '',
  abi: [], // Will use custom ABI when available
  fee: 0.3, // Same fee structure
};

/**
 * Get active router configuration based on environment
 */
export function getActiveRouter(): ContractConfig {
  const routerType = (process.env.NEXT_PUBLIC_SWAP_ROUTER_TYPE || 'etaswap') as SwapRouterType;

  switch (routerType) {
    case 'custom':
      if (!CUSTOM_CONTRACT.address) {
        console.warn('Custom router not configured, falling back to ETASwap');
        return ETASWAP_CONTRACT;
      }
      return CUSTOM_CONTRACT;
    case 'etaswap':
    default:
      return ETASWAP_CONTRACT;
  }
}

/**
 * Network-specific configurations
 */
export const NETWORK_CONFIG = {
  testnet: {
    // TODO: Add testnet contract address when available
    exchangeAddress: '',
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
  },
  mainnet: {
    exchangeAddress: ETASWAP_CONTRACT.address,
    mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com',
  },
};

/**
 * Get network-specific configuration
 */
export function getNetworkConfig() {
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  return NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];
}
