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

function evmAddressToAccountId(evmAddress: string): string {
    if (
        !evmAddress ||
        evmAddress === '0x0000000000000000000000000000000000000000'
    ) {
        return ''
    }
    const hex = evmAddress.replace('0x', '')
    const accountNum = parseInt(hex.slice(-8), 16)
    return `0.0.${accountNum}`
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

        // Get contract results which include the 'from' field (payer information)
        let resultsUrl = `${baseUrlWithKey}/api/v1/contracts/${contractId}/results?order=desc&limit=${limit}`
        if (cursor) {
            resultsUrl += `&timestamp=lt:${cursor}`
        }

        const resultsResponse = await fetch(resultsUrl)

        if (!resultsResponse.ok) {
            const errorText = await resultsResponse.text()
            console.error('Validation Cloud results error:', resultsResponse.status, errorText)
            return NextResponse.json(
                { error: `Validation Cloud API error: ${resultsResponse.statusText}` },
                { status: resultsResponse.status }
            )
        }

        const resultsData = await resultsResponse.json()
        const allResults = resultsData.results || []
        console.log(`📦 Found ${allResults.length} contract results`)

        // Convert wallet address to EVM format for comparison
        const walletEvmAddress = `0x${parseInt(walletAddress.split('.')[2]).toString(16).padStart(40, '0')}`

        // Create a map of transaction_hash -> transaction info for user's transactions
        const txInfoMap = new Map<string, { payer: string; txId: string }>()
        
        allResults.forEach((result: any) => {
            if (result.hash && result.from) {
                const payerAccountId = evmAddressToAccountId(result.from)
                txInfoMap.set(result.hash, {
                    payer: payerAccountId,
                    txId: result.transaction_id || result.hash,
                })
            }
        })

        // Get logs for the contract
        let logsUrl = `${baseUrlWithKey}/api/v1/contracts/${contractId}/results/logs?order=desc&limit=${limit}`
        if (cursor) {
            logsUrl += `&timestamp=lt:${cursor}`
        }

        const logsResponse = await fetch(logsUrl)
        if (!logsResponse.ok) {
            console.error('Failed to fetch logs')
            return NextResponse.json({
                transactions: [],
                next_cursor: null,
                has_more: false,
            })
        }

        const logsData = await logsResponse.json()
        const transactions: any[] = []

        for (const log of logsData.logs || []) {
            if (log.topics && log.topics.length === 4 && log.transaction_hash) {
                const txHash = log.transaction_hash
                const txInfo = txInfoMap.get(txHash)
                
                // Filter: only include transactions from the specified wallet
                if (!txInfo || txInfo.payer !== walletAddress) {
                    continue
                }

                const timestamp = log.timestamp
                const tokenFromAddress = log.topics[2]
                const tokenToAddress = log.topics[3]
                const data = log.data

                if (data && data.length >= 128) {
                    try {
                        const cleanData = data.startsWith('0x') ? data.slice(2) : data
                        const amountFromHex = cleanData.slice(0, 64)
                        const amountToHex = cleanData.slice(64, 128)
                        const amountFrom = BigInt('0x' + amountFromHex).toString()
                        const amountTo = BigInt('0x' + amountToHex).toString()
                        const tokenFrom = evmAddressToTokenId(tokenFromAddress)
                        const tokenTo = evmAddressToTokenId(tokenToAddress)

                        transactions.push({
                            transaction_id: txInfo.txId,
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

        console.log(`✅ Found ${transactions.length} swaps for wallet ${walletAddress}`)

        if (transactions.length > 0) {
            console.log('Sample swap:', transactions[0])
        }

        // Get the cursor for next page (timestamp of last LOG, not last filtered transaction)
        // This ensures we continue pagination even if filtered results are less than page limit
        const lastLog = logsData.logs?.[logsData.logs.length - 1]
        const nextCursor = lastLog?.timestamp || null

        const pageLimit = parseInt(limit)
        // has_more should be true if we got a full page of LOGS (before filtering)
        // This means there might be more transactions to check
        const hasMore = (logsData.logs?.length || 0) === pageLimit

        return NextResponse.json({
            transactions,
            next_cursor: nextCursor,
            has_more: hasMore,
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
