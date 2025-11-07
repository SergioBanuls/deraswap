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
  executeTransactionWithSigner: (transaction: any) => Promise<any>;
  dAppConnector: DAppConnector | null;
  signer: any | null; // DAppSigner from hedera-wallet-connect
}

const ReownContext = createContext<ReownContextType | undefined>(undefined);

let dAppConnector: DAppConnector | null = null;

export function ReownProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [signer, setSigner] = useState<any | null>(null);

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
        setSigner(session); // Store signer for use in transactions
        setIsConnected(true);

        // Guardar sesión en localStorage para persistencia
        localStorage.setItem('hedera_wallet_connected', 'true');
        localStorage.setItem('hedera_account_id', accountId.toString());
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
      setSigner(null);

      // Limpiar localStorage
      localStorage.removeItem('hedera_wallet_connected');
      localStorage.removeItem('hedera_account_id');
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
      // Convertir Uint8Array a base64 si es necesario
      let transactionBytes = params.transaction;
      let transactionBase64: string;

      if (transactionBytes instanceof Uint8Array) {
        // Convertir Uint8Array a base64 usando btoa
        const binary = Array.from(transactionBytes)
          .map(byte => String.fromCharCode(byte))
          .join('');
        transactionBase64 = btoa(binary);
        console.log('🔄 Convertido Uint8Array a base64');
      } else {
        transactionBase64 = transactionBytes;
      }

      console.log('📝 Transaction base64 (primeros 100 chars):',
        transactionBase64.substring(0, 100)
      );

      // Usar el método correcto de DAppConnector
      // El parámetro es "transactionList" como un string base64
      const result = await dAppConnector.signAndExecuteTransaction({
        signerAccountId: account,
        transactionList: transactionBase64
      });

      console.log('✅ Resultado de transacción:', result);
      return result;
    }

    throw new Error(`Método ${method} no soportado`);
  }, [isConnected, account]);

  /**
   * Execute a transaction using DAppSigner's executeWithSigner
   *
   * This is the CORRECT way to execute HBAR swaps, as it properly
   * serializes the payableAmount field.
   *
   * @param transaction - Frozen transaction (from freezeWithSigner)
   * @returns Transaction result with transactionId
   */
  const executeTransactionWithSigner = useCallback(async (transaction: any) => {
    if (!signer) {
      throw new Error("No signer available. Please connect your wallet first.");
    }

    console.log('🚀 Executing transaction with signer...');

    try {
      // Execute transaction using DAppSigner
      const result = await transaction.executeWithSigner(signer);

      console.log('✅ Transaction executed:', result);

      // Return result with transactionId
      return {
        transactionId: result.transactionId.toString(),
        success: true
      };
    } catch (error) {
      console.error('❌ Error executing transaction with signer:', error);
      throw error;
    }
  }, [signer]);

  // Restaurar sesión al cargar la página
  useEffect(() => {
    const restoreSession = async () => {
      if (isInitialized) return; // Ya inicializado

      const wasConnected = localStorage.getItem('hedera_wallet_connected');
      const savedAccount = localStorage.getItem('hedera_account_id');

      if (wasConnected === 'true' && savedAccount) {
        console.log('🔄 Restaurando sesión guardada...');
        setLoading(true);

        try {
          const connector = initializeDAppConnector();
          if (!connector) {
            throw new Error('No se pudo inicializar el conector');
          }

          // Inicializar sin abrir modal
          await connector.init({ logger: 'error' });

          // Verificar si hay sesión activa
          const session = connector.signers[0];

          if (session) {
            const accountId = session.getAccountId();
            console.log('✅ Sesión restaurada:', accountId.toString());
            setAccount(accountId.toString());
            setSigner(session); // Restore signer
            setIsConnected(true);
          } else {
            console.log('⚠️ No hay sesión activa, limpiando localStorage');
            localStorage.removeItem('hedera_wallet_connected');
            localStorage.removeItem('hedera_account_id');
          }
        } catch (error) {
          console.error('❌ Error al restaurar sesión:', error);
          localStorage.removeItem('hedera_wallet_connected');
          localStorage.removeItem('hedera_account_id');
        } finally {
          setLoading(false);
          setIsInitialized(true);
        }
      } else {
        setIsInitialized(true);
      }
    };

    restoreSession();
  }, [initializeDAppConnector, isInitialized]);

  const value: ReownContextType = {
    isConnected,
    account,
    loading,
    connect,
    disconnect,
    callNativeMethod,
    executeTransactionWithSigner,
    dAppConnector,
    signer,
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
