/**
 * Script to associate ALL SaucerSwap tokens to the adapter
 * This ensures any token pair can be swapped without manual intervention
 * 
 * Usage: npx tsx scripts/associate-all-saucerswap-tokens.ts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TokenId,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const ADAPTER_CONTRACT_ID = '0.0.10086914';
const SAUCERSWAP_API = 'https://api.saucerswap.finance/tokens';

interface SaucerSwapToken {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  dueDiligenceComplete: boolean;
  isFeeOnTransferToken: boolean;
  price?: number;
}

async function fetchSaucerSwapTokens(): Promise<SaucerSwapToken[]> {
  console.log('📡 Fetching tokens from SaucerSwap API...');
  const response = await axios.get(SAUCERSWAP_API);
  console.log(`   ✅ Found ${response.data.length} tokens\n`);
  return response.data;
}

async function associateAllTokens() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  const adapterAccountId = AccountId.fromString(ADAPTER_CONTRACT_ID);

  console.log('🔗 Associating ALL SaucerSwap tokens to adapter...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Operator:', operatorId.toString());
  console.log('   Adapter:', ADAPTER_CONTRACT_ID);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Fetch all tokens from SaucerSwap
    const tokens = await fetchSaucerSwapTokens();
    
    // Filter valid tokens (have proper ID format)
    const validTokens = tokens.filter(t => {
      try {
        TokenId.fromString(t.id);
        return true;
      } catch {
        return false;
      }
    });

    console.log(`📋 Valid tokens to associate: ${validTokens.length}\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // Associate tokens in batches of 10 (Hedera limit)
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
      const batch = validTokens.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(validTokens.length / BATCH_SIZE);
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (tokens ${i + 1}-${Math.min(i + BATCH_SIZE, validTokens.length)})`);
      
      const tokenIds = batch.map(t => TokenId.fromString(t.id));
      
      try {
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(adapterAccountId)
          .setTokenIds(tokenIds)
          .freezeWith(client)
          .sign(operatorKey);

        const associateSubmit = await associateTx.execute(client);
        const receipt = await associateSubmit.getReceipt(client);
        
        console.log(`   ✅ Batch associated successfully`);
        batch.forEach(t => console.log(`      • ${t.symbol.padEnd(12)} ${t.id}`));
        successCount += batch.length;
      } catch (error: any) {
        if (error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          console.log(`   ⏭️  Already associated, skipping batch`);
          batch.forEach(t => console.log(`      ○ ${t.symbol.padEnd(12)} ${t.id}`));
          skippedCount += batch.length;
        } else {
          console.log(`   ❌ Batch failed: ${error.message}`);
          batch.forEach(t => console.log(`      ✗ ${t.symbol.padEnd(12)} ${t.id}`));
          failCount += batch.length;
        }
      }
      
      console.log('');
      
      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < validTokens.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Association Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped (already associated): ${skippedCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${validTokens.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (successCount + skippedCount > 0) {
      console.log('✅ Adapter ready! All SaucerSwap tokens can now be swapped!');
      console.log('   Next: Register adapter and test swaps 🎊\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    client.close();
  }
}

associateAllTokens().catch(console.error);
