import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ReownProviderWrapper } from '@/contexts/ReownProviderWrapper'
import { Header } from '@/components/Header'
import { Toaster } from 'sonner'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'DeraSwap - Hedera DEX',
    description: 'Decentralized exchange for Hedera tokens',
    icons: {
        icon: '/DERASWAP_logo.ico',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang='en' className='dark'>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Providers>
                    <ReownProviderWrapper>
                        <Header />
                        {children}
                        <Toaster
                            position='bottom-right'
                            toastOptions={{
                                style: {
                                    background: '#262626',
                                    color: '#fff',
                                    border: '1px solid #404040',
                                },
                            }}
                        />
                    </ReownProviderWrapper>
                </Providers>
            </body>
        </html>
    )
}
