/**
 * Script to associate mainnet tokens to the adapter contract
 * Uses the operator's admin key to sign (ETASwap approach)
 * 
 * Usage: npx tsx scripts/associate-mainnet-tokens.ts
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

// Adapter with admin key
const ADAPTER_CONTRACT_ID = '0.0.10086914';

// MAINNET token IDs (verified addresses)
const MAINNET_TOKENS = {
  WHBAR: '0.0.1456986',   // ✅ Verified: 0x163456
  USDC: '0.0.456858',     // ✅ Verified: 0x06f89a
  SAUCE: '0.0.731861',    // ✅ Verified: 0x0b2955
  HBARX: '0.0.2543294',   // ✅ Verified: 0x26cdce
  USDT: '0.0.1372508',    // ✅ Verified: 0x14f03c
  XSAUCE: '0.0.778694',   // ✅ Verified: 0x0be036
  KARATE: '0.0.1129239',  // ✅ Verified: 0x113be7
};

async function associateTokens() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  const adapterAccountId = AccountId.fromString(ADAPTER_CONTRACT_ID);

  console.log('🔗 Associating mainnet tokens to adapter...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Operator:', operatorId.toString());
  console.log('   Adapter:', ADAPTER_CONTRACT_ID);
  console.log('   Tokens to associate:', Object.keys(MAINNET_TOKENS).length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let successCount = 0;
  let failCount = 0;

  for (const [symbol, tokenId] of Object.entries(MAINNET_TOKENS)) {
    try {
      console.log(`🪙 ${symbol.padEnd(8)} (${tokenId})...`);
      
      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(adapterAccountId)
        .setTokenIds([TokenId.fromString(tokenId)])  // Use TokenId, not AccountId
        .freezeWith(client)
        .sign(operatorKey);

      const associateSubmit = await associateTx.execute(client);
      const receipt = await associateSubmit.getReceipt(client);
      
      console.log(`   ✅ Associated successfully`);
      successCount++;
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Association Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${Object.keys(MAINNET_TOKENS).length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (successCount > 0) {
    console.log('✅ Tokens associated! Now you can:');
    console.log('   1. Register adapter: npx tsx scripts/configure-adapter-mainnet.ts');
    console.log('   2. Test swaps! 🎊\n');
  }

  client.close();
}

associateTokens().catch(console.error);
