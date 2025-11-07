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
 * Custom Router Contract (Your deployed Exchange)
 *
 * Uses the same interface as ETASwap, so we can reuse the ABI.
 * The only difference is the fee destination wallet.
 */
export const CUSTOM_CONTRACT: ContractConfig = {
  address: process.env.NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS || '',
  hederaId: process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID || '',
  abi: ETASwapExchangeABI, // Same interface as ETASwap
  fee: 0.25, // Your custom fee: 0.25%
};

/**
 * Get active router configuration based on network
 */
export function getActiveRouter(): ContractConfig {
  // Always use custom contract if configured
  if (CUSTOM_CONTRACT.address) {
    console.log('🔧 Using Custom Router:', CUSTOM_CONTRACT.hederaId, CUSTOM_CONTRACT.address);
    return CUSTOM_CONTRACT;
  }

  // Check localStorage for network preference (browser only)
  if (typeof window !== 'undefined') {
    const network = localStorage.getItem('hedera_network');
    
    if (network === 'testnet') {
      // Use custom contract for testnet
      if (CUSTOM_CONTRACT.address) {
        console.log('🔧 Using Custom Router (testnet):', CUSTOM_CONTRACT.hederaId);
        return CUSTOM_CONTRACT;
      }
    } else if (network === 'mainnet') {
      // Use custom contract for mainnet too
      if (CUSTOM_CONTRACT.address) {
        console.log('🔧 Using Custom Router (mainnet):', CUSTOM_CONTRACT.hederaId);
        return CUSTOM_CONTRACT;
      }
      console.log('🔧 Using ETASwap Router:', ETASWAP_CONTRACT.hederaId);
      return ETASWAP_CONTRACT;
    }
  }

  // Fallback to env variable
  const routerType = (process.env.NEXT_PUBLIC_SWAP_ROUTER_TYPE || 'custom') as SwapRouterType;

  switch (routerType) {
    case 'custom':
      if (!CUSTOM_CONTRACT.address) {
        console.warn('Custom router not configured, falling back to ETASwap');
        return ETASWAP_CONTRACT;
      }
      console.log('🔧 Using Custom Router (env):', CUSTOM_CONTRACT.hederaId);
      return CUSTOM_CONTRACT;
    case 'etaswap':
    default:
      console.log('🔧 Using ETASwap Router:', ETASWAP_CONTRACT.hederaId);
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
