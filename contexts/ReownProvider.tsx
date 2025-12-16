'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
    DAppConnector,
    HederaSessionEvent,
    HederaJsonRpcMethod,
} from '@hashgraph/hedera-wallet-connect/dist/lib'
import { LedgerId } from '@hashgraph/sdk'
import { ReownContext, ReownContextType, WalletType } from './ReownContext'

export type { WalletType } from './ReownContext'

// Obtener el Project ID y la red de las variables de entorno
const PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'
const APP_METADATA = {
    name: 'DeraSwap - Hedera dApp',
    description: 'Una dApp de Hedera que usa HTS con Reown AppKit.',
    url:
        typeof window !== 'undefined'
            ? window.location.origin
            : 'https://localhost:3000',
    icons: [
        typeof window !== 'undefined'
            ? `${window.location.origin}/icon.png`
            : 'https://localhost:3000/icon.png',
    ],
}

// Enum para los Chain IDs de Hedera
enum HederaChainId {
    Testnet = 'hedera:testnet',
    Mainnet = 'hedera:mainnet',
}

// Determinar la red y el chain ID según la variable de entorno
const getLedgerId = () =>
    HEDERA_NETWORK === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET
const getChainId = () =>
    HEDERA_NETWORK === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet

let dAppConnector: DAppConnector | null = null

