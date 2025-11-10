'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface WalletConnectionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectWallet: (
        walletType: 'hashpack' | 'kabila' | 'walletconnect'
    ) => void
    loading?: boolean
}

export function WalletConnectionModal({
    open,
    onOpenChange,
    onSelectWallet,
    loading = false,
}: WalletConnectionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='text-center text-2xl font-bold'>
                        Connect Wallet
                    </DialogTitle>
                </DialogHeader>

                <div className='flex flex-col gap-3 py-4'>
                    {/* HashPack Option */}
                    <Button
                        onClick={() => onSelectWallet('hashpack')}
                        disabled={loading}
                        className='w-full h-16 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-3'
                    >
                        <div className='w-8 h-8 rounded-full flex items-center justify-center overflow-hidden'>
                            <Image
                                src='/hashpack-wallet.png'
                                alt='HashPack'
                                width={32}
                                height={32}
                                className='object-contain'
                            />
                        </div>
                        HashPack
                    </Button>

                    {/* Kabila Option */}
                    <Button
                        onClick={() => onSelectWallet('kabila')}
                        disabled={loading}
                        className='w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-3'
                    >
                        <div className='w-8 h-8 rounded-full flex items-center justify-center overflow-hidden'>
                            <Image
                                src='/kabila-wallet.png'
                                alt='Kabila'
                                width={32}
                                height={32}
                                className='object-contain'
                            />
                        </div>
                        Kabila
                    </Button>

                    {/* WalletConnect Option */}
                    <Button
                        onClick={() => onSelectWallet('walletconnect')}
                        disabled={loading}
                        className='w-full h-16 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-3'
                    >
                        <div className='w-8 h-8 rounded-full flex items-center justify-center overflow-hidden'>
                            <Image
                                src='/walletconnect-logo.png'
                                alt='WalletConnect'
                                width={32}
                                height={32}
                                className='object-contain'
                            />
                        </div>
                        WalletConnect
                    </Button>
                </div>

                <p className='text-sm text-center text-muted-foreground mt-2'>
                    Select your preferred wallet to connect
                </p>
            </DialogContent>
        </Dialog>
    )
}
