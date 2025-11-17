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
} from '@hashgraph/sdk';

// Both Exchange, Adapters, and Fee Wallet need tokens associated
const EXCHANGE_CONTRACT_ID = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID || '0.0.10086948';
// We need to associate tokens to ALL adapters used by the app
const ADAPTER_V2_CONTRACT_ID = process.env.SAUCERSWAP_V2_ADAPTER_EXACT_ID || '0.0.10087551'; // SaucerSwapV2_EXACT2 (active)
const ADAPTER_V1_CONTRACT_ID = process.env.SAUCERSWAP_V1_ADAPTER_ID || '0.0.10087830'; // SaucerSwapV1_v2
// Fee wallet needs tokens associated to receive fees
const FEE_WALLET_CONTRACT_ID = '0.0.10085914'; // Fee wallet that receives swap fees
const OPERATOR_ID = process.env.HEDERA_ACCOUNT_ID!;
const OPERATOR_KEY = process.env.PRIVATE_KEY!;
const FEE_WALLET_PRIVATE_KEY = process.env.MAINNET_YOUR_FEE_WALLET_PRIVATE_KEY; // Fee wallet's own private key (DER format)
const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet';

interface TokenAssociationRequest {
  tokenIds: string[];
  tokenFrom?: string; // Optional: the input token for the swap (only this needs fee wallet association)
}

interface TokenAssociationResult {
  tokenId: string;
  alreadyAssociatedToExchange: boolean;
  alreadyAssociatedToAdapterV2: boolean;
  alreadyAssociatedToAdapterV1: boolean;
  alreadyAssociatedToFeeWallet: boolean;
  associatedToExchange: boolean;
  associatedToAdapterV2: boolean;
  associatedToAdapterV1: boolean;
  associatedToFeeWallet: boolean;
  error?: string;
}

/**
 * Check if tokens are already associated to a contract
 * IMPORTANT: Uses FREE Mirror Node API instead of AccountInfoQuery (which costs HBAR)
 */
