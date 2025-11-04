import { Address } from 'viem';

/**
 * SaucerSwap V2 Contract Addresses
 * Source: https://docs.saucerswap.finance/developerx/contract-deployments
 */
export const SAUCERSWAP_CONTRACTS = {
  testnet: {
    // SwapRouter V2 - 0.0.1414040
    router: (process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS || '0x0000000000000000000000000000000000159198') as Address,
    // QuoterV2 - 0.0.1390002
    quoter: (process.env.NEXT_PUBLIC_QUOTER_ADDRESS || '0x0000000000000000000000000000000000153532') as Address,
    // Factory V2 - 0.0.1197038
    factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x000000000000000000000000000000000012446e') as Address,
  },
  mainnet: {
    // SwapRouter V2 - 0.0.3949434
    router: '0x00000000000000000000000000000000003c3f7a' as Address,
    // QuoterV2 - 0.0.3949424
    quoter: '0x00000000000000000000000000000000003c3f70' as Address,
    // Factory V2 - 0.0.3946833
    factory: '0x00000000000000000000000000000000003c39d1' as Address,
  },
};

export const getContracts = () => {
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  return SAUCERSWAP_CONTRACTS[network as keyof typeof SAUCERSWAP_CONTRACTS];
};

// Fee tiers de SaucerSwap V2 (igual que Uniswap V3)
export enum FeeAmount {
  LOWEST = 500,    // 0.05%
  LOW = 3000,      // 0.30%
  MEDIUM = 10000,  // 1.00%
  HIGH = 30000,    // 3.00%
}

// Slippage tolerance por defecto
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.5; // 0.5%

// Deadline por defecto (20 minutos)
export const DEFAULT_DEADLINE_MINUTES = 20;
