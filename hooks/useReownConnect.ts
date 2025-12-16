'use client'

import { useReownContext } from '@/contexts/ReownContext'

/**
 * Hook simplificado que usa el contexto de Reown
 * Mantiene la misma interfaz para compatibilidad con componentes existentes
 */
export function useReownConnect() {
    const context = useReownContext()

    return {
        connect: context.connect,
        connectWithWallet: context.connectWithWallet,
        disconnect: context.disconnect,
        callNativeMethod: context.callNativeMethod,
        executeTransactionWithSigner: context.executeTransactionWithSigner,
        isConnected: context.isConnected,
        account: context.account,
        loading: context.loading,
        walletType: context.walletType,
        signer: context.signer,
    }
}
