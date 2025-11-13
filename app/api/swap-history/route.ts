/**
 * Swap History API Endpoint
 *
 * Fetches swap transaction history from Validation Cloud Mirror Node.
 * Parses contract logs to extract token pairs and amounts.
 */

import { NextRequest, NextResponse } from 'next/server'

const VALIDATION_CLOUD_BASE_URL =
    process.env.VALIDATION_CLOUD_BASE_URL ||
    'https://mainnet.hedera.validationcloud.io/v1'
const VALIDATION_CLOUD_API_KEY = process.env.VALIDATION_CLOUD_API_KEY

function evmAddressToTokenId(evmAddress: string): string {
    if (
        !evmAddress ||
        evmAddress === '0x0000000000000000000000000000000000000000'
    ) {
        return 'HBAR'
    }
    const hex = evmAddress.replace('0x', '')
    const tokenNum = parseInt(hex.slice(-8), 16)
    return `0.0.${tokenNum}`
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const contractId = searchParams.get('contractId')
        const walletAddress = searchParams.get('walletAddress')
        const cursor = searchParams.get('cursor') // timestamp for pagination
        const limit = searchParams.get('limit') || '20' // default to 20 if not specified

        if (!contractId || !walletAddress) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters: contractId and walletAddress',
                },
                { status: 400 }
            )
        }

        console.log('Fetching swap history:', {
            contractId,
            walletAddress,
            cursor,
            limit,
        })

        const baseUrlWithKey = VALIDATION_CLOUD_API_KEY
            ? `${VALIDATION_CLOUD_BASE_URL}/${VALIDATION_CLOUD_API_KEY}`
            : VALIDATION_CLOUD_BASE_URL

        // Build URL with pagination cursor if provided
        let logsUrl = `${baseUrlWithKey}/api/v1/contracts/${contractId}/results/logs?order=desc&limit=${limit}`
        if (cursor) {
            logsUrl += `&timestamp=lt:${cursor}`
        }

        const logsResponse = await fetch(logsUrl)

        if (!logsResponse.ok) {
            const errorText = await logsResponse.text()
            console.error(
                'Validation Cloud logs error:',
                logsResponse.status,
                errorText
            )
            return NextResponse.json(
                {
                    error: `Validation Cloud API error: ${logsResponse.statusText}`,
                },
                { status: logsResponse.status }
            )
        }

        const logsData = await logsResponse.json()
        console.log('Found logs:', logsData.logs?.length || 0)

        if (!logsData.logs || logsData.logs.length === 0) {
            return NextResponse.json({
                transactions: [],
                next_cursor: null,
                has_more: false,
                source: 'logs',
            })
        }

        const transactions: any[] = []

        for (const log of logsData.logs) {
            // Swap events have 4 topics: [event signature, aggregatorId hash, tokenFrom, tokenTo]
            if (log.topics && log.topics.length === 4) {
                const txId = log.transaction_id
                const timestamp = log.timestamp
                const tokenFromAddress = log.topics[2]
                const tokenToAddress = log.topics[3]
                const data = log.data

                if (data && data.length >= 128) {
                    try {
                        const cleanData = data.startsWith('0x')
                            ? data.slice(2)
                            : data
                        const amountFromHex = cleanData.slice(0, 64)
                        const amountToHex = cleanData.slice(64, 128)
                        const amountFrom = BigInt(
                            '0x' + amountFromHex
                        ).toString()
                        const amountTo = BigInt('0x' + amountToHex).toString()
                        const tokenFrom = evmAddressToTokenId(tokenFromAddress)
                        const tokenTo = evmAddressToTokenId(tokenToAddress)

                        // Add every swap, don't group by txId
                        transactions.push({
                            transaction_id: txId,
                            consensus_timestamp: timestamp,
                            token_from: tokenFrom,
                            token_to: tokenTo,
                            amount_from: amountFrom,
                            amount_to: amountTo,
                        })
                    } catch (parseError) {
                        console.warn('Error parsing log data:', parseError)
                    }
                }
            }
        }

        console.log('Total swap transactions:', transactions.length)

        if (transactions.length > 0) {
            console.log('Sample swap:', transactions[0])
        }

        // Get the cursor for next page (timestamp of last transaction)
        const nextCursor =
            transactions.length > 0
                ? transactions[transactions.length - 1].consensus_timestamp
                : null

        const pageLimit = parseInt(limit)
        return NextResponse.json({
            transactions,
            next_cursor: nextCursor,
            has_more: transactions.length === pageLimit, // If we got full page, there might be more
            source: 'logs',
        })
    } catch (error) {
        console.error('Error in swap-history API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
