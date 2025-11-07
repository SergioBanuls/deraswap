/**
 * Network Switcher Component
 * 
 * Allows switching between testnet and mainnet
 */

'use client';

import { useState, useEffect } from 'react';

export function NetworkSwitcher() {
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');

  useEffect(() => {
    // Load network from localStorage
    const saved = localStorage.getItem('hedera_network');
    if (saved === 'mainnet' || saved === 'testnet') {
      setNetwork(saved);
    }
  }, []);

  const switchNetwork = (newNetwork: 'testnet' | 'mainnet') => {
    setNetwork(newNetwork);
    localStorage.setItem('hedera_network', newNetwork);
    
    // Reload page to apply network change
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Network:
      </span>
      <button
        onClick={() => switchNetwork('testnet')}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          network === 'testnet'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        Testnet
      </button>
      <button
        onClick={() => switchNetwork('mainnet')}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          network === 'mainnet'
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        Mainnet
      </button>
      {network === 'testnet' && (
        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
          (Custom Contract)
        </span>
      )}
      {network === 'mainnet' && (
        <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
          (ETASwap)
        </span>
      )}
    </div>
  );
}
