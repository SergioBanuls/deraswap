import { HederaToken } from '@/types/hedera';

// Tokens populares en Hedera Testnet
export const TESTNET_TOKENS: HederaToken[] = [
  {
    id: '0.0.0',
    symbol: 'HBAR',
    name: 'Hedera',
    decimals: 8,
    evmAddress: '0x0000000000000000000000000000000000000000',
  },
  {
    id: '0.0.1234567', // Placeholder - reemplazar con token real de testnet
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    evmAddress: '0x0000000000000000000000000000000000000001', // Placeholder
  },
  {
    id: '0.0.7654321', // Placeholder - reemplazar con token real de testnet
    symbol: 'SAUCE',
    name: 'SaucerSwap Token',
    decimals: 6,
    evmAddress: '0x0000000000000000000000000000000000000002', // Placeholder
  },
];

// Tokens en Mainnet
export const MAINNET_TOKENS: HederaToken[] = [
  {
    id: '0.0.0',
    symbol: 'HBAR',
    name: 'Hedera',
    decimals: 8,
    evmAddress: '0x0000000000000000000000000000000000000000',
  },
  {
    id: '0.0.456858',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    evmAddress: '0x000000000000000000000000000000000006f89a',
  },
  {
    id: '0.0.731861',
    symbol: 'SAUCE',
    name: 'SaucerSwap',
    decimals: 6,
    evmAddress: '0x00000000000000000000000000000000000b2a65',
  },
  {
    id: '0.0.1456986',
    symbol: 'HBARX',
    name: 'Stader HBARX',
    decimals: 8,
    evmAddress: '0x00000000000000000000000000000000001635ba',
  },
];

export const getTokenList = (): HederaToken[] => {
  return process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
    ? MAINNET_TOKENS
    : TESTNET_TOKENS;
};

export const findTokenBySymbol = (symbol: string): HederaToken | undefined => {
  return getTokenList().find((token) => token.symbol === symbol);
};

export const findTokenByAddress = (address: string): HederaToken | undefined => {
  return getTokenList().find((token) => token.evmAddress?.toLowerCase() === address.toLowerCase());
};
