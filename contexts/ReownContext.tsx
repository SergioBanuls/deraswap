'use client'

import { createContext, useContext } from 'react'

export type WalletType = 'hashpack' | 'kabila' | 'walletconnect'

export interface ReownContextType {
    isConnected: boolean
    account: string | null
    loading: boolean
    walletType: WalletType | null
    connect: () => Promise<void>
    connectWithWallet: (walletType: WalletType) => Promise<void>
    disconnect: () => Promise<void>
    callNativeMethod: (method: string, params: any) => Promise<any>
    executeTransactionWithSigner: (transaction: any) => Promise<any>
    dAppConnector: any | null
    signer: any | null
}

export const ReownContext = createContext<ReownContextType | undefined>(
    undefined
)

export function useReownContext() {
    const context = useContext(ReownContext)
    if (context === undefined) {
        throw new Error('useReownContext must be used within a ReownProvider')
    }
    return context
}
