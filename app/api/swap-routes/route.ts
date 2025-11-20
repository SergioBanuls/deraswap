import { NextRequest, NextResponse } from 'next/server'

const ETASWAP_API_BASE_URL = 'https://api.etaswap.com/v1'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const tokenFrom = searchParams.get('tokenFrom')
        const tokenTo = searchParams.get('tokenTo')
        const amount = searchParams.get('amount')
        const isReverse = searchParams.get('isReverse') || 'false'

        // Validate required parameters
        if (!tokenFrom || !tokenTo || !amount) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    details: 'tokenFrom, tokenTo, and amount are required',
                },
                { status: 400 }
            )
        }

        // Forward the request to ETASwap API
        const url = new URL(`${ETASWAP_API_BASE_URL}/rates`)
        url.searchParams.set('tokenFrom', tokenFrom)
        url.searchParams.set('tokenTo', tokenTo)
        url.searchParams.set('amount', amount)
        url.searchParams.set('isReverse', isReverse)

        console.log('Proxying request to ETASwap API:', url.toString())

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('ETASwap API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            })

            return NextResponse.json(
                {
                    error: 'ETASwap API request failed',
                    status: response.status,
                    details: errorText,
                },
                { status: response.status }
            )
        }

        const data = await response.json()

        // Return the data from ETASwap
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
        })
    } catch (error) {
        console.error('Error in swap-routes API:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
