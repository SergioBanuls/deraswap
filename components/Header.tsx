/**
 * Header Component
 *
 * Top navigation bar with logo, network switcher, and wallet info.
 */

'use client';

import { WalletInfo } from './WalletInfo';
import { NetworkSwitcher } from './NetworkSwitcher';
import Image from 'next/image';
import { useReownConnect } from '@/hooks/useReownConnect';

export function Header() {
  const { connect, disconnect, isConnected, account, loading } = useReownConnect();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatAccount = (acc: string) => {
    return `${acc.slice(0, 6)}...${acc.slice(-4)}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 ">
      <div className="mx-auto py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div>
            <Image
              src="/DERASWAP.png"
              alt="DeraSwap"
              width={200}
              height={60}
              priority
            />
          </div>

          {/* Network Switcher & Wallet Info */}
          <div className="flex items-center gap-4">
            <NetworkSwitcher />
            <WalletInfo />
          </div>
          {/* Connect Wallet Button */}
          <button
            onClick={handleClick}
            disabled={loading}
            className="px-6 py-2 from-p bg-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 text-white"
          >
            {loading ? 'Connecting...' : isConnected && account ? formatAccount(account) : 'Connect Wallet'}
          </button>
        </div >
      </div >
    </header >
  );
}
