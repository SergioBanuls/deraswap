import { ConnectButton } from '@/components/wallet/ConnectButton';
import { SwapWidget } from '@/components/swap/SwapWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hedera Swap</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Powered by SaucerSwap V2 & TanStack Query
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Swap Widget */}
        <div className="flex justify-center">
          <SwapWidget />
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Network: <span className="font-semibold">{process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'}</span>
          </p>
          <p className="mt-2">
            ⚡ Cache optimizado con TanStack Query para máxima eficiencia
          </p>
        </div>
      </div>
    </main>
  );
}
