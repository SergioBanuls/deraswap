/**
 * Header Component
 *
 * Top navigation bar with logo, network switcher, and wallet info.
 */

'use client';

import { WalletInfo } from './WalletInfo';
import { NetworkSwitcher } from './NetworkSwitcher';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              DeraSwap
            </div>
          </div>

          {/* Network Switcher & Wallet Info */}
          <div className="flex items-center gap-4">
            <NetworkSwitcher />
            <WalletInfo />
          </div>
        </div>
      </div>
    </header>
  );
}
