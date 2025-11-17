/**
 * Script to associate critical tokens to Exchange and Adapter contracts
 * Includes USDC[hts] and other essential tokens
 *
 * Usage: npx tsx scripts/associate-critical-tokens.ts
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

// Current contract IDs
const EXCHANGE_CONTRACT_ID = '0.0.10086840';
const ADAPTER_CONTRACT_ID = '0.0.10086852';

// Critical tokens for swaps
const CRITICAL_TOKENS = {
  WHBAR: '0.0.1456986',        // WHBAR (new)
  USDC: '0.0.456858',          // USDC (normal)
  'USDC[hts]': '0.0.1055459',  // USDC[hts] - THE MISSING ONE!
  SAUCE: '0.0.731861',         // SAUCE
  'USDT[hts]': '0.0.1055472',  // USDT[hts]
  'WBTC[hts]': '0.0.1055483',  // WBTC[hts]
  'DAI[hts]': '0.0.1055477',   // DAI[hts]
  HBARX: '0.0.834116',         // HBARX
  KARATE: '0.0.2283230',       // KARATE
};

async function associateToContract(
  client: Client,
  operatorKey: PrivateKey,
  contractId: string,
  contractName: string,
  tokens: Record<string, string>
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔗 Associating tokens to ${contractName} (${contractId})`);
  console.log('='.repeat(60));

  const contractAccountId = AccountId.fromString(contractId);

  let successCount = 0;
  let failCount = 0;
  let alreadyAssociated = 0;

  for (const [symbol, tokenId] of Object.entries(tokens)) {
    try {
      console.log(`\n🪙 ${symbol.padEnd(15)} (${tokenId})`);

      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(contractAccountId)
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(client)
        .sign(operatorKey);

      const associateSubmit = await associateTx.execute(client);
      const receipt = await associateSubmit.getReceipt(client);

      console.log(`   ✅ Associated successfully`);
      console.log(`   📝 Receipt: ${receipt.status.toString()}`);
      successCount++;
    } catch (error: any) {
      const errorMsg = error.message || error.toString();

      if (errorMsg.includes('TOKEN_ALREADY_ASSOCIATED')) {
        console.log(`   ℹ️  Already associated (skipping)`);
        alreadyAssociated++;
      } else {
        console.log(`   ❌ Failed: ${errorMsg}`);
        failCount++;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${contractName} Summary:`);
  console.log(`   ✅ Newly Associated: ${successCount}`);
  console.log(`   ℹ️  Already Associated: ${alreadyAssociated}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${Object.keys(tokens).length}`);
  console.log('='.repeat(60));

  return { successCount, failCount, alreadyAssociated };
}

async function main() {
  console.log('\n🚀 Starting Token Association Process');
  console.log('=' .repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 Network: ${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet'}`);
  console.log(`👤 Operator: ${process.env.HEDERA_ACCOUNT_ID}`);
  console.log('='.repeat(60));

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  try {
    // Associate to Exchange
    const exchangeResults = await associateToContract(
      client,
      operatorKey,
      EXCHANGE_CONTRACT_ID,
      'Exchange',
      CRITICAL_TOKENS
    );

    // Associate to Adapter
    const adapterResults = await associateToContract(
      client,
      operatorKey,
      ADAPTER_CONTRACT_ID,
      'Adapter',
      CRITICAL_TOKENS
    );

    // Final Summary
    console.log(`\n\n${'🎊'.repeat(30)}`);
    console.log('🎉 FINAL SUMMARY');
    console.log('🎊'.repeat(30));
    console.log();
    console.log('Exchange:');
    console.log(`  ✅ New: ${exchangeResults.successCount}`);
    console.log(`  ℹ️  Existing: ${exchangeResults.alreadyAssociated}`);
    console.log(`  ❌ Failed: ${exchangeResults.failCount}`);
    console.log();
    console.log('Adapter:');
    console.log(`  ✅ New: ${adapterResults.successCount}`);
    console.log(`  ℹ️  Existing: ${adapterResults.alreadyAssociated}`);
    console.log(`  ❌ Failed: ${adapterResults.failCount}`);
    console.log();

    const totalSuccess = exchangeResults.successCount + adapterResults.successCount;
    const totalExisting = exchangeResults.alreadyAssociated + adapterResults.alreadyAssociated;
    const totalFailed = exchangeResults.failCount + adapterResults.failCount;

    if (totalSuccess > 0 || totalExisting > 0) {
      console.log('✅ Token association completed!');
      console.log();
      console.log('Next steps:');
      console.log('  1. Test HBAR → USDC[hts] swap');
      console.log('  2. Verify swap completes successfully');
      console.log('  3. Monitor for "Safe token transfer failed!" errors');
      console.log();
    }

    if (totalFailed > 0) {
      console.log('⚠️  Some associations failed - check the logs above');
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

main().catch(console.error);
