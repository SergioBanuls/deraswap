'use client';

import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';

interface WalletOption {
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  note?: string;
}

const HEDERA_WALLETS: WalletOption[] = [
  {
    name: 'HashPack',
    icon: '🔷',
    description: 'The most popular Hedera wallet',
    downloadUrl: 'https://www.hashpack.app/',
    note: 'Extensión para navegador',
  },
  {
    name: 'Blade',
    icon: '⚔️',
    description: 'Secure Hedera wallet',
    downloadUrl: 'https://bladewallet.io/',
    note: 'Extensión para navegador',
  },
  {
    name: 'Kabila',
    icon: '🟣',
    description: 'Mobile-first Hedera wallet',
    downloadUrl: 'https://www.kabila.app/',
    note: 'Principalmente móvil',
  },
];

interface HederaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HederaWalletModal({ isOpen, onClose }: HederaWalletModalProps) {
  const { open: openWalletConnect } = useAppKit();

  if (!isOpen) return null;

  const checkWalletInstalled = (walletName: string): boolean => {
    if (typeof window === 'undefined') return false;

    // Verificar en window directamente
    if (walletName === 'HashPack') {
      // HashPack puede inyectarse como window.hashpack o en ethereum.providers
      if ((window as any).hashpack) return true;
      if ((window as any).hashconnect) return true;
      if (window.ethereum && (window.ethereum as any).isHashPack) return true;

      // Verificar en providers array
      if (window.ethereum && (window.ethereum as any).providers) {
        const providers = (window.ethereum as any).providers;
        if (Array.isArray(providers)) {
          return providers.some((p: any) => p.isHashPack);
        }
      }
    }

    if (walletName === 'Blade') {
      if ((window as any).blade) return true;
      if ((window as any).bladewallet) return true;
      if (window.ethereum && (window.ethereum as any).isBlade) return true;

      if (window.ethereum && (window.ethereum as any).providers) {
        const providers = (window.ethereum as any).providers;
        if (Array.isArray(providers)) {
          return providers.some((p: any) => p.isBlade);
        }
      }
    }

    if (walletName === 'Kabila') {
      if ((window as any).kabila) return true;
    }

    return false;
  };

  const handleWalletClick = async (wallet: WalletOption) => {
    if (typeof window === 'undefined') return;

    // Siempre abrir WalletConnect - tiene mejor detección de wallets
    // El modal mostrará todas las wallets disponibles incluyendo las instaladas
    openWalletConnect();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Connect Wallet
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Hedera Wallets */}
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Choose your Hedera wallet:
            </p>

            {HEDERA_WALLETS.map((wallet) => {
              const isInstalled = checkWalletInstalled(wallet.name);
              return (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletClick(wallet)}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all group ${
                    isInstalled
                      ? 'border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <div className="text-4xl">{wallet.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {wallet.name}
                      </span>
                      {isInstalled && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                          Instalada
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {wallet.description}
                    </div>
                    {wallet.note && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {wallet.note}
                      </div>
                    )}
                  </div>
                  <div className={`transition-colors ${
                    isInstalled
                      ? 'text-green-500 group-hover:text-green-600'
                      : 'text-gray-400 group-hover:text-blue-500'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                or
              </span>
            </div>
          </div>

          {/* Other Wallets */}
          <button
            onClick={() => {
              openWalletConnect();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.913 7.519c3.915-3.83 10.26-3.83 14.174 0l.471.461a.483.483 0 0 1 0 .694l-1.611 1.577a.252.252 0 0 1-.354 0l-.649-.634c-2.73-2.671-7.155-2.671-9.885 0l-.694.68a.252.252 0 0 1-.354 0L4.4 8.72a.483.483 0 0 1 0-.694l.513-.507zm17.506 3.263l1.434 1.404a.483.483 0 0 1 0 .694l-6.466 6.331a.505.505 0 0 1-.708 0l-4.588-4.49a.126.126 0 0 0-.177 0l-4.589 4.49a.505.505 0 0 1-.708 0l-6.466-6.331a.483.483 0 0 1 0-.694l1.434-1.404a.505.505 0 0 1 .708 0l4.589 4.49a.126.126 0 0 0 .177 0l4.588-4.49a.505.505 0 0 1 .708 0l4.589 4.49a.126.126 0 0 0 .177 0l4.588-4.49a.505.505 0 0 1 .708 0z"/>
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Other Wallets (WalletConnect)
            </span>
          </button>

          {/* Info */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Don't have a wallet?{' '}
              <a
                href="https://www.hashpack.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Get HashPack
              </a>
            </p>
            <details className="text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 text-center">
                Wallet no detectada?
              </summary>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left space-y-2">
                <p>Si tu wallet está instalada pero no se detecta:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Asegúrate de que la extensión esté activa</li>
                  <li>Recarga la página (Cmd+Shift+R / Ctrl+Shift+R)</li>
                  <li>Haz clic en "Other Wallets" y búscala allí</li>
                  <li>Consulta DEBUG_WALLETS.md para más ayuda</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}
