'use client';

import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import { wagmiAdapter, projectId, networks } from '@/config/wagmi';
import { ReactNode, useState } from 'react';

// Metadata de la aplicación
const metadata = {
  name: 'Hedera Swap',
  description: 'Swap tokens on Hedera using SaucerSwap V2',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://hedera-swap.app',
  icons: [typeof window !== 'undefined' ? window.location.origin + '/icon.png' : 'https://hedera-swap.app/icon.png'],
};

// IDs de wallets destacados de Hedera
// Incluye wallets específicas de Hedera como HashPack, Blade, Kabila
const featuredWalletIds = [
  // HashPack - La wallet más popular de Hedera
  '025d6470fb0e7ba666c0c4d3e8b44bfda30c0fa57b6db0e7c7c5f5d6e4e8c1e8',
  // Blade Wallet
  '8308656f4548bb81b3508afe355cfbb7f0cb6253d1cc7f998080601f838ecee3',
  // MetaMask (también soporta Hedera)
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
];

// Crear AppKit
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as any, // Type assertion para compatibilidad Hedera-AppKit
  metadata,
  featuredWalletIds, // Wallets destacados
  features: {
    analytics: true,
    email: false,
    socials: false,
    allWallets: true, // Mostrar todos los wallets disponibles
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#0066FF',
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  }));

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
