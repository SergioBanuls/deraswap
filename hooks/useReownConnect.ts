'use client';

import { useState, useCallback } from 'react';
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod } from '@hashgraph/hedera-wallet-connect/dist/lib';
import { LedgerId } from '@hashgraph/sdk';

// Obtener el Project ID de las variables de entorno
const PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';
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

let dAppConnector: DAppConnector | null = null;

export function useReownConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inicializa DAppConnector de Hedera con Reown
  const initializeDAppConnector = useCallback(() => {
    if (dAppConnector || typeof window === 'undefined') return dAppConnector;
    
    try {
      dAppConnector = new DAppConnector(
        APP_METADATA,
        LedgerId.TESTNET, // o LedgerId.MAINNET
        PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Testnet]
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

      // Inicializar sesión
      await connector.init({ logger: 'error' });

      // Abrir modal de conexión
      await connector.openModal();

      // Esperar a que se complete la conexión
      const session = connector.signers[0];
      
      if (session) {
        const accountId = session.getAccountId();
        setAccount(accountId.toString());
        setIsConnected(true);
      }

    } catch (error) {
      console.error('Error de conexión con Reown AppKit:', error);
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
    if (!dAppConnector || !isConnected) {
      throw new Error("No estás conectado a Reown AppKit.");
    }
    
    const signer = dAppConnector.signers[0];
    if (!signer) {
      throw new Error("No hay signer disponible");
    }

    // Ejecutar método según el tipo
    if (method === 'hedera_signAndExecuteTransaction') {
      // Aquí deberías construir la transacción usando el SDK de Hedera
      // y luego ejecutarla con el signer
      const result = await signer.call(params.transaction);
      return result;
    }

    throw new Error(`Método ${method} no soportado`);
  }, [isConnected]);

  return { connect, disconnect, callNativeMethod, isConnected, account, loading };
}
