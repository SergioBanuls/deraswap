'use client'

import { useState } from 'react'
import { useReownContext, WalletType } from '@/contexts/ReownProvider'
import { AccountDialog } from './AccountDialog'
import { Button } from './ui/button'
import { WalletConnectionModal } from './WalletConnectionModal'

export function SessionActionButtons() {
    const { account, loading, isConnected, disconnect, connectWithWallet } =
        useReownContext()

    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

    const handleConnectClick = () => {
        setIsWalletModalOpen(true)
    }

    const handleWalletSelect = async (walletType: WalletType) => {
        setIsWalletModalOpen(false)
        await connectWithWallet(walletType)
    }

    const formatAccount = (acc: string) => {
        return `${acc.slice(0, 6)}...${acc.slice(-4)}`
    }

    if (account)
        return (
            <>
                <Button
                    onClick={() => setIsAccountDialogOpen(true)}
                    className='bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 rounded-full text-md cursor-pointer py-2'
                >
                    {account}
                </Button>
                <AccountDialog
                    open={isAccountDialogOpen}
                    onOpenChange={setIsAccountDialogOpen}
                    accountId={account}
                />
            </>
        )

    return (
        <>
            <button
                onClick={handleConnectClick}
                disabled={loading}
                className='px-6 py-2 from-p bg-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 text-white'
            >
                {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>

            <WalletConnectionModal
                open={isWalletModalOpen}
                onOpenChange={setIsWalletModalOpen}
                onSelectWallet={handleWalletSelect}
                loading={loading}
            />
        </>
    )
}