export function ReownProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false)
    const [account, setAccount] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [signer, setSigner] = useState<any | null>(null)
    const [walletType, setWalletType] = useState<WalletType | null>(null)

    // Inicializa DAppConnector de Hedera con Reown
    const initializeDAppConnector = useCallback(() => {
        if (dAppConnector || typeof window === 'undefined') return dAppConnector

        try {
            const ledgerId = getLedgerId()
            const chainId = getChainId()

            console.log(
                `🌐 Inicializando DAppConnector para ${HEDERA_NETWORK} (${chainId})`
            )

            dAppConnector = new DAppConnector(
                APP_METADATA,
                ledgerId,
                PROJECT_ID,
                Object.values(HederaJsonRpcMethod),
                [
                    HederaSessionEvent.ChainChanged,
                    HederaSessionEvent.AccountsChanged,
                ],
                [chainId]
            )

            return dAppConnector
        } catch (error) {
            console.error('Error inicializando DAppConnector:', error)
            return null
        }
    }, [])

    // Función para conectar usando el modal por defecto de WalletConnect
    const connect = useCallback(async () => {
        setLoading(true)

        try {
            const connector = initializeDAppConnector()
            if (!connector) {
                throw new Error('No se pudo inicializar el conector')
            }

            // Inicializar el conector
            await connector.init({ logger: 'error' })
            console.log('✅ DAppConnector inicializado')

            // Abrir el modal por defecto de WalletConnect que incluye HashPack, Kabila, etc.
            console.log(
                '🔌 Abriendo modal de WalletConnect con wallets de Hedera...'
            )
            await connector.openModal()

            // Esperar a que se complete la conexión
            const session = connector.signers[0]
            console.log('📝 Signers encontrados:', connector.signers.length)

            if (session) {
                const accountId = session.getAccountId()
                console.log('✅ Cuenta conectada:', accountId.toString())

                // Intentar detectar el tipo de wallet desde los metadatos de la sesión
                const sessionMetadata = session.getMetadata()
                let detectedWalletType: WalletType = 'walletconnect'

                if (sessionMetadata?.name?.toLowerCase().includes('hashpack')) {
                    detectedWalletType = 'hashpack'
                } else if (
                    sessionMetadata?.name?.toLowerCase().includes('kabila')
                ) {
                    detectedWalletType = 'kabila'
                }

                console.log(
                    '� Wallet detectado:',
                    detectedWalletType,
                    'Metadata:',
                    sessionMetadata
                )

                setAccount(accountId.toString())
                setSigner(session)
                setIsConnected(true)
                setWalletType(detectedWalletType)

                // Guardar sesión en localStorage para persistencia
                localStorage.setItem('hedera_wallet_connected', 'true')
                localStorage.setItem('hedera_account_id', accountId.toString())
                localStorage.setItem('hedera_wallet_type', detectedWalletType)
            } else {
                console.warn(
                    '⚠️ No se encontró ninguna sesión/signer después de la conexión'
                )
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error)
            const errorMessage = (error as Error).message
            if (
                !errorMessage.includes('User rejected') &&
                !errorMessage.includes('User closed modal')
            ) {
                alert('Error al conectar: ' + errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }, [initializeDAppConnector])

    // Función para conectar con un wallet específico (ahora usa el modal por defecto)
    const connectWithWallet = useCallback(
        async (selectedWalletType: WalletType) => {
            // Por ahora, simplemente llamamos a connect() que abre el modal
            // El usuario puede seleccionar el wallet que prefiera desde el modal
            await connect()
        },
        [connect]
    )

    // Función para desconectar
    const disconnect = useCallback(async () => {
        try {
            // Desconectar el DAppConnector
            if (dAppConnector) {
                await dAppConnector.disconnectAll()
            }

            setIsConnected(false)
            setAccount(null)
            setSigner(null)
            setWalletType(null)

            // Limpiar localStorage
            localStorage.removeItem('hedera_wallet_connected')
            localStorage.removeItem('hedera_account_id')
            localStorage.removeItem('hedera_wallet_type')
        } catch (error) {
            console.error('Error disconnecting:', error)
        }
    }, [])

    // Función para realizar llamadas nativas (ej. hedera_signAndExecuteTransaction)
    const callNativeMethod = useCallback(
        async (method: string, params: any) => {
            if (!dAppConnector || !isConnected || !account) {
                throw new Error('No estás conectado a ninguna wallet.')
            }

            console.log('📡 Llamando método:', method)
            console.log('📦 Parámetros:', params)
            console.log('🔌 Wallet type:', walletType)

            // Ejecutar método según el tipo
            if (method === 'hedera_signAndExecuteTransaction') {
                // Convertir Uint8Array a base64 si es necesario
                let transactionBytes = params.transaction
                let transactionBase64: string

                if (transactionBytes instanceof Uint8Array) {
                    // Convertir Uint8Array a base64
                    const byteArray = Array.from(transactionBytes) as number[]
                    const binary = byteArray
                        .map((byte) => String.fromCharCode(byte))
                        .join('')
                    transactionBase64 = btoa(binary)
                    console.log('🔄 Convertido Uint8Array a base64')
                } else {
                    transactionBase64 = transactionBytes
                }

                console.log(
                    '📝 Transaction base64 (primeros 100 chars):',
                    transactionBase64.substring(0, 100)
                )

                // Todos los wallets usan el DAppConnector
                const result = await dAppConnector.signAndExecuteTransaction({
                    signerAccountId: account,
                    transactionList: transactionBase64,
                })

                console.log('✅ Resultado de transacción:', result)
                return result
            }

            throw new Error(`Método ${method} no soportado`)
        },
        [isConnected, account, walletType]
    )

    /**
     * Execute a transaction using DAppSigner's executeWithSigner
     *
     * This is the CORRECT way to execute HBAR swaps, as it properly
     * serializes the payableAmount field.
     *
     * @param transaction - Frozen transaction (from freezeWithSigner)
     * @returns Transaction result with transactionId
     */
    const executeTransactionWithSigner = useCallback(
        async (transaction: any) => {
            if (!signer) {
                throw new Error(
                    'No signer available. Please connect your wallet first.'
                )
            }

            console.log('🚀 Executing transaction with signer...')

            try {
                // Execute transaction using DAppSigner
                const result = await transaction.executeWithSigner(signer)

                console.log('✅ Transaction executed:', result)

                // Return result with transactionId
                return {
                    transactionId: result.transactionId.toString(),
                    success: true,
                }
            } catch (error) {
                console.error(
                    '❌ Error executing transaction with signer:',
                    error
                )
                throw error
            }
        },
        [signer]
    )

    // Restaurar sesión al cargar la página
    useEffect(() => {
        const restoreSession = async () => {
            if (isInitialized) return // Ya inicializado

            const wasConnected = localStorage.getItem('hedera_wallet_connected')
            const savedAccount = localStorage.getItem('hedera_account_id')
            const savedWalletType = localStorage.getItem(
                'hedera_wallet_type'
            ) as WalletType | null

            if (wasConnected === 'true' && savedAccount && savedWalletType) {
                console.log('🔄 Restaurando sesión guardada...')
                console.log('Wallet type:', savedWalletType)
                setLoading(true)

                try {
                    const connector = initializeDAppConnector()
                    if (!connector) {
                        throw new Error('No se pudo inicializar el conector')
                    }

                    await connector.init({ logger: 'error' })
                    const session = connector.signers[0]

                    if (session) {
                        const accountId = session.getAccountId()
                        console.log(
                            '✅ Sesión restaurada:',
                            accountId.toString()
                        )
                        setAccount(accountId.toString())
                        setSigner(session)
                        setIsConnected(true)
                        setWalletType(savedWalletType)
                    } else {
                        console.log(
                            '⚠️ No hay sesión activa, limpiando localStorage'
                        )
                        localStorage.removeItem('hedera_wallet_connected')
                        localStorage.removeItem('hedera_account_id')
                        localStorage.removeItem('hedera_wallet_type')
                    }
                } catch (error) {
                    console.error('❌ Error al restaurar sesión:', error)
                    localStorage.removeItem('hedera_wallet_connected')
                    localStorage.removeItem('hedera_account_id')
                    localStorage.removeItem('hedera_wallet_type')
                } finally {
                    setLoading(false)
                    setIsInitialized(true)
                }
            } else {
                setIsInitialized(true)
            }
        }

        restoreSession()
    }, [initializeDAppConnector, isInitialized])

    const value: ReownContextType = {
        isConnected,
        account,
        loading,
        walletType,
        connect,
        connectWithWallet,
        disconnect,
        callNativeMethod,
        executeTransactionWithSigner,
        dAppConnector,
        signer,
    }

    return (
        <ReownContext.Provider value={value}>{children}</ReownContext.Provider>
    )
}
