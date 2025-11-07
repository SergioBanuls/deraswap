/**
 * API endpoint to ensure tokens are associated to BOTH Exchange and Adapter before swap
 * This prevents swap failures due to missing token associations
 * 
 * The Exchange needs tokens associated because it receives tokens from users via safeTransferFrom()
 * The Adapter needs tokens associated because it calls approve() on the router
 * 
 * POST /api/ensure-tokens-associated
 * Body: { tokenIds: ['0.0.1456986', '0.0.456858'] }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TokenId,
  AccountInfoQuery,
} from '@hashgraph/sdk';

// Both Exchange and Adapter need tokens associated
const EXCHANGE_CONTRACT_ID = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID || '0.0.10086948';
const ADAPTER_CONTRACT_ID = '0.0.10087392'; // v9: FIXED transferFrom + admin key for token associations
const OPERATOR_ID = process.env.HEDERA_ACCOUNT_ID!;
const OPERATOR_KEY = process.env.PRIVATE_KEY!;
const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet';

interface TokenAssociationRequest {
  tokenIds: string[];
}

interface TokenAssociationResult {
  tokenId: string;
  alreadyAssociatedToExchange: boolean;
  alreadyAssociatedToAdapter: boolean;
  associatedToExchange: boolean;
  associatedToAdapter: boolean;
  error?: string;
}

/**
 * Check if tokens are already associated to a contract
 */
async function checkTokenAssociations(
  client: Client,
  contractAccountId: AccountId,
  tokenIds: string[]
): Promise<Map<string, boolean>> {
  const associations = new Map<string, boolean>();
  
  try {
    // Query account info to get token relationships
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(contractAccountId)
      .execute(client);

    // Get list of associated token IDs
    const associatedTokens = accountInfo.tokenRelationships;
    const associatedTokenIds = new Set(
      Array.from(associatedTokens.keys()).map(tokenId => tokenId.toString())
    );

    // Check each requested token
    for (const tokenId of tokenIds) {
      associations.set(tokenId, associatedTokenIds.has(tokenId));
    }
  } catch (error) {
    console.error('Error checking token associations:', error);
    // If query fails, assume none are associated (will try to associate)
    for (const tokenId of tokenIds) {
      associations.set(tokenId, false);
    }
  }

  return associations;
}

/**
 * Associate tokens to both Exchange and Adapter
 */
async function ensureTokensAssociatedToBothContracts(
  client: Client,
  operatorKey: PrivateKey,
  exchangeAccountId: AccountId,
  adapterAccountId: AccountId,
  tokenIds: string[]
): Promise<TokenAssociationResult[]> {
  const results: TokenAssociationResult[] = [];

  // Check which tokens are already associated to each contract
  const exchangeAssociations = await checkTokenAssociations(client, exchangeAccountId, tokenIds);
  const adapterAssociations = await checkTokenAssociations(client, adapterAccountId, tokenIds);

  // Process each token
  for (const tokenId of tokenIds) {
    const alreadyInExchange = exchangeAssociations.get(tokenId) || false;
    const alreadyInAdapter = adapterAssociations.get(tokenId) || false;

    let associatedToExchange = alreadyInExchange;
    let associatedToAdapter = alreadyInAdapter;
    let error: string | undefined;

    // Associate to Exchange if needed
    if (!alreadyInExchange) {
      try {
        const tokenIdObj = TokenId.fromString(tokenId);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(exchangeAccountId)
          .setTokenIds([tokenIdObj])
          .freezeWith(client)
          .sign(operatorKey);

        const response = await associateTx.execute(client);
        await response.getReceipt(client);
        associatedToExchange = true;
        console.log(`✅ ${tokenId} associated to Exchange`);
      } catch (err: any) {
        if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          associatedToExchange = true;
        } else {
          error = `Exchange: ${err.message || 'Association failed'}`;
          console.error(`❌ ${tokenId} failed to associate to Exchange:`, err);
        }
      }
    }

    // Associate to Adapter if needed
    if (!alreadyInAdapter) {
      try {
        const tokenIdObj = TokenId.fromString(tokenId);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(adapterAccountId)
          .setTokenIds([tokenIdObj])
          .freezeWith(client)
          .sign(operatorKey);

        const response = await associateTx.execute(client);
        await response.getReceipt(client);
        associatedToAdapter = true;
        console.log(`✅ ${tokenId} associated to Adapter`);
      } catch (err: any) {
        if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          associatedToAdapter = true;
        } else {
          const adapterError = `Adapter: ${err.message || 'Association failed'}`;
          error = error ? `${error}; ${adapterError}` : adapterError;
          console.error(`❌ ${tokenId} failed to associate to Adapter:`, err);
        }
      }
    }

    results.push({
      tokenId,
      alreadyAssociatedToExchange: alreadyInExchange,
      alreadyAssociatedToAdapter: alreadyInAdapter,
      associatedToExchange,
      associatedToAdapter,
      error,
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenAssociationRequest = await request.json();
    const { tokenIds } = body;

    if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: tokenIds array required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!OPERATOR_ID || !OPERATOR_KEY) {
      console.error('Missing HEDERA_ACCOUNT_ID or PRIVATE_KEY environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Setup Hedera client
    const client = NETWORK === 'testnet' 
      ? Client.forTestnet()
      : Client.forMainnet();
    
    const operatorId = AccountId.fromString(OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
    client.setOperator(operatorId, operatorKey);

    const exchangeAccountId = AccountId.fromString(EXCHANGE_CONTRACT_ID);
    const adapterAccountId = AccountId.fromString(ADAPTER_CONTRACT_ID);

    console.log('🔗 Ensuring tokens associated to Exchange and Adapter...');
    console.log('Exchange:', EXCHANGE_CONTRACT_ID);
    console.log('Adapter:', ADAPTER_CONTRACT_ID);
    console.log('Tokens:', tokenIds.join(', '));

    // Associate tokens to both contracts
    const results = await ensureTokensAssociatedToBothContracts(
      client,
      operatorKey,
      exchangeAccountId,
      adapterAccountId,
      tokenIds
    );

    client.close();

    // Check if all were successful (both Exchange and Adapter)
    const allAssociated = results.every(r => r.associatedToExchange && r.associatedToAdapter);
    const alreadyInBoth = results.filter(r => r.alreadyAssociatedToExchange && r.alreadyAssociatedToAdapter).length;
    const newlyAssociatedToExchange = results.filter(r => !r.alreadyAssociatedToExchange && r.associatedToExchange).length;
    const newlyAssociatedToAdapter = results.filter(r => !r.alreadyAssociatedToAdapter && r.associatedToAdapter).length;
    const failures = results.filter(r => !r.associatedToExchange || !r.associatedToAdapter);

    return NextResponse.json({
      success: allAssociated,
      results,
      summary: {
        total: tokenIds.length,
        alreadyAssociatedToBoth: alreadyInBoth,
        newlyAssociatedToExchange,
        newlyAssociatedToAdapter,
        failed: failures.length,
      },
    });

  } catch (error: any) {
    console.error('Error in ensure-tokens-associated:', error);
    return NextResponse.json(
      { 
        error: 'Failed to ensure token associations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
