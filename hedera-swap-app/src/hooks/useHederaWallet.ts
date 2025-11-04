'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { evmToHedera, hederaToEvm } from '@/lib/utils/addressConverter';

/**
 * Tipos de wallets de Hedera soportadas
 */
export type HederaWalletType = 'HashPack' | 'Kabila' | 'Blade' | 'Other';

/**
 * Información extendida de la wallet conectada
 */
export interface HederaWalletInfo {
  evmAddress: `0x${string}`;
  hederaAddress: string | null;
  walletType: HederaWalletType;
  isInstalled: boolean;
  chainId: number | undefined;
}

/**
 * Hook personalizado para trabajar con wallets de Hedera
 *
 * Proporciona funcionalidad específica de Hedera más allá de lo que wagmi ofrece:
 * - Detección del tipo de wallet (HashPack, Kabila, Blade)
 * - Conversión automática entre formatos de dirección (EVM ↔ Hedera)
 * - Verificación de instalación de wallets
 * - Información extendida de la cuenta
 *
 * @returns {Object} Información y utilidades de la wallet Hedera
 *
 * @example
 * ```tsx
 * const { walletInfo, isHederaWallet, switchToTestnet } = useHederaWallet();
 *
 * if (walletInfo) {
 *   console.log('EVM Address:', walletInfo.evmAddress);
 *   console.log('Hedera Address:', walletInfo.hederaAddress);
 *   console.log('Wallet Type:', walletInfo.walletType);
 * }
 * ```
 */
export function useHederaWallet() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();

  /**
   * Detecta qué tipo de wallet de Hedera está conectada
   */
  const detectWalletType = (): HederaWalletType => {
    if (typeof window === 'undefined') return 'Other';

    if ((window as any).hashpack) return 'HashPack';
    if ((window as any).kabila) return 'Kabila';
    if ((window as any).blade) return 'Blade';

    return 'Other';
  };

  /**
   * Verifica si una wallet específica está instalada
   */
  const isWalletInstalled = (walletType: HederaWalletType): boolean => {
    if (typeof window === 'undefined') return false;

    switch (walletType) {
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

  /**
   * Query para obtener información extendida de la wallet
   */
  const { data: walletInfo } = useQuery<HederaWalletInfo | null>({
    queryKey: ['hederaWallet', address, chainId],
    queryFn: async (): Promise<HederaWalletInfo | null> => {
      if (!address || !isConnected) return null;

      const walletType = detectWalletType();
      const hederaAddress = evmToHedera(address);

      return {
        evmAddress: address,
        hederaAddress,
        walletType,
        isInstalled: isWalletInstalled(walletType),
        chainId,
      };
    },
    enabled: isConnected && !!address,
    staleTime: Infinity, // La información de la wallet no cambia durante la sesión
    gcTime: Infinity,
  });

  /**
   * Verifica si la wallet conectada es específica de Hedera
   */
  const isHederaWallet = walletInfo
    ? walletInfo.walletType !== 'Other'
    : false;

  /**
   * Verifica si estamos en Hedera Testnet (chainId 296)
   */
  const isTestnet = chainId === 296;

  /**
   * Verifica si estamos en Hedera Mainnet (chainId 295)
   */
  const isMainnet = chainId === 295;

  /**
   * Formatea la dirección para mostrar (versión corta)
   */
  const formatAddress = (addr?: `0x${string}`, format: 'evm' | 'hedera' | 'auto' = 'auto'): string => {
    const targetAddress = addr || address;
    if (!targetAddress) return '';

    if (format === 'hedera' || (format === 'auto' && isHederaWallet)) {
      const hederaAddr = evmToHedera(targetAddress);
      if (hederaAddr) {
        // Formato: 0.0.xxxxx -> 0.0...xxxxx (últimos 5 dígitos)
        const parts = hederaAddr.split('.');
        if (parts.length === 3) {
          return `0.0...${parts[2].slice(-5)}`;
        }
      }
    }

    // Formato EVM por defecto: 0x1234...5678
    return `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;
  };

  /**
   * Convierte una dirección al formato preferido según la wallet
   */
  const toPreferredFormat = (addr: `0x${string}`): string => {
    if (isHederaWallet) {
      return evmToHedera(addr) || addr;
    }
    return addr;
  };

  /**
   * Solicita cambio a Hedera Testnet
   */
  const switchToTestnet = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x128' }], // 296 en hexadecimal
      });
      return true;
    } catch (error) {
      console.error('Error switching to testnet:', error);
      return false;
    }
  };

  /**
   * Solicita cambio a Hedera Mainnet
   */
  const switchToMainnet = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x127' }], // 295 en hexadecimal
      });
      return true;
    } catch (error) {
      console.error('Error switching to mainnet:', error);
      return false;
    }
  };

  return {
    // Información de la wallet
    walletInfo,
    address,
    isConnected,
    chainId,

    // Helpers de red
    isTestnet,
    isMainnet,
    isHederaWallet,

    // Utilidades de formato
    formatAddress,
    toPreferredFormat,

    // Utilidades de detección
    detectWalletType,
    isWalletInstalled,

    // Cambio de red
    switchToTestnet,
    switchToMainnet,

    // Cliente público para llamadas directas
    publicClient,
  };
}
