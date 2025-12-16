'use client'

import dynamic from 'next/dynamic'

const ReownProvider = dynamic(
    () => import('./ReownProvider').then((mod) => mod.ReownProvider),
    {
        ssr: false,
    }
)

export function ReownProviderWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    return <ReownProvider>{children}</ReownProvider>
}
