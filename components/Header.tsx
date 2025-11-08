/**
 * Header Component
 *
 * Top navigation bar with logo, network switcher, and wallet info.
 */

'use client';

import { NetworkSwitcher } from './NetworkSwitcher';
import Image from 'next/image';
import { useReownConnect } from '@/hooks/useReownConnect';
import { SessionActionButtons } from './SessionActionButtons';

export function Header() {

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
          </div>
          {/* Connect Wallet Button */}
          <SessionActionButtons />

        </div >
      </div >
    </header >
  );
}
