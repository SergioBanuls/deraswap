import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'dwk1opv266jxs.cloudfront.net',
                pathname: '/icons/**',
            },
            {
                protocol: 'https',
                hostname: 'www.saucerswap.finance',
                pathname: '/images/**',
            },
        ],
    },
    serverExternalPackages: ['@hashgraph/sdk', 'pino', 'thread-stream'],
}

export default nextConfig
