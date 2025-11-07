/**
 * Script to associate WHBAR token to your account
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TokenId,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const WHBAR_TOKEN_ID = '0.0.1490393'; // SAUCE testnet

async function associateToken() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔗 Associating WHBAR token to your account...');

  try {
    const tx = await new TokenAssociateTransaction()
      .setAccountId(operatorId)
      .setTokenIds([TokenId.fromString(WHBAR_TOKEN_ID)])
      .execute(client);

    const receipt = await tx.getReceipt(client);
    
    console.log('✅ Token associated successfully!');
    console.log('Transaction ID:', tx.transactionId.toString());
    console.log('Status:', receipt.status.toString());

  } catch (error: any) {
    if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED')) {
      console.log('ℹ️  Token already associated');
    } else {
      console.error('❌ Error associating token:', error);
      throw error;
    }
  } finally {
    client.close();
  }
}

associateToken()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
