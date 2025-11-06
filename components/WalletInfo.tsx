/**
 * Wallet Info Component
 *
 * Displays the connected wallet address and disconnect button.
 */

'use client';

import { useReownConnect } from '@/hooks/useReownConnect';

export function WalletInfo() {
  const { account, disconnect, loading } = useReownConnect();

  if (!account) {
    return null;
  }

  // Truncate account ID for display (e.g., 0.0.1234567 -> 0.0...4567)
  const truncateAccount = (acc: string) => {
    const parts = acc.split('.');
    if (parts.length === 3 && parts[2].length > 6) {
      return `${parts[0]}.${parts[1]}...${parts[2].slice(-4)}`;
    }
    return acc;
  };

  return (
    <div className="flex items-center gap-3 bg-neutral-900 rounded-xl px-4 py-2 border border-neutral-800">
      {/* Account Info */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-mono text-white/90">
          {truncateAccount(account)}
        </span>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnect}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Disconnecting...' : 'Disconnect'}
      </button>
    </div>
  );
}
