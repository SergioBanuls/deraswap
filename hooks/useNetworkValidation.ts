/**
 * Hook for validating network connection
 *
 * Checks if the user is connected to the expected network (testnet/mainnet).
 * Provides warning state when network mismatch is detected.
 *
 * @returns {Object} - networkMismatch boolean and expected network name
 */

'use client';

import { useState, useEffect } from 'react';
import { LedgerId } from '@hashgraph/sdk';
import { useReownContext } from '@/contexts/ReownProvider';

export function useNetworkValidation() {
  const { dAppConnector, isConnected } = useReownContext();
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const expectedNetwork = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';

  useEffect(() => {
    if (!isConnected || !dAppConnector) {
      setNetworkMismatch(false);
      return;
    }

    const checkNetwork = async () => {
      try {
        const session = dAppConnector.signers[0];
        if (!session) return;

        // Check if the connected network matches expected network
        const connectedLedgerId = dAppConnector.network;

        const expectedLedgerId =
          expectedNetwork === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;

        // Compare ledger IDs
        const isCorrectNetwork = connectedLedgerId.toString() === expectedLedgerId.toString();

        setNetworkMismatch(!isCorrectNetwork);

        if (!isCorrectNetwork) {
          console.warn(
            `Network mismatch: Connected to ${connectedLedgerId.toString()}, expected ${expectedLedgerId.toString()}`
          );
        }
      } catch (err) {
        console.error('Network check failed:', err);
        // Don't show mismatch warning on error, to avoid false positives
        setNetworkMismatch(false);
      }
    };

    checkNetwork();

    // Note: Hedera Wallet Connect may emit network change events
    // Add event listener here if supported in future versions
  }, [isConnected, dAppConnector, expectedNetwork]);

  return {
    networkMismatch,
    expectedNetwork,
    connectedNetwork: networkMismatch
      ? expectedNetwork === 'testnet'
        ? 'mainnet'
        : 'testnet'
      : expectedNetwork,
  };
}
