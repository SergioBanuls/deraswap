/**
 * Script to associate HTS tokens (USDC[hts], USDT[hts], etc.) to the active Adapter
 *
 * Adapter: 0.0.10087266 (SaucerSwapV2_V5)
 *
 * Usage: npx tsx scripts/associate-hts-tokens-to-adapter.ts
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

// Active Adapter (SaucerSwapV2_V5)
const ADAPTER_CONTRACT_ID = '0.0.10087266';

// HTS tokens that need to be added
const HTS_TOKENS = {
  'USDC[hts]': '0.0.1055459',  // ⭐ THE MISSING ONE!
  'USDT[hts]': '0.0.1055472',
  'WBTC[hts]': '0.0.1055483',
  'DAI[hts]': '0.0.1055477',
  'WETH[hts]': '0.0.541564',
  'WMATIC[hts]': '0.0.540318',
  'DOV[hts]': '0.0.624505',
  'AAVE[hts]': '0.0.1055498',
};

async function main() {
  console.log('\n🚀 Associating HTS Tokens to Adapter');
  console.log('='.repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 Network: ${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'}`);
  console.log(`👤 Operator: ${process.env.HEDERA_ACCOUNT_ID}`);
  console.log(`🔧 Adapter: ${ADAPTER_CONTRACT_ID} (SaucerSwapV2_V5)`);
  console.log('='.repeat(60));
  console.log();

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  const adapterAccountId = AccountId.fromString(ADAPTER_CONTRACT_ID);

  let successCount = 0;
  let failCount = 0;
  let alreadyAssociated = 0;

  for (const [symbol, tokenId] of Object.entries(HTS_TOKENS)) {
    try {
      console.log(`\n🪙 ${symbol.padEnd(15)} (${tokenId})`);

      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(adapterAccountId)
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(client)
        .sign(operatorKey);

      const associateSubmit = await associateTx.execute(client);
      const receipt = await associateSubmit.getReceipt(client);

      console.log(`   ✅ Associated successfully!`);
      console.log(`   📝 Receipt: ${receipt.status.toString()}`);
      successCount++;
    } catch (error: any) {
      const errorMsg = error.message || error.toString();

      if (errorMsg.includes('TOKEN_ALREADY_ASSOCIATED')) {
        console.log(`   ℹ️  Already associated (skipping)`);
        alreadyAssociated++;
      } else if (errorMsg.includes('INVALID_SIGNATURE')) {
        console.log(`   ❌ INVALID_SIGNATURE - This adapter requires its admin key`);
        console.log(`   💡 You need to use the adapter's admin key, not the operator key`);
        failCount++;
      } else {
        console.log(`   ❌ Failed: ${errorMsg}`);
        failCount++;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Association Summary:');
  console.log(`   ✅ Newly Associated: ${successCount}`);
  console.log(`   ℹ️  Already Associated: ${alreadyAssociated}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${Object.keys(HTS_TOKENS).length}`);
  console.log('='.repeat(60));
  console.log();

  if (successCount > 0) {
    console.log('✅ HTS tokens associated! You can now swap:');
    console.log('   - HBAR → USDC[hts]');
    console.log('   - HBAR → USDT[hts]');
    console.log('   - And other HTS token pairs');
    console.log();
  }

  if (failCount > 0 && failCount === Object.keys(HTS_TOKENS).length) {
    console.log('⚠️  All associations failed with INVALID_SIGNATURE');
    console.log();
    console.log('💡 SOLUTION:');
    console.log('   The Adapter (0.0.10087266) was deployed with an admin key.');
    console.log('   You need to use that admin key to associate tokens.');
    console.log();
    console.log('   Check if you have the admin key in your .env.local:');
    console.log('   - ADAPTER_ADMIN_KEY=...');
    console.log();
  }

  client.close();
}

main().catch(console.error);
