/**
 * Test script to verify token association backend logic
 * Simulates what happens when a swap is executed
 */

import {
  Client,
  AccountId,
  PrivateKey,
  AccountInfoQuery,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086948';
const ADAPTER_CONTRACT_ID = '0.0.10087266'; // SaucerSwapV2_V5 (the correct one)

// Test scenarios
const TEST_SCENARIOS = {
  'V2 Direct: HBAR → USDC': ['0.0.1456986', '0.0.456858'], // WHBAR, USDC
  'V2 Direct: HBAR → USDC[hts]': ['0.0.1456986', '0.0.1055459'], // WHBAR, USDC[hts]
  'V1 Multi-hop: HBAR → USDC[hts]': ['0.0.1456986', '0.0.834116', '0.0.1055483', '0.0.1055459'], // WHBAR, HBARX, WBTC[hts], USDC[hts]
  'V2 Direct: USDC → SAUCE': ['0.0.456858', '0.0.731861'], // USDC, SAUCE
};

async function checkTokenAssociations(
  client: Client,
  contractAccountId: AccountId,
  tokenIds: string[]
): Promise<Map<string, boolean>> {
  const associations = new Map<string, boolean>();

  try {
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(contractAccountId)
      .execute(client);

    const associatedTokens = accountInfo.tokenRelationships;
    const associatedTokenIds = new Set(
      Array.from(associatedTokens.keys()).map(tokenId => tokenId.toString())
    );

    for (const tokenId of tokenIds) {
      associations.set(tokenId, associatedTokenIds.has(tokenId));
    }
  } catch (error: any) {
    console.error(`❌ Error checking associations: ${error.message}`);
    for (const tokenId of tokenIds) {
      associations.set(tokenId, false);
    }
  }

  return associations;
}

async function testScenario(
  client: Client,
  scenarioName: string,
  tokenIds: string[]
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing: ${scenarioName}`);
  console.log('='.repeat(70));
  console.log(`Tokens needed: ${tokenIds.join(', ')}`);
  console.log();

  // Check Exchange
  console.log('📦 Checking Exchange (0.0.10086948)...');
  const exchangeId = AccountId.fromString(EXCHANGE_CONTRACT_ID);
  const exchangeAssociations = await checkTokenAssociations(client, exchangeId, tokenIds);

  let exchangeMissing = 0;
  for (const [tokenId, isAssociated] of exchangeAssociations) {
    const status = isAssociated ? '✅' : '❌';
    console.log(`   ${status} ${tokenId}`);
    if (!isAssociated) exchangeMissing++;
  }

  // Check Adapter
  console.log('\n🔧 Checking Adapter (0.0.10087266)...');
  const adapterId = AccountId.fromString(ADAPTER_CONTRACT_ID);
  const adapterAssociations = await checkTokenAssociations(client, adapterId, tokenIds);

  let adapterMissing = 0;
  for (const [tokenId, isAssociated] of adapterAssociations) {
    const status = isAssociated ? '✅' : '❌';
    console.log(`   ${status} ${tokenId}`);
    if (!isAssociated) adapterMissing++;
  }

  // Summary
  console.log();
  console.log('📊 Summary:');
  if (exchangeMissing === 0 && adapterMissing === 0) {
    console.log('   ✅ ALL TOKENS READY - Swap would NOT require any new associations');
    console.log('   💰 Cost: ~0 HBAR (only swap fees)');
  } else {
    console.log(`   ⚠️  MISSING TOKENS - Would need to associate ${exchangeMissing + adapterMissing} token(s)`);
    console.log(`   💰 Cost: ~${((exchangeMissing + adapterMissing) * 0.05).toFixed(2)} HBAR for associations + swap fees`);

    if (exchangeMissing > 0) {
      console.log(`      - Exchange needs ${exchangeMissing} token(s) (~${(exchangeMissing * 0.05).toFixed(2)} HBAR)`);
    }
    if (adapterMissing > 0) {
      console.log(`      - Adapter needs ${adapterMissing} token(s) (~${(adapterMissing * 0.05).toFixed(2)} HBAR)`);
    }
  }
}

async function main() {
  console.log('\n🔍 Token Association Backend Verification');
  console.log('='.repeat(70));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 Network: mainnet`);
  console.log(`📦 Exchange: ${EXCHANGE_CONTRACT_ID}`);
  console.log(`🔧 Adapter: ${ADAPTER_CONTRACT_ID} (SaucerSwapV2_V5)`);
  console.log('='.repeat(70));

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  try {
    // Test each scenario
    for (const [scenarioName, tokenIds] of Object.entries(TEST_SCENARIOS)) {
      await testScenario(client, scenarioName, tokenIds);

      // Small delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✨ All scenarios tested!');
    console.log('='.repeat(70));
    console.log();
    console.log('💡 Key Findings:');
    console.log('   1. If all scenarios show ✅, your backend is working correctly');
    console.log('   2. If you see ❌, those tokens need to be associated before swap');
    console.log('   3. The backend SHOULD auto-associate missing tokens');
    console.log('   4. You only pay for NEW associations, not re-checks');
    console.log();

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

main().catch(console.error);
