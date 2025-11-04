'use client';

import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';

interface WalletOption {
  name: string;
  icon: string;
  description: string;
  deepLink: string;
  downloadUrl: string;
}

const HEDERA_WALLETS: WalletOption[] = [
  {
    name: 'HashPack',
    icon: '🔷',
    description: 'The most popular Hedera wallet',
    deepLink: 'hashpack://',
    downloadUrl: 'https://www.hashpack.app/',
  },
  {
    name: 'Kabila',
    icon: '🟣',
    description: 'Mobile-first Hedera wallet',
    deepLink: 'kabila://',
    downloadUrl: 'https://www.kabila.app/',
  },
  {
    name: 'Blade',
    icon: '⚔️',
    description: 'Secure Hedera wallet',
    deepLink: 'blade://',
    downloadUrl: 'https://bladewallet.io/',
  },
];

interface HederaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HederaWalletModal({ isOpen, onClose }: HederaWalletModalProps) {
  const { open: openWalletConnect } = useAppKit();

  if (!isOpen) return null;

  const handleWalletClick = (wallet: WalletOption) => {
    // Intentar abrir la wallet directamente
    if (typeof window !== 'undefined') {
      // Verificar si la wallet está instalada
      const isInstalled = checkWalletInstalled(wallet.name);

      if (isInstalled) {
        // Si está instalada, abrir WalletConnect que la detectará
        openWalletConnect();
        onClose();
      } else {
        // Si no está instalada, mostrar opción de descarga
        if (confirm(`${wallet.name} no está instalada. ¿Deseas descargarla ahora?`)) {
          window.open(wallet.downloadUrl, '_blank');
        }
      }
    }
  };

  const checkWalletInstalled = (walletName: string): boolean => {
    if (typeof window === 'undefined') return false;

    // Verificar si la extensión está instalada
    switch (walletName) {
      case 'HashPack':
        return !!(window as any).hashpack;
      case 'Kabila':
        return !!(window as any).kabila;
      case 'Blade':
        return !!(window as any).blade;
      default:
        return false;
    }
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

            {HEDERA_WALLETS.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleWalletClick(wallet)}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="text-4xl">{wallet.icon}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {wallet.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {wallet.description}
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
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
          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
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
        </div>
      </div>
    </>
  );
}
