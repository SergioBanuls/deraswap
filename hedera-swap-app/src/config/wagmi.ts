'use client';

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { cookieStorage, createStorage } from 'wagmi';
import { hederaTestnet, hederaMainnet } from './hedera';

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID no está definido');
}

export const networks = [hederaTestnet, hederaMainnet];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  networks,
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
