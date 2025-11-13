/**
 * Hook to associate a token to the user's account
 *
 * Uses TokenAssociateTransaction to add the token to the user's account
 * This must be done before the user can receive the token in a swap
 */

'use client'

import { useState } from 'react'
import { useReownConnect } from './useReownConnect'
import { buildAssociationTransaction } from '@/utils/tokenAssociation'

export function useAssociateToken() {
    const { callNativeMethod, signer, account, isConnected } = useReownConnect()
    const [isAssociating, setIsAssociating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const associateToken = async (tokenId: string): Promise<boolean> => {
        if (!isConnected || !account || !signer) {
            setError('Wallet not connected')
            return false
        }

        if (!tokenId || tokenId === 'HBAR') {
            // HBAR doesn't need association
            return true
        }

        setIsAssociating(true)
        setError(null)

        try {
            console.log(
                `🔗 Associating token ${tokenId} to user account ${account}`
            )

            // Build token association transaction
            const txBytes = buildAssociationTransaction({
                tokenId,
                accountId: account,
            })

            // Convert to base64 for wallet
            const byteArray = Array.from(txBytes) as number[]
            const binary = byteArray
                .map((byte) => String.fromCharCode(byte))
                .join('')
            const transactionBase64 = btoa(binary)

            console.log('📤 Sending association transaction to wallet...')

            // Execute via wallet
            const result = await callNativeMethod(
                'hedera_signAndExecuteTransaction',
                {
                    transaction: transactionBase64,
                }
            )

            console.log('✅ Token association successful:', result)

            return true
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to associate token'
            console.error('❌ Token association failed:', err)
            setError(errorMsg)
            return false
        } finally {
            setIsAssociating(false)
        }
    }

    return {
        associateToken,
        isAssociating,
        error,
    }
}
