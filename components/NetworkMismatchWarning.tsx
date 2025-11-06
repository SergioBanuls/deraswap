/**
 * Network Mismatch Warning Component
 *
 * Displays a prominent warning banner when the user is connected
 * to the wrong network (e.g., mainnet when app expects testnet).
 */

'use client';

import { useNetworkValidation } from '@/hooks/useNetworkValidation';

export function NetworkMismatchWarning() {
  const { networkMismatch, expectedNetwork, connectedNetwork } =
    useNetworkValidation();

  if (!networkMismatch) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          {/* Warning Icon */}
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          {/* Warning Text */}
          <div className="flex-1">
            <p className="font-bold text-sm md:text-base">Wrong Network</p>
            <p className="text-xs md:text-sm opacity-90">
              You are connected to <span className="font-semibold">{connectedNetwork}</span>.
              Please switch to <span className="font-semibold">{expectedNetwork}</span> in your wallet.
            </p>
          </div>
        </div>

        {/* Close button (optional) */}
        <button
          onClick={() => {
            // Could add dismiss functionality if needed
            console.log('Network warning acknowledged');
          }}
          className="ml-4 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss warning"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
