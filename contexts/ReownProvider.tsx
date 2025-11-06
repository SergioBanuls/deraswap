'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod } from '@hashgraph/hedera-wallet-connect/dist/lib';
import { LedgerId } from '@hashgraph/sdk';

// Obtener el Project ID y la red de las variables de entorno
const PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const APP_METADATA = {
  name: 'DeraSwap - Hedera dApp',
  description: 'Una dApp de Hedera que usa HTS con Reown AppKit.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : 'https://localhost:3000/icon.png'],
};

// Enum para los Chain IDs de Hedera
enum HederaChainId {
  Testnet = 'hedera:testnet',
  Mainnet = 'hedera:mainnet'
}

// Determinar la red y el chain ID según la variable de entorno
const getLedgerId = () => HEDERA_NETWORK === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
const getChainId = () => HEDERA_NETWORK === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

interface ReownContextType {
  isConnected: boolean;
  account: string | null;
  loading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  callNativeMethod: (method: string, params: any) => Promise<any>;
  dAppConnector: DAppConnector | null;
}

const ReownContext = createContext<ReownContextType | undefined>(undefined);

let dAppConnector: DAppConnector | null = null;

export function ReownProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inicializa DAppConnector de Hedera con Reown
  const initializeDAppConnector = useCallback(() => {
    if (dAppConnector || typeof window === 'undefined') return dAppConnector;
    
    try {
      const ledgerId = getLedgerId();
      const chainId = getChainId();
      
      console.log(`🌐 Inicializando DAppConnector para ${HEDERA_NETWORK} (${chainId})`);
      
      dAppConnector = new DAppConnector(
        APP_METADATA,
        ledgerId,
        PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [chainId]
      );

      return dAppConnector;
    } catch (error) {
      console.error('Error inicializando DAppConnector:', error);
      return null;
    }
  }, []);

  // Función para iniciar la conexión
  const connect = useCallback(async () => {
    setLoading(true);
    
    try {
      const connector = initializeDAppConnector();
      if (!connector) {
        throw new Error('No se pudo inicializar el conector');
      }

      console.log('🔌 Iniciando conexión con DAppConnector...');

      // Inicializar sesión
      await connector.init({ logger: 'error' });
      console.log('✅ DAppConnector inicializado');

      // Abrir modal de conexión
      console.log('🔓 Abriendo modal de conexión...');
      await connector.openModal();
      console.log('✅ Modal abierto, esperando selección de wallet...');

      // Esperar a que se complete la conexión
      const session = connector.signers[0];
      console.log('📝 Signers encontrados:', connector.signers.length);
      
      if (session) {
        const accountId = session.getAccountId();
        console.log('✅ Cuenta conectada:', accountId.toString());
        setAccount(accountId.toString());
        setIsConnected(true);
      } else {
        console.warn('⚠️ No se encontró ninguna sesión/signer después de la conexión');
      }

    } catch (error) {
      console.error('❌ Error de conexión con Reown AppKit:', error);
      alert('Error al conectar: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [initializeDAppConnector]);

  // Función para desconectar
  const disconnect = useCallback(async () => {
    if (dAppConnector) {
      await dAppConnector.disconnectAll();
      setIsConnected(false);
      setAccount(null);
    }
  }, []);

  // Función para realizar llamadas nativas (ej. hedera_signAndExecuteTransaction)
  const callNativeMethod = useCallback(async (method: string, params: any) => {
    if (!dAppConnector || !isConnected || !account) {
      throw new Error("No estás conectado a Reown AppKit.");
    }
    
    const signer = dAppConnector.signers[0];
    if (!signer) {
      throw new Error("No hay signer disponible");
    }

    console.log('📡 Llamando método:', method);
    console.log('📦 Parámetros:', params);

    // Ejecutar método según el tipo
    if (method === 'hedera_signAndExecuteTransaction') {
      // Usar el método correcto de DAppConnector
      const result = await dAppConnector.signAndExecuteTransaction({
        signerAccountId: account,
        transactionList: params.transaction
      });
      
      console.log('✅ Resultado de transacción:', result);
      return result;
    }

    throw new Error(`Método ${method} no soportado`);
  }, [isConnected, account]);

  const value: ReownContextType = {
    isConnected,
    account,
    loading,
    connect,
    disconnect,
    callNativeMethod,
    dAppConnector,
  };

  return (
    <ReownContext.Provider value={value}>
      {children}
    </ReownContext.Provider>
  );
}

export function useReownContext() {
  const context = useContext(ReownContext);
  if (context === undefined) {
    throw new Error('useReownContext must be used within a ReownProvider');
  }
  return context;
}
