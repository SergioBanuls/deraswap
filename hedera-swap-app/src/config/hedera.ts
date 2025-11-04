import { defineChain } from 'viem';

// Hedera Testnet
export const hederaTestnet = defineChain({
  id: 296, // Hedera Testnet Chain ID
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
      webSocket: ['wss://testnet.hashio.io/ws'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
      webSocket: ['wss://testnet.hashio.io/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
});

// Hedera Mainnet
export const hederaMainnet = defineChain({
  id: 295, // Hedera Mainnet Chain ID
  name: 'Hedera Mainnet',
  network: 'hedera-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.hashio.io/api'],
      webSocket: ['wss://mainnet.hashio.io/ws'],
    },
    public: {
      http: ['https://mainnet.hashio.io/api'],
      webSocket: ['wss://mainnet.hashio.io/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/mainnet',
    },
  },
});

// Seleccionar red según variable de entorno
export const currentNetwork =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
    ? hederaMainnet
    : hederaTestnet;
