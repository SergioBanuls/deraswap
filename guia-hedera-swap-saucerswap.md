# Guía Completa: Implementación de Swap en Hedera con SaucerSwap V2 y Reown AppKit

> **✨ Optimizado con TanStack Query**: Esta guía implementa cache inteligente de llamadas utilizando TanStack Query (React Query) para optimizar el rendimiento, reducir llamadas a la blockchain y mejorar la experiencia de usuario.

## Índice
1. [Fase 1: Configuración Inicial del Proyecto](#fase-1-configuración-inicial-del-proyecto)
2. [Fase 2: Integración de Reown AppKit](#fase-2-integración-de-reown-appkit)
3. [Fase 3: Configuración de Hedera Wallet Connect](#fase-3-configuración-de-hedera-wallet-connect)
4. [Fase 4: Integración con SaucerSwap V2](#fase-4-integración-con-saucerswap-v2)
5. [Fase 5: Implementación del Componente de Swap](#fase-5-implementación-del-componente-de-swap)
6. [Fase 6: Testing y Deployment](#fase-6-testing-y-deployment)

## Características Principales

✅ **Cache Inteligente**: TanStack Query para optimización de llamadas
✅ **Refetch Automático**: Datos siempre actualizados con intervalos configurables
✅ **Invalidación Selectiva**: Cache se actualiza automáticamente después de transacciones
✅ **Retry Automático**: Reintentos en caso de errores temporales
✅ **Developer Tools**: Visualización del cache en tiempo real (desarrollo)

---

## Arquitectura General del Proyecto

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         TanStack Query (Cache Layer)             │   │
│  │  - Quotes Cache (10s stale, 15s refetch)        │   │
│  │  - Balance Cache (30s stale, 30s refetch)       │   │
│  │  - Auto invalidation on swap success            │   │
│  └──────────────────────────────────────────────────┘   │
│                        │                                 │
│  ┌──────────────┐    ┌─────────────────────────────┐   │
│  │  Reown       │───▶│  Hedera WalletConnect       │   │
│  │  AppKit      │    │  (@hashgraph/hedera-wallet- │   │
│  │  (UI/UX)     │    │   connect)                  │   │
│  └──────────────┘    └─────────────────────────────┘   │
│         │                        │                       │
│         │                        │                       │
│         ▼                        ▼                       │
│  ┌────────────────────────────────────────────────┐    │
│  │   Wallet Connections                            │    │
│  │   - HashPack                                    │    │
│  │   - Kabila                                      │    │
│  │   - Blade                                       │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │   SaucerSwap V2 Smart Contracts                │    │
│  │   - SwapRouter                                  │    │
│  │   - Quoter                                      │    │
│  │   - Factory                                     │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│              Hedera Network                              │
│              (Testnet → Mainnet)                         │
└─────────────────────────────────────────────────────────┘
```

---

## Fase 1: Configuración Inicial del Proyecto

### Objetivo
Crear un proyecto Next.js 14+ con TypeScript y configurar las dependencias básicas necesarias.

### Checklist de Tareas

- [ ] **1.1** Crear proyecto Next.js con App Router
  ```bash
  npx create-next-app@latest hedera-swap-app
  # Seleccionar:
  # - TypeScript: Yes
  # - ESLint: Yes
  # - Tailwind CSS: Yes
  # - src/ directory: Yes
  # - App Router: Yes
  # - Import alias: @/* (default)
  ```

- [ ] **1.2** Instalar dependencias de Reown AppKit
  ```bash
  npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
  ```

- [ ] **1.3** Instalar dependencias de Hedera
  ```bash
  npm install @hashgraph/hedera-wallet-connect @hashgraph/sdk
  ```

- [ ] **1.4** Instalar dependencias adicionales
  ```bash
  npm install ethers axios
  npm install -D @types/node @tanstack/react-query-devtools
  ```

  **Nota:** `@tanstack/react-query-devtools` es opcional pero muy recomendado para desarrollo, permite visualizar el cache y las queries en tiempo real.

- [ ] **1.5** Crear estructura de carpetas del proyecto
  ```
  src/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── providers.tsx
  ├── components/
  │   ├── swap/
  │   │   ├── SwapWidget.tsx
  │   │   ├── TokenSelector.tsx
  │   │   └── SwapButton.tsx
  │   └── wallet/
  │       └── ConnectButton.tsx
  ├── config/
  │   ├── hedera.ts
  │   ├── saucerswap.ts
  │   └── wagmi.ts
  ├── hooks/
  │   ├── useSwap.ts
  │   ├── useTokenBalance.ts
  │   └── useQuote.ts
  ├── lib/
  │   ├── contracts/
  │   │   ├── SwapRouter.ts
  │   │   └── Quoter.ts
  │   └── utils/
  │       ├── formatters.ts
  │       └── constants.ts
  └── types/
      ├── hedera.ts
      └── swap.ts
  ```

- [ ] **1.6** Configurar variables de entorno
  - Crear archivo `.env.local`
  ```env
  # Reown Project ID
  NEXT_PUBLIC_REOWN_PROJECT_ID=tu_project_id_aqui

  # Hedera Network
  NEXT_PUBLIC_HEDERA_NETWORK=testnet # o mainnet

  # Contract Addresses (se llenarán en Fase 4)
  NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=
  NEXT_PUBLIC_QUOTER_ADDRESS=
  NEXT_PUBLIC_FACTORY_ADDRESS=
  ```

- [ ] **1.7** Actualizar `next.config.js` para webpack externals
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    webpack: (config) => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      return config;
    },
  };

  module.exports = nextConfig;
  ```

- [ ] **1.8** Verificar que el proyecto arranca correctamente
  ```bash
  npm run dev
  # Debería abrir en http://localhost:3000
  ```

### Resultado Esperado
✅ Proyecto Next.js funcional con TypeScript
✅ Todas las dependencias instaladas
✅ Estructura de carpetas creada
✅ Variables de entorno configuradas

---

## Fase 2: Integración de Reown AppKit

### Objetivo
Configurar Reown AppKit para conectar wallets de Hedera usando el enfoque EVM compatible.

### Checklist de Tareas

- [ ] **2.1** Obtener Project ID de Reown
  - Ir a https://dashboard.reown.com/
  - Crear nuevo proyecto
  - Copiar el Project ID
  - Agregarlo a `.env.local` como `NEXT_PUBLIC_REOWN_PROJECT_ID`

- [ ] **2.2** Crear configuración de Hedera para Wagmi
  - Crear archivo `src/config/hedera.ts`:
  ```typescript
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
  ```

- [ ] **2.3** Crear configuración de Wagmi
  - Crear archivo `src/config/wagmi.ts`:
  ```typescript
  'use client';

  import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
  import { cookieStorage, createStorage } from 'wagmi';
  import { hederaTestnet, hederaMainnet, currentNetwork } from './hedera';

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
  ```

- [ ] **2.4** Crear el Context Provider de AppKit
  - Crear archivo `src/app/providers.tsx`:
  ```typescript
  'use client';

  import { createAppKit } from '@reown/appkit/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { WagmiProvider } from 'wagmi';
  import { wagmiAdapter, projectId, networks } from '@/config/wagmi';
  import { ReactNode, useState } from 'react';

  // Metadata de la aplicación
  const metadata = {
    name: 'Hedera Swap',
    description: 'Swap tokens on Hedera using SaucerSwap V2',
    url: 'https://hedera-swap.app', // Cambiar por tu URL
    icons: ['https://hedera-swap.app/icon.png'], // Cambiar por tu icon
  };

  // Crear AppKit
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    metadata,
    features: {
      analytics: true,
      email: false,
      socials: false,
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
        </QueryClientProvider>
      </WagmiProvider>
    );
  }
  ```

- [ ] **2.5** Actualizar `src/app/layout.tsx` para incluir Providers
  ```typescript
  import type { Metadata } from 'next';
  import { Inter } from 'next/font/google';
  import './globals.css';
  import { Providers } from './providers';
  import { headers } from 'next/headers';

  const inter = Inter({ subsets: ['latin'] });

  export const metadata: Metadata = {
    title: 'Hedera Swap - SaucerSwap V2',
    description: 'Swap tokens on Hedera Network',
  };

  export default async function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const cookies = (await headers()).get('cookie');

    return (
      <html lang="en">
        <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }
  ```

- [ ] **2.6** Crear componente de botón de conexión
  - Crear archivo `src/components/wallet/ConnectButton.tsx`:
  ```typescript
  'use client';

  import { useAppKit } from '@reown/appkit/react';
  import { useAccount, useDisconnect } from 'wagmi';

  export function ConnectButton() {
    const { open } = useAppKit();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    if (isConnected && address) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => open()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
      >
        Connect Wallet
      </button>
    );
  }
  ```

- [ ] **2.7** Probar conexión de wallet
  - Actualizar `src/app/page.tsx` para incluir el botón:
  ```typescript
  import { ConnectButton } from '@/components/wallet/ConnectButton';

  export default function Home() {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-8">Hedera Swap</h1>
        <ConnectButton />
      </main>
    );
  }
  ```

- [ ] **2.8** Verificar que la conexión funciona
  - Ejecutar `npm run dev`
  - Abrir http://localhost:3000
  - Hacer clic en "Connect Wallet"
  - Verificar que aparecen las wallets de Hedera (HashPack, Kabila, Blade)
  - Conectar con HashPack o wallet disponible

### Resultado Esperado
✅ Reown AppKit configurado
✅ Botón de conexión funcional
✅ Wallets de Hedera visibles (HashPack, Kabila, Blade)
✅ Conexión exitosa con wallet

---

## Fase 3: Configuración de Hedera Wallet Connect

### Objetivo
Integrar Hedera Wallet Connect para manejar transacciones nativas de Hedera junto con el enfoque EVM.

### Checklist de Tareas

- [ ] **3.1** Crear configuración de Hedera Wallet Connect
  - Crear archivo `src/config/hederaWalletConnect.ts`:
  ```typescript
  import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod } from '@hashgraph/hedera-wallet-connect';

  export const dAppMetadata = {
    name: 'Hedera Swap',
    description: 'Swap tokens on Hedera using SaucerSwap V2',
    url: window.location.origin,
    icons: [window.location.origin + '/icon.png'],
  };

  // Métodos soportados
  export const supportedMethods = [
    HederaJsonRpcMethod.SignAndExecuteTransaction,
    HederaJsonRpcMethod.SignTransaction,
    HederaJsonRpcMethod.SignMessage,
    HederaJsonRpcMethod.GetAccountInfo,
    HederaJsonRpcMethod.GetAccountBalance,
  ];

  // Eventos soportados
  export const supportedEvents = [
    HederaSessionEvent.ChainChanged,
    HederaSessionEvent.AccountsChanged,
  ];

  let dAppConnector: DAppConnector | null = null;

  export const initializeDAppConnector = async (projectId: string) => {
    if (dAppConnector) return dAppConnector;

    dAppConnector = new DAppConnector(
      dAppMetadata,
      process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
      projectId,
      supportedMethods,
      supportedEvents
    );

    await dAppConnector.init();
    return dAppConnector;
  };

  export const getDAppConnector = () => {
    if (!dAppConnector) {
      throw new Error('DAppConnector no ha sido inicializado. Llama a initializeDAppConnector primero.');
    }
    return dAppConnector;
  };
  ```

- [ ] **3.2** Crear hook para Hedera Wallet Connect
  - Crear archivo `src/hooks/useHederaWallet.ts`:
  ```typescript
  'use client';

  import { useEffect, useState } from 'react';
  import { initializeDAppConnector, getDAppConnector } from '@/config/hederaWalletConnect';
  import { projectId } from '@/config/wagmi';
  import { AccountId } from '@hashgraph/sdk';

  export function useHederaWallet() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);

    useEffect(() => {
      const init = async () => {
        try {
          const connector = await initializeDAppConnector(projectId);
          setIsInitialized(true);

          // Escuchar cambios de cuenta
          connector.onSessionUpdate((session) => {
            if (session.namespaces.hedera?.accounts?.[0]) {
              const accountId = session.namespaces.hedera.accounts[0].split(':')[2];
              setHederaAccountId(accountId);
            }
          });
        } catch (error) {
          console.error('Error inicializando Hedera Wallet Connect:', error);
        }
      };

      init();
    }, []);

    const getAccountBalance = async () => {
      if (!hederaAccountId) return null;

      try {
        const connector = getDAppConnector();
        const balance = await connector.getAccountBalance(
          AccountId.fromString(hederaAccountId)
        );
        return balance;
      } catch (error) {
        console.error('Error obteniendo balance:', error);
        return null;
      }
    };

    return {
      isInitialized,
      hederaAccountId,
      getAccountBalance,
      connector: isInitialized ? getDAppConnector() : null,
    };
  }
  ```

- [ ] **3.3** Crear tipos de TypeScript para Hedera
  - Crear archivo `src/types/hedera.ts`:
  ```typescript
  export interface HederaToken {
    id: string; // Token ID en formato 0.0.xxxxx
    symbol: string;
    name: string;
    decimals: number;
    balance?: string;
    evmAddress?: string; // Dirección EVM del token (si aplica)
  }

  export interface HederaAccount {
    accountId: string;
    evmAddress: string;
    balance: {
      hbar: string;
      tokens: HederaToken[];
    };
  }

  export interface HederaTransaction {
    transactionId: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: number;
    type: 'swap' | 'approval' | 'transfer';
  }
  ```

- [ ] **3.4** Crear utilidades para conversión de formatos
  - Crear archivo `src/lib/utils/formatters.ts`:
  ```typescript
  import { AccountId } from '@hashgraph/sdk';

  /**
   * Convierte un Hedera Account ID (0.0.xxxxx) a dirección EVM
   */
  export function accountIdToEvmAddress(accountId: string): string {
    const account = AccountId.fromString(accountId);
    return account.toSolidityAddress();
  }

  /**
   * Convierte dirección EVM a Hedera Account ID
   */
  export function evmAddressToAccountId(evmAddress: string, shard = 0, realm = 0): string {
    // Remover '0x' si existe
    const cleanAddress = evmAddress.replace('0x', '');

    // Los últimos 20 bytes (40 caracteres hex) son el account num
    const accountNum = parseInt(cleanAddress.slice(-40), 16);

    return `${shard}.${realm}.${accountNum}`;
  }

  /**
   * Formatea HBAR (de tinybars a HBAR)
   */
  export function formatHbar(tinybars: string | number): string {
    const hbar = Number(tinybars) / 100_000_000;
    return hbar.toFixed(4);
  }

  /**
   * Formatea cantidad de token según decimales
   */
  export function formatTokenAmount(amount: string | number, decimals: number): string {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(4);
  }

  /**
   * Parsea cantidad de HBAR a tinybars
   */
  export function parseHbar(hbar: string | number): string {
    const tinybars = Number(hbar) * 100_000_000;
    return Math.floor(tinybars).toString();
  }

  /**
   * Parsea cantidad de token según decimales
   */
  export function parseTokenAmount(amount: string | number, decimals: number): string {
    const value = Number(amount) * Math.pow(10, decimals);
    return Math.floor(value).toString();
  }

  /**
   * Trunca dirección para mostrar
   */
  export function truncateAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }
  ```

- [ ] **3.5** Actualizar ConnectButton para mostrar Hedera Account ID
  ```typescript
  'use client';

  import { useAppKit } from '@reown/appkit/react';
  import { useAccount, useDisconnect } from 'wagmi';
  import { useHederaWallet } from '@/hooks/useHederaWallet';

  export function ConnectButton() {
    const { open } = useAppKit();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { hederaAccountId } = useHederaWallet();

    if (isConnected && address) {
      return (
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-600">
            <div>EVM: {address.slice(0, 6)}...{address.slice(-4)}</div>
            {hederaAccountId && (
              <div>Hedera: {hederaAccountId}</div>
            )}
          </div>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => open()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
      >
        Connect Wallet
      </button>
    );
  }
  ```

### Resultado Esperado
✅ Hedera Wallet Connect configurado
✅ Conexión dual (EVM + Hedera nativo)
✅ Account ID de Hedera visible
✅ Utilidades de conversión funcionando

---

## Fase 4: Integración con SaucerSwap V2

### Objetivo
Configurar contratos de SaucerSwap V2 y preparar la infraestructura para ejecutar swaps.

### Checklist de Tareas

- [ ] **4.1** Investigar y documentar direcciones de contratos
  - **Testnet:**
    - Buscar en docs de SaucerSwap o HashScan
    - Router V2: `___________` (completar)
    - Quoter V2: `___________` (completar)
    - Factory V2: `___________` (completar)

  - **Mainnet:**
    - Router V2: `___________` (completar)
    - Quoter V2: `___________` (completar)
    - Factory V2: `___________` (completar)

- [ ] **4.2** Actualizar `.env.local` con direcciones de contratos
  ```env
  # SaucerSwap V2 Contracts (Testnet)
  NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x...
  NEXT_PUBLIC_QUOTER_ADDRESS=0x...
  NEXT_PUBLIC_FACTORY_ADDRESS=0x...
  ```

- [ ] **4.3** Crear configuración de SaucerSwap
  - Crear archivo `src/config/saucerswap.ts`:
  ```typescript
  import { Address } from 'viem';

  export const SAUCERSWAP_CONTRACTS = {
    testnet: {
      router: process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS as Address,
      quoter: process.env.NEXT_PUBLIC_QUOTER_ADDRESS as Address,
      factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address,
    },
    mainnet: {
      router: '0x...' as Address, // Completar con mainnet
      quoter: '0x...' as Address,
      factory: '0x...' as Address,
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
  ```

- [ ] **4.4** Obtener ABIs de los contratos
  - Opción 1: Desde repositorio de SaucerSwap
  - Opción 2: Desde Uniswap V3 (compatible)

  - Crear archivo `src/lib/contracts/abis/SwapRouter.json`:
  ```json
  [
    {
      "inputs": [
        {
          "components": [
            {"internalType": "address", "name": "tokenIn", "type": "address"},
            {"internalType": "address", "name": "tokenOut", "type": "address"},
            {"internalType": "uint24", "name": "fee", "type": "uint24"},
            {"internalType": "address", "name": "recipient", "type": "address"},
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
            {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
          ],
          "internalType": "struct ISwapRouter.ExactInputSingleParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "exactInputSingle",
      "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
      "stateMutability": "payable",
      "type": "function"
    }
  ]
  ```

  - Crear archivo `src/lib/contracts/abis/Quoter.json`:
  ```json
  [
    {
      "inputs": [
        {"internalType": "address", "name": "tokenIn", "type": "address"},
        {"internalType": "address", "name": "tokenOut", "type": "address"},
        {"internalType": "uint24", "name": "fee", "type": "uint24"},
        {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
        {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
      ],
      "name": "quoteExactInputSingle",
      "outputs": [
        {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
        {"internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160"},
        {"internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32"},
        {"internalType": "uint256", "name": "gasEstimate", "type": "uint256"}
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
  ```

  - Crear archivo `src/lib/contracts/abis/ERC20.json` (para tokens):
  ```json
  [
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_spender", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {"name": "_owner", "type": "address"},
        {"name": "_spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{"name": "", "type": "uint8"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{"name": "", "type": "string"}],
      "type": "function"
    }
  ]
  ```

- [ ] **4.5** Crear lista de tokens soportados
  - Crear archivo `src/lib/utils/constants.ts`:
  ```typescript
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
      id: '0.0.xxxxx', // Completar con token de test
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      evmAddress: '0x...', // Completar
    },
    {
      id: '0.0.xxxxx', // Completar
      symbol: 'SAUCE',
      name: 'SaucerSwap Token',
      decimals: 18,
      evmAddress: '0x...', // Completar
    },
    // Agregar más tokens según disponibilidad en testnet
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
    // Agregar más tokens mainnet
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
  ```

- [ ] **4.6** Crear tipos para Swap
  - Crear archivo `src/types/swap.ts`:
  ```typescript
  import { HederaToken } from './hedera';

  export interface SwapRoute {
    tokenIn: HederaToken;
    tokenOut: HederaToken;
    fee: number; // Fee tier
    amountIn: string;
    amountOut: string;
    priceImpact: number;
    minimumAmountOut: string;
  }

  export interface QuoteResult {
    amountOut: string;
    priceImpact: number;
    gasEstimate: string;
    route: SwapRoute;
  }

  export interface SwapParams {
    tokenIn: HederaToken;
    tokenOut: HederaToken;
    amountIn: string;
    slippageTolerance: number;
    deadline: number;
    recipient: string;
  }

  export interface SwapState {
    tokenIn: HederaToken | null;
    tokenOut: HederaToken | null;
    amountIn: string;
    amountOut: string;
    loading: boolean;
    error: string | null;
  }
  ```

### Resultado Esperado
✅ Direcciones de contratos configuradas
✅ ABIs de contratos disponibles
✅ Lista de tokens configurada
✅ Tipos de TypeScript definidos

---

## Fase 5: Implementación del Componente de Swap

### Objetivo
Crear la interfaz de usuario y lógica del swap, incluyendo cotización, aprobación de tokens y ejecución de swap.

### Checklist de Tareas

- [ ] **5.1** Crear hook para obtener cotización (quote) con TanStack Query
  - Crear archivo `src/hooks/useQuote.ts`:
  ```typescript
  'use client';

  import { useQuery } from '@tanstack/react-query';
  import { usePublicClient } from 'wagmi';
  import { getContracts, FeeAmount } from '@/config/saucerswap';
  import { HederaToken } from '@/types/hedera';
  import { QuoteResult } from '@/types/swap';
  import QuoterABI from '@/lib/contracts/abis/Quoter.json';
  import { parseTokenAmount } from '@/lib/utils/formatters';

  export function useQuote(
    tokenIn: HederaToken | null,
    tokenOut: HederaToken | null,
    amountIn: string,
    feeAmount: FeeAmount = FeeAmount.MEDIUM
  ) {
    const publicClient = usePublicClient();
    const contracts = getContracts();

    const { data: quote, isLoading, error } = useQuery({
      queryKey: [
        'quote',
        tokenIn?.evmAddress,
        tokenOut?.evmAddress,
        amountIn,
        feeAmount,
      ],
      queryFn: async (): Promise<QuoteResult> => {
        if (!tokenIn || !tokenOut || !publicClient) {
          throw new Error('Missing required parameters');
        }

        const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals);

        const result = await publicClient.readContract({
          address: contracts.quoter,
          abi: QuoterABI,
          functionName: 'quoteExactInputSingle',
          args: [
            tokenIn.evmAddress,
            tokenOut.evmAddress,
            feeAmount,
            amountInWei,
            0, // sqrtPriceLimitX96
          ],
        });

        const [amountOut, , , gasEstimate] = result as [bigint, bigint, number, bigint];

        // Calcular price impact (simplificado)
        const priceImpact = 0.1; // TODO: calcular correctamente

        return {
          amountOut: amountOut.toString(),
          priceImpact,
          gasEstimate: gasEstimate.toString(),
          route: {
            tokenIn,
            tokenOut,
            fee: feeAmount,
            amountIn: amountInWei,
            amountOut: amountOut.toString(),
            priceImpact,
            minimumAmountOut: (amountOut * BigInt(995) / BigInt(1000)).toString(), // 0.5% slippage
          },
        };
      },
      enabled: !!tokenIn && !!tokenOut && !!amountIn && parseFloat(amountIn) > 0 && !!publicClient,
      staleTime: 1000 * 10, // 10 segundos - quotes se vuelven stale rápido
      gcTime: 1000 * 30, // 30 segundos en cache
      refetchInterval: 1000 * 15, // Refetch cada 15 segundos para mantener precios actualizados
    });

    return {
      quote: quote ?? null,
      loading: isLoading,
      error: error ? (error as Error).message : null
    };
  }
  ```

- [ ] **5.2** Crear hook para balance de tokens con TanStack Query
  - Crear archivo `src/hooks/useTokenBalance.ts`:
  ```typescript
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
  ```

- [ ] **5.3** Crear hook principal de swap con TanStack Query
  - Crear archivo `src/hooks/useSwap.ts`:
  ```typescript
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
  ```

- [ ] **5.4** Crear componente selector de tokens
  - Crear archivo `src/components/swap/TokenSelector.tsx`:
  ```typescript
  'use client';

  import { useState } from 'react';
  import { HederaToken } from '@/types/hedera';
  import { getTokenList } from '@/lib/utils/constants';
  import { formatTokenAmount } from '@/lib/utils/formatters';
  import { useTokenBalance } from '@/hooks/useTokenBalance';

  interface TokenSelectorProps {
    selectedToken: HederaToken | null;
    onSelectToken: (token: HederaToken) => void;
    excludeToken?: HederaToken | null;
  }

  export function TokenSelector({
    selectedToken,
    onSelectToken,
    excludeToken,
  }: TokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const tokens = getTokenList();
    const { balance } = useTokenBalance(selectedToken);

    const filteredTokens = tokens.filter(
      (token) => !excludeToken || token.symbol !== excludeToken.symbol
    );

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          {selectedToken ? (
            <>
              <span className="font-semibold">{selectedToken.symbol}</span>
              <span className="text-xs text-gray-500">
                Balance: {formatTokenAmount(balance, selectedToken.decimals)}
              </span>
            </>
          ) : (
            <span>Seleccionar token</span>
          )}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => {
                  onSelectToken(token);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **5.5** Crear componente principal de Swap
  - Crear archivo `src/components/swap/SwapWidget.tsx`:
  ```typescript
  'use client';

  import { useState } from 'react';
  import { useAccount } from 'wagmi';
  import { HederaToken } from '@/types/hedera';
  import { TokenSelector } from './TokenSelector';
  import { useQuote } from '@/hooks/useQuote';
  import { useSwap } from '@/hooks/useSwap';
  import { useTokenBalance } from '@/hooks/useTokenBalance';
  import { formatTokenAmount } from '@/lib/utils/formatters';
  import { FeeAmount, DEFAULT_SLIPPAGE_TOLERANCE } from '@/config/saucerswap';

  export function SwapWidget() {
    const { address, isConnected } = useAccount();
    const [tokenIn, setTokenIn] = useState<HederaToken | null>(null);
    const [tokenOut, setTokenOut] = useState<HederaToken | null>(null);
    const [amountIn, setAmountIn] = useState('');
    const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE_TOLERANCE);

    const { quote, loading: quoteLoading } = useQuote(
      tokenIn,
      tokenOut,
      amountIn,
      FeeAmount.MEDIUM
    );
    const { executeSwapAsync, loading: swapLoading, error: swapError, isSuccess, reset } = useSwap();
    const { balance: balanceIn } = useTokenBalance(tokenIn);

    const handleSwap = async () => {
      if (!tokenIn || !tokenOut || !quote || !address) return;

      try {
        const txHash = await executeSwapAsync({
          tokenIn,
          tokenOut,
          amountIn,
          slippageTolerance: parseFloat(quote.route.minimumAmountOut),
          deadline: 0, // Se calcula en el hook
          recipient: address,
          fee: FeeAmount.MEDIUM,
        });

        alert(`Swap exitoso! TX: ${txHash}`);
        setAmountIn('');
        reset(); // Resetear estado de la mutación
      } catch (error) {
        // El error se maneja en el estado del hook
        console.error('Error en swap:', error);
      }
    };

    const handleSwitchTokens = () => {
      const temp = tokenIn;
      setTokenIn(tokenOut);
      setTokenOut(temp);
      setAmountIn('');
    };

    const amountOut = quote
      ? formatTokenAmount(quote.amountOut, tokenOut?.decimals || 18)
      : '0';

    const isInsufficientBalance =
      tokenIn && parseFloat(amountIn) > parseFloat(formatTokenAmount(balanceIn, tokenIn.decimals));

    const canSwap =
      isConnected &&
      tokenIn &&
      tokenOut &&
      amountIn &&
      parseFloat(amountIn) > 0 &&
      !isInsufficientBalance &&
      !quoteLoading;

    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Swap</h2>

        {/* Token In */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-4 py-3 border rounded-lg text-lg"
            />
            <TokenSelector
              selectedToken={tokenIn}
              onSelectToken={setTokenIn}
              excludeToken={tokenOut}
            />
          </div>
          {tokenIn && (
            <div className="text-xs text-gray-500 mt-1">
              Balance: {formatTokenAmount(balanceIn, tokenIn.decimals)}
            </div>
          )}
          {isInsufficientBalance && (
            <div className="text-xs text-red-500 mt-1">Balance insuficiente</div>
          )}
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleSwitchTokens}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Token Out */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">To</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={amountOut}
              readOnly
              placeholder="0.0"
              className="flex-1 px-4 py-3 border rounded-lg text-lg bg-gray-50"
            />
            <TokenSelector
              selectedToken={tokenOut}
              onSelectToken={setTokenOut}
              excludeToken={tokenIn}
            />
          </div>
        </div>

        {/* Quote Info */}
        {quote && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Price Impact:</span>
              <span className={quote.route.priceImpact > 5 ? 'text-red-500' : ''}>
                {quote.route.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Minimum Received:</span>
              <span>
                {formatTokenAmount(quote.route.minimumAmountOut, tokenOut?.decimals || 18)}{' '}
                {tokenOut?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee Tier:</span>
              <span>{(quote.route.fee / 10000).toFixed(2)}%</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!canSwap || swapLoading}
          className={`w-full py-4 rounded-lg font-semibold text-lg ${
            canSwap && !swapLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!isConnected
            ? 'Conectar Wallet'
            : swapLoading
            ? 'Procesando...'
            : quoteLoading
            ? 'Obteniendo cotización...'
            : isInsufficientBalance
            ? 'Balance Insuficiente'
            : !tokenIn || !tokenOut
            ? 'Seleccionar Tokens'
            : !amountIn || parseFloat(amountIn) <= 0
            ? 'Ingresar Cantidad'
            : 'Swap'}
        </button>

        {swapError && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {swapError}
          </div>
        )}

        {/* Settings */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Slippage Tolerance:</span>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
              max="50"
              className="w-20 px-2 py-1 border rounded text-right"
            />
            <span className="text-gray-600">%</span>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **5.6** Integrar SwapWidget en la página principal
  - Actualizar `src/app/page.tsx`:
  ```typescript
  import { ConnectButton } from '@/components/wallet/ConnectButton';
  import { SwapWidget } from '@/components/swap/SwapWidget';

  export default function Home() {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-3xl font-bold">Hedera Swap</h1>
            <ConnectButton />
          </div>

          {/* Swap Widget */}
          <div className="flex justify-center">
            <SwapWidget />
          </div>
        </div>
      </main>
    );
  }
  ```

### Resultado Esperado
✅ UI de Swap completa y funcional
✅ Cotización en tiempo real
✅ Aprobación automática de tokens
✅ Ejecución de swaps
✅ Manejo de errores y estados de carga

---

## Ventajas de TanStack Query en la Implementación

### Beneficios del Cache

La implementación con TanStack Query proporciona múltiples ventajas:

1. **Cache Automático de Datos**
   - Las cotizaciones (quotes) se cachean por 10 segundos, evitando llamadas redundantes
   - Los balances se mantienen en cache por 30 segundos
   - Reduce significativamente las llamadas a la blockchain

2. **Sincronización Inteligente**
   - Refetch automático de quotes cada 15 segundos para precios actualizados
   - Refetch de balances cada 30 segundos
   - Invalidación automática de cache después de swaps exitosos

3. **Estados de Loading Optimizados**
   - Estados separados para loading, error y success
   - Mejor UX con indicadores de carga precisos
   - Retry automático en caso de errores temporales

4. **Optimistic Updates**
   - Los balances se invalidan inmediatamente después de un swap
   - La UI se actualiza automáticamente con los nuevos datos

### Configuración del Cache

```typescript
// Configuración global en providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // Datos "frescos" por 5 minutos
      gcTime: 1000 * 60 * 10,         // Mantener en memoria 10 minutos
      refetchOnWindowFocus: false,    // No refetch al cambiar de ventana
      retry: 2,                       // Reintentar 2 veces en caso de error
    },
  },
});
```

### Configuraciones Personalizadas por Hook

- **useQuote**: `staleTime: 10s`, `refetchInterval: 15s` - Precios actualizados frecuentemente
- **useTokenBalance**: `staleTime: 30s`, `refetchInterval: 30s` - Balances menos volátiles
- **useSwap**: Mutation con invalidación automática de balances al completar

### Query Keys

Las query keys permiten identificar y gestionar el cache:

```typescript
// Quote: Único por par de tokens y cantidad
['quote', tokenIn?.evmAddress, tokenOut?.evmAddress, amountIn, feeAmount]

// Balance: Único por token y dirección
['tokenBalance', token?.evmAddress, address]
```

Esta estructura permite:
- Invalidación selectiva de datos
- Cache compartido entre componentes
- Deduplicación automática de peticiones

---

## Fase 6: Testing y Deployment

### Objetivo
Probar exhaustivamente la aplicación en testnet y prepararla para producción en mainnet.

### Checklist de Tareas

- [ ] **6.1** Testing en Testnet
  - [ ] Obtener HBAR de testnet desde faucet (https://portal.hedera.com/faucet)
  - [ ] Conectar wallet (HashPack en testnet)
  - [ ] Verificar que muestra balance correcto
  - [ ] Seleccionar par de tokens de prueba
  - [ ] Verificar que quote se actualiza correctamente
  - [ ] Probar swap pequeño (ej: 1 HBAR)
  - [ ] Verificar transacción en HashScan testnet
  - [ ] Probar swap con diferentes pares de tokens
  - [ ] Probar con diferentes fee tiers
  - [ ] Verificar manejo de errores (balance insuficiente, slippage, etc.)

- [ ] **6.2** Optimizaciones de Performance
  - [ ] ✅ Cache de quotes implementado con TanStack Query
  - [ ] ✅ Cache de balances con refetch automático
  - [ ] Optimizar re-renders con React.memo en componentes pesados
  - [ ] Añadir loading skeletons para mejor UX
  - [ ] ✅ Retry automático implementado en queries (2 reintentos)
  - [ ] Añadir notificaciones toast para feedback visual
  - [ ] Considerar implementar React Query Devtools en desarrollo:
    ```typescript
    import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

    // En providers.tsx, dentro del QueryClientProvider
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
    ```

- [ ] **6.3** Mejoras de Seguridad
  - [ ] Validar inputs de usuario
  - [ ] Implementar límites de slippage máximo
  - [ ] Añadir confirmación antes de ejecutar swaps grandes
  - [ ] Sanitizar datos de contratos
  - [ ] Implementar rate limiting si es necesario

- [ ] **6.4** Preparar para Mainnet
  - [ ] Actualizar direcciones de contratos a mainnet en `.env`
  - [ ] Actualizar lista de tokens a mainnet
  - [ ] Cambiar `NEXT_PUBLIC_HEDERA_NETWORK=mainnet`
  - [ ] Actualizar metadata (nombre, URL, iconos)
  - [ ] Probar build de producción: `npm run build`
  - [ ] Probar aplicación en modo producción: `npm start`

- [ ] **6.5** Deployment
  - [ ] Elegir plataforma (Vercel, Netlify, etc.)
  - [ ] Configurar variables de entorno en la plataforma
  - [ ] Hacer deploy inicial
  - [ ] Verificar que funciona en producción
  - [ ] Configurar dominio personalizado (opcional)

- [ ] **6.6** Monitoreo Post-Deployment
  - [ ] Monitorear transacciones en HashScan mainnet
  - [ ] Revisar logs de errores
  - [ ] Obtener feedback de usuarios beta
  - [ ] Iterar y mejorar según feedback

- [ ] **6.7** Documentación
  - [ ] Crear README.md con instrucciones de instalación
  - [ ] Documentar arquitectura del proyecto
  - [ ] Crear guía de usuario
  - [ ] Documentar troubleshooting común

### Resultado Esperado
✅ Aplicación probada exhaustivamente en testnet
✅ Deploy exitoso en mainnet
✅ Documentación completa
✅ Aplicación en producción funcional

---

## Recursos Adicionales

### Enlaces Importantes

- **Hedera**
  - Documentación: https://docs.hedera.com/
  - HashScan Explorer: https://hashscan.io/
  - Portal (Testnet Faucet): https://portal.hedera.com/

- **SaucerSwap**
  - Documentación: https://docs.saucerswap.finance/
  - GitHub: https://github.com/saucerswaplabs
  - App: https://app.saucerswap.finance/

- **Reown (WalletConnect)**
  - Documentación: https://docs.reown.com/
  - Dashboard: https://dashboard.reown.com/

- **Hedera Wallet Connect**
  - GitHub: https://github.com/hashgraph/hedera-wallet-connect
  - NPM: https://www.npmjs.com/package/@hashgraph/hedera-wallet-connect

- **HashPack Wallet**
  - Documentación: https://docs.hashpack.app/
  - Website: https://www.hashpack.app/

### Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción local
npm start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Troubleshooting Común

**Problema: "User rejected request"**
- Solución: Usuario canceló transacción en wallet. Reintentar.

**Problema: "Insufficient allowance"**
- Solución: Aprobar token antes de swap. El hook debería manejarlo automáticamente.

**Problema: "Transaction reverted"**
- Solución: Verificar slippage tolerance, pool liquidity, y que addresses sean correctos.

**Problema: "Network mismatch"**
- Solución: Asegurar que wallet esté en la red correcta (testnet/mainnet).

**Problema: Quote no se actualiza**
- Solución: Verificar que direcciones de contratos sean correctas y que haya liquidez en el pool.

**Problema: Datos en cache desactualizados**
- Solución: Ajustar `staleTime` en el hook correspondiente o forzar invalidación con:
  ```typescript
  queryClient.invalidateQueries({ queryKey: ['quote'] });
  ```

**Problema: Balance no se actualiza después de swap**
- Solución: El hook `useSwap` debería invalidar automáticamente. Verificar que `onSuccess` esté configurado correctamente.

**Problema: Demasiadas llamadas a la blockchain**
- Solución:
  - Aumentar `staleTime` para reducir frecuencia de refetch
  - Deshabilitar `refetchInterval` si no es necesario
  - Usar React Query Devtools para identificar queries problemáticas

---

## Uso Avanzado de TanStack Query

### Invalidación Manual del Cache

En algunos casos, puedes necesitar invalidar el cache manualmente:

```typescript
'use client';

import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleRefreshAll = () => {
    // Invalidar todos los balances
    queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });

    // Invalidar todas las quotes
    queryClient.invalidateQueries({ queryKey: ['quote'] });
  };

  const handleRefreshSpecificToken = (tokenAddress: string, userAddress: string) => {
    // Invalidar balance específico
    queryClient.invalidateQueries({
      queryKey: ['tokenBalance', tokenAddress, userAddress]
    });
  };

  return (
    <button onClick={handleRefreshAll}>
      Actualizar Datos
    </button>
  );
}
```

### Prefetching de Datos

Para mejorar la UX, puedes pre-cargar datos antes de que el usuario los necesite:

```typescript
'use client';

import { useQueryClient } from '@tanstack/react-query';

function TokenList() {
  const queryClient = useQueryClient();
  const tokens = getTokenList();

  const handleMouseEnter = async (token: HederaToken) => {
    // Pre-cargar balance cuando el usuario pasa el mouse
    await queryClient.prefetchQuery({
      queryKey: ['tokenBalance', token.evmAddress, address],
      queryFn: () => fetchTokenBalance(token),
      staleTime: 1000 * 30,
    });
  };

  return (
    <div>
      {tokens.map(token => (
        <div key={token.symbol} onMouseEnter={() => handleMouseEnter(token)}>
          {token.symbol}
        </div>
      ))}
    </div>
  );
}
```

### Optimistic Updates

Para una UX instantánea, actualiza la UI antes de que la transacción se confirme:

```typescript
const swapMutation = useMutation({
  mutationFn: executeSwapFn,
  onMutate: async (variables) => {
    // Cancelar refetches en progreso
    await queryClient.cancelQueries({
      queryKey: ['tokenBalance', variables.tokenIn.evmAddress]
    });

    // Snapshot del estado anterior
    const previousBalance = queryClient.getQueryData([
      'tokenBalance',
      variables.tokenIn.evmAddress,
      address
    ]);

    // Actualizar optimísticamente
    queryClient.setQueryData(
      ['tokenBalance', variables.tokenIn.evmAddress, address],
      (old: string) => {
        const oldBalance = BigInt(old || '0');
        const amountIn = BigInt(variables.amountIn);
        return (oldBalance - amountIn).toString();
      }
    );

    return { previousBalance };
  },
  onError: (err, variables, context) => {
    // Revertir en caso de error
    if (context?.previousBalance) {
      queryClient.setQueryData(
        ['tokenBalance', variables.tokenIn.evmAddress, address],
        context.previousBalance
      );
    }
  },
  onSettled: () => {
    // Refetch después de éxito o error
    queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
  },
});
```

### Configuración de Retry con Backoff Exponencial

```typescript
// En providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // No reintentar errores 4xx
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // Máximo 3 reintentos
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Backoff exponencial: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
  },
});
```

### Polling Condicional

Detener el polling cuando no es necesario:

```typescript
export function useQuote(
  tokenIn: HederaToken | null,
  tokenOut: HederaToken | null,
  amountIn: string,
  isSwapPanelOpen: boolean // Nueva prop
) {
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', tokenIn?.evmAddress, tokenOut?.evmAddress, amountIn],
    queryFn: fetchQuoteFn,
    enabled: !!tokenIn && !!tokenOut && !!amountIn && isSwapPanelOpen,
    refetchInterval: isSwapPanelOpen ? 1000 * 15 : false, // Solo refetch si el panel está abierto
  });

  return { quote, isLoading };
}
```

---

## Próximos Pasos (Futuras Mejoras)

1. **Gestión de Liquidez**
   - Añadir/remover liquidez a pools
   - Visualizar posiciones NFT de liquidez
   - Mostrar fees ganados

2. **Análisis y Estadísticas**
   - Gráficos de precio histórico
   - TVL y volumen de pools
   - APR de pools de liquidez

3. **Multi-hop Swaps**
   - Swaps a través de múltiples pools
   - Auto-routing para mejor precio

4. **Historial de Transacciones**
   - Mostrar swaps previos del usuario
   - Export a CSV

5. **Notificaciones**
   - Alertas de precio
   - Confirmaciones de transacción
   - Push notifications

---

**Creado**: 2025-11-04
**Última actualización**: 2025-11-04
**Versión**: 2.0 - TanStack Query Edition
**Autor**: Claude Code Assistant

### Changelog

**v2.0** (2025-11-04)
- ✨ Integración completa de TanStack Query para cache inteligente
- ✨ Hooks optimizados con useQuery y useMutation
- ✨ Configuración de cache personalizada por tipo de dato
- ✨ Invalidación automática de cache después de transacciones
- ✨ Sección de uso avanzado con ejemplos de prefetching y optimistic updates
- ✨ React Query DevTools integrado para desarrollo
- 📝 Documentación extendida sobre configuración de cache y troubleshooting

**v1.0** (2025-11-04)
- 🎉 Release inicial con integración básica de Reown AppKit y SaucerSwap V2
