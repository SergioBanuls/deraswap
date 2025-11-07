/**
 * Associate tokens to Exchange contract
 * 
 * The Exchange also needs tokens associated because it receives tokens
 * from users via safeTransferFrom() before sending them to adapters
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

const EXCHANGE_CONTRACT_ID = '0.0.10086948'; // New Exchange with admin key

// Mainnet tokens to associate
const MAINNET_TOKENS = [
  '0.0.1456986', // WHBAR
  '0.0.456858',  // USDC
  '0.0.731861',  // SAUCE
];

async function associateTokens() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔗 Associating tokens to Exchange...');
  console.log('Exchange:', EXCHANGE_CONTRACT_ID);
  console.log('Operator:', operatorId.toString());
  console.log('Tokens to associate:', MAINNET_TOKENS.length);

  const exchangeAccountId = AccountId.fromString(EXCHANGE_CONTRACT_ID);

  // Associate tokens in batches of 10 (Hedera limit)
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < MAINNET_TOKENS.length; i += BATCH_SIZE) {
    const batch = MAINNET_TOKENS.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
    
    for (const tokenIdStr of batch) {
      try {
        console.log(`  Associating ${tokenIdStr}...`);
        
        const tokenId = TokenId.fromString(tokenIdStr);
        
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(exchangeAccountId)
          .setTokenIds([tokenId])
          .freezeWith(client)
          .sign(operatorKey);

        const response = await associateTx.execute(client);
        const receipt = await response.getReceipt(client);

        console.log(`  ✅ ${tokenIdStr} associated - Status: ${receipt.status.toString()}`);
      } catch (error: any) {
        if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          console.log(`  ℹ️  ${tokenIdStr} already associated (OK)`);
        } else {
          console.error(`  ❌ ${tokenIdStr} failed:`, error.message || error);
        }
      }
    }
  }

  console.log('\n✅ Token association complete!');
  process.exit(0);
}

associateTokens().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