async function checkTokenAssociations(
  client: Client,
  contractAccountId: AccountId,
  tokenIds: string[]
): Promise<Map<string, boolean>> {
  const associations = new Map<string, boolean>();

  try {
    // Use FREE Validation Cloud Mirror Node API - API key goes in URL
    const baseUrl = process.env.NEXT_PUBLIC_VALIDATION_CLOUD_BASE_URL || 'https://mainnet.hedera.validationcloud.io/v1';
    const apiKey = process.env.VALIDATION_CLOUD_API_KEY;

    if (!apiKey) {
      throw new Error('VALIDATION_CLOUD_API_KEY is not configured');
    }

    const accountIdStr = contractAccountId.toString();

    // API key goes in the URL: /v1/{apiKey}/api/v1/accounts/...
    const baseUrlWithKey = `${baseUrl}/${apiKey}`;
    const url = `${baseUrlWithKey}/api/v1/accounts/${accountIdStr}/tokens?limit=100`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status}`);
    }

    const data = await response.json();

    // Get list of associated token IDs from Mirror Node
    const associatedTokenIds = new Set(
      (data.tokens || []).map((token: any) => token.token_id)
    );

    // Check each requested token
    for (const tokenId of tokenIds) {
      associations.set(tokenId, associatedTokenIds.has(tokenId));
    }

    console.log(`✅ Checked ${tokenIds.length} token(s) for ${accountIdStr} using FREE Mirror Node API`);
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
 * Associate tokens to Exchange, BOTH Adapters (V1 and V2), and Fee Wallet
 */
async function ensureTokensAssociatedToAllContracts(
  client: Client,
  operatorKey: PrivateKey,
  feeWalletKey: PrivateKey | null,
  exchangeAccountId: AccountId,
  adapterV2AccountId: AccountId,
  adapterV1AccountId: AccountId,
  feeWalletAccountId: AccountId,
  tokenIds: string[],
  tokenFrom?: string
): Promise<TokenAssociationResult[]> {
  const results: TokenAssociationResult[] = [];

  // Check which tokens are already associated to each contract
  const exchangeAssociations = await checkTokenAssociations(client, exchangeAccountId, tokenIds);
  const adapterV2Associations = await checkTokenAssociations(client, adapterV2AccountId, tokenIds);
  const adapterV1Associations = await checkTokenAssociations(client, adapterV1AccountId, tokenIds);

  // Only check fee wallet for the input token (tokenFrom)
  const feeWalletTokens = tokenFrom ? [tokenFrom] : [];
  const feeWalletAssociations = feeWalletTokens.length > 0
    ? await checkTokenAssociations(client, feeWalletAccountId, feeWalletTokens)
    : new Map<string, boolean>();

  // Process each token
  for (const tokenId of tokenIds) {
    const alreadyInExchange = exchangeAssociations.get(tokenId) || false;
    const alreadyInAdapterV2 = adapterV2Associations.get(tokenId) || false;
    const alreadyInAdapterV1 = adapterV1Associations.get(tokenId) || false;
    const alreadyInFeeWallet = feeWalletAssociations.get(tokenId) || false;

    let associatedToExchange = alreadyInExchange;
    let associatedToAdapterV2 = alreadyInAdapterV2;
    let associatedToAdapterV1 = alreadyInAdapterV1;
    let associatedToFeeWallet = alreadyInFeeWallet;
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

    // Associate to Adapter V2 if needed
    if (!alreadyInAdapterV2) {
      try {
        const tokenIdObj = TokenId.fromString(tokenId);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(adapterV2AccountId)
          .setTokenIds([tokenIdObj])
          .freezeWith(client)
          .sign(operatorKey);

        const response = await associateTx.execute(client);
        await response.getReceipt(client);
        associatedToAdapterV2 = true;
        console.log(`✅ ${tokenId} associated to Adapter V2`);
      } catch (err: any) {
        if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          associatedToAdapterV2 = true;
        } else {
          const adapterError = `Adapter V2: ${err.message || 'Association failed'}`;
          error = error ? `${error}; ${adapterError}` : adapterError;
          console.error(`❌ ${tokenId} failed to associate to Adapter V2:`, err);
        }
      }
    }

    // Associate to Adapter V1 if needed
    if (!alreadyInAdapterV1) {
      try {
        const tokenIdObj = TokenId.fromString(tokenId);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(adapterV1AccountId)
          .setTokenIds([tokenIdObj])
          .freezeWith(client)
          .sign(operatorKey);

        const response = await associateTx.execute(client);
        await response.getReceipt(client);
        associatedToAdapterV1 = true;
        console.log(`✅ ${tokenId} associated to Adapter V1`);
      } catch (err: any) {
        if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          associatedToAdapterV1 = true;
        } else {
          const adapterError = `Adapter V1: ${err.message || 'Association failed'}`;
          error = error ? `${error}; ${adapterError}` : adapterError;
          console.error(`❌ ${tokenId} failed to associate to Adapter V1:`, err);
        }
      }
    }

    // Associate to Fee Wallet if needed (only for tokenFrom)
    const shouldAssociateFeeWallet = tokenFrom && tokenId === tokenFrom;
    if (shouldAssociateFeeWallet && !alreadyInFeeWallet && feeWalletKey) {
      try {
        const tokenIdObj = TokenId.fromString(tokenId);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(feeWalletAccountId)
          .setTokenIds([tokenIdObj])
          .freezeWith(client)
          .sign(feeWalletKey); // Use fee wallet's own key

        const response = await associateTx.execute(client);
        await response.getReceipt(client);
        associatedToFeeWallet = true;
        console.log(`✅ ${tokenId} associated to Fee Wallet`);
      } catch (err: any) {
        if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          associatedToFeeWallet = true;
        } else {
          const feeWalletError = `Fee Wallet: ${err.message || 'Association failed'}`;
          error = error ? `${error}; ${feeWalletError}` : feeWalletError;
          console.error(`❌ ${tokenId} failed to associate to Fee Wallet:`, err);
        }
      }
    } else if (!shouldAssociateFeeWallet) {
      // Mark as associated (not needed for this token)
      associatedToFeeWallet = true;
    } else if (!feeWalletKey && shouldAssociateFeeWallet && !alreadyInFeeWallet) {
      // No fee wallet key provided, cannot associate
      const feeWalletError = 'Fee Wallet: No FEE_WALLET_PRIVATE_KEY configured';
      error = error ? `${error}; ${feeWalletError}` : feeWalletError;
      console.warn(`⚠️ ${tokenId} cannot be associated to Fee Wallet (no key configured)`);
    }

    results.push({
      tokenId,
      alreadyAssociatedToExchange: alreadyInExchange,
      alreadyAssociatedToAdapterV2: alreadyInAdapterV2,
      alreadyAssociatedToAdapterV1: alreadyInAdapterV1,
      alreadyAssociatedToFeeWallet: alreadyInFeeWallet,
      associatedToExchange,
      associatedToAdapterV2,
      associatedToAdapterV1,
      associatedToFeeWallet,
      error,
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenAssociationRequest = await request.json();
    const { tokenIds, tokenFrom } = body;

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

    // Get fee wallet key if available (DER format)
    const feeWalletKey = FEE_WALLET_PRIVATE_KEY
      ? PrivateKey.fromStringDer(FEE_WALLET_PRIVATE_KEY)
      : null;

    const exchangeAccountId = AccountId.fromString(EXCHANGE_CONTRACT_ID);
    const adapterV2AccountId = AccountId.fromString(ADAPTER_V2_CONTRACT_ID);
    const adapterV1AccountId = AccountId.fromString(ADAPTER_V1_CONTRACT_ID);
    const feeWalletAccountId = AccountId.fromString(FEE_WALLET_CONTRACT_ID);

    console.log('🔗 Ensuring tokens associated to Exchange, Adapters, and Fee Wallet...');
    console.log('Exchange:', EXCHANGE_CONTRACT_ID);
    console.log('Adapter V2:', ADAPTER_V2_CONTRACT_ID, '(EXACT2)');
    console.log('Adapter V1:', ADAPTER_V1_CONTRACT_ID);
    console.log('Fee Wallet:', FEE_WALLET_CONTRACT_ID);
    console.log('Tokens to associate (all contracts):', tokenIds.join(', '));
    if (tokenFrom) {
      console.log('Token from (fee wallet only):', tokenFrom);
    }
    console.log('Network:', NETWORK);

    // Associate tokens to all contracts (Exchange + V2 + V1 + Fee Wallet)
    const results = await ensureTokensAssociatedToAllContracts(
      client,
      operatorKey,
      feeWalletKey,
      exchangeAccountId,
      adapterV2AccountId,
      adapterV1AccountId,
      feeWalletAccountId,
      tokenIds,
      tokenFrom
    );

    client.close();

    // Check if all were successful (Exchange + V2 + V1 + Fee Wallet)
    const allAssociated = results.every(r =>
      r.associatedToExchange && r.associatedToAdapterV2 && r.associatedToAdapterV1 && r.associatedToFeeWallet
    );
    const alreadyInAll = results.filter(r =>
      r.alreadyAssociatedToExchange && r.alreadyAssociatedToAdapterV2 && r.alreadyAssociatedToAdapterV1 && r.alreadyAssociatedToFeeWallet
    ).length;
    const newlyAssociatedToExchange = results.filter(r =>
      !r.alreadyAssociatedToExchange && r.associatedToExchange
    ).length;
    const newlyAssociatedToAdapterV2 = results.filter(r =>
      !r.alreadyAssociatedToAdapterV2 && r.associatedToAdapterV2
    ).length;
    const newlyAssociatedToAdapterV1 = results.filter(r =>
      !r.alreadyAssociatedToAdapterV1 && r.associatedToAdapterV1
    ).length;
    const newlyAssociatedToFeeWallet = results.filter(r =>
      !r.alreadyAssociatedToFeeWallet && r.associatedToFeeWallet
    ).length;
    const failures = results.filter(r =>
      !r.associatedToExchange || !r.associatedToAdapterV2 || !r.associatedToAdapterV1 || !r.associatedToFeeWallet
    );

    return NextResponse.json({
      success: allAssociated,
      results,
      summary: {
        total: tokenIds.length,
        alreadyAssociatedToAll: alreadyInAll,
        newlyAssociatedToExchange,
        newlyAssociatedToAdapterV2,
        newlyAssociatedToAdapterV1,
        newlyAssociatedToFeeWallet,
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
