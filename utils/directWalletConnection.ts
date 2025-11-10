/**
 * Conexión directa con extensiones de wallet usando sus APIs nativas
 * Sin pasar por WalletConnect o modales
 */

// Tipos para las extensiones
interface HashPackProvider {
    connectToLocalWallet(): Promise<{
        accountIds: string[]
        network: string
        pairingString: string
    }>
    sendTransaction(params: {
        topic: string
        transaction: string // base64
        return: boolean
    }): Promise<{
        success: boolean
        receipt?: any
    }>
    pairingString?: string
}

interface KabilaProvider {
    connect(): Promise<{
        accountId: string
    }>
    signTransaction(transaction: string): Promise<{
        signedTransaction: string
    }>
}

declare global {
    interface Window {
        hashpack?: HashPackProvider
        kabila?: KabilaProvider
    }
}

/**
 * Detecta qué extensiones de Hedera están disponibles
 */
export function detectAvailableWallets(): string[] {
    if (typeof window === 'undefined') return []

    const wallets: string[] = []

    // Lista de posibles nombres de API de wallets
    const possibleNames = [
        'hashpack',
        'HashPack',
        'hederaWallet',
        'kabila',
        'Kabila',
        'blade',
        'Blade',
    ]

    possibleNames.forEach((name) => {
        if ((window as any)[name]) {
            wallets.push(name)
            console.log(
                `✅ Wallet detectado: window.${name}`,
                (window as any)[name]
            )
        }
    })

    return wallets
}

/**
 * Verifica si HashPack está instalado
 */
export function isHashPackInstalled(): boolean {
    if (typeof window === 'undefined') return false

    // Buscar HashPack en diferentes posibles ubicaciones
    const hashpack = (window as any).hashpack || (window as any).HashPack

    if (!hashpack) {
        console.log(
            '🔍 HashPack no encontrado. Wallets disponibles:',
            detectAvailableWallets()
        )
    }

    return !!hashpack
}

/**
 * Verifica si Kabila está instalado
 */
export function isKabilaInstalled(): boolean {
    if (typeof window === 'undefined') return false

    // Buscar Kabila en diferentes posibles ubicaciones
    const kabila = (window as any).kabila || (window as any).Kabila

    if (!kabila) {
        console.log(
            '🔍 Kabila no encontrado. Wallets disponibles:',
            detectAvailableWallets()
        )
    }

    return !!kabila
}

/**
 * Conecta directamente con HashPack usando su extensión
 */
export async function connectDirectHashPack(): Promise<{
    accountId: string
    pairingString: string
}> {
    if (!isHashPackInstalled()) {
        throw new Error(
            'HashPack extension is not installed. Please install it from https://www.hashpack.app/'
        )
    }

    console.log('🔌 Connecting directly to HashPack extension...')

    const result = await window.hashpack!.connectToLocalWallet()

    if (!result.accountIds || result.accountIds.length === 0) {
        throw new Error('No accounts found in HashPack')
    }

    const accountId = result.accountIds[0]
    console.log('✅ Connected to HashPack:', accountId)
    console.log('Pairing string:', result.pairingString)

    return {
        accountId,
        pairingString: result.pairingString,
    }
}

/**
 * Firma y ejecuta una transacción con HashPack
 */
export async function signTransactionWithHashPack(
    transactionBase64: string,
    pairingString: string
): Promise<any> {
    if (!isHashPackInstalled()) {
        throw new Error('HashPack is not connected')
    }

    console.log('📝 Signing transaction with HashPack...')

    const result = await window.hashpack!.sendTransaction({
        topic: pairingString,
        transaction: transactionBase64,
        return: false,
    })

    console.log('✅ Transaction result:', result)
    return result
}

/**
 * Conecta directamente con Kabila usando su extensión
 */
export async function connectDirectKabila(): Promise<string> {
    if (!isKabilaInstalled()) {
        throw new Error(
            'Kabila extension is not installed. Please install it from the Chrome Web Store.'
        )
    }

    console.log('🔌 Connecting directly to Kabila extension...')

    const result = await window.kabila!.connect()

    if (!result.accountId) {
        throw new Error('No account found in Kabila')
    }

    console.log('✅ Connected to Kabila:', result.accountId)

    return result.accountId
}

/**
 * Firma una transacción con Kabila
 */
export async function signTransactionWithKabila(
    transactionBase64: string
): Promise<any> {
    if (!isKabilaInstalled()) {
        throw new Error('Kabila is not connected')
    }

    console.log('📝 Signing transaction with Kabila...')

    const result = await window.kabila!.signTransaction(transactionBase64)

    console.log('✅ Transaction result:', result)
    return result
}
