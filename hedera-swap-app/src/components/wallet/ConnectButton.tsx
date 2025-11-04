'use client';

import { useState } from 'react';
import { useDisconnect } from 'wagmi';
import { HederaWalletModal } from './HederaWalletModal';
import { useHederaWallet } from '@/hooks/useHederaWallet';

export function ConnectButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, walletInfo, formatAddress } = useHederaWallet();
  const { disconnect } = useDisconnect();

  if (isConnected && walletInfo) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-medium">{walletInfo.walletType}</span>
            {walletInfo.isInstalled && (
              <span className="text-green-500 text-xs">●</span>
            )}
          </div>
          <div className="font-mono">
            {formatAddress(walletInfo.evmAddress, 'auto')}
          </div>
          {walletInfo.hederaAddress && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {walletInfo.hederaAddress}
            </div>
          )}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-lg hover:shadow-xl"
      >
        Connect Wallet
      </button>

      <HederaWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
