/**
 * Test script to verify token association backend logic
 * Uses FREE Mirror Node API - NO HBAR COST!
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID || '0.0.10086948';
const ADAPTER_CONTRACT_ID = '0.0.10087266'; // SaucerSwapV2_V5 (the correct one - hardcoded for now)
const VALIDATION_CLOUD_BASE_URL = process.env.NEXT_PUBLIC_VALIDATION_CLOUD_BASE_URL || 'https://mainnet.hedera.validationcloud.io/v1';
const VALIDATION_CLOUD_API_KEY = process.env.VALIDATION_CLOUD_API_KEY;

// Test scenarios
const TEST_SCENARIOS = {
  'V2 Direct: HBAR → USDC': ['0.0.1456986', '0.0.456858'], // WHBAR, USDC
  'V2 Direct: HBAR → USDC[hts]': ['0.0.1456986', '0.0.1055459'], // WHBAR, USDC[hts]
  'V1 Multi-hop: HBAR → USDC[hts]': ['0.0.1456986', '0.0.834116', '0.0.1055483', '0.0.1055459'], // WHBAR, HBARX, WBTC[hts], USDC[hts]
  'V2 Direct: USDC → SAUCE': ['0.0.456858', '0.0.731861'], // USDC, SAUCE
};

/**
 * Check token associations using FREE Validation Cloud Mirror Node API
 */
async function checkTokenAssociations(
  accountId: string,
  tokenIds: string[]
): Promise<Map<string, boolean>> {
  const associations = new Map<string, boolean>();

  try {
    if (!VALIDATION_CLOUD_API_KEY) {
      throw new Error('VALIDATION_CLOUD_API_KEY is not configured');
    }

    // API key goes in the URL: /v1/{apiKey}/api/v1/accounts/...
    const baseUrlWithKey = `${VALIDATION_CLOUD_BASE_URL}/${VALIDATION_CLOUD_API_KEY}`;
    const url = `${baseUrlWithKey}/api/v1/accounts/${accountId}/tokens?limit=100`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status}`);
    }

    const data = await response.json();

    // Get list of associated token IDs
    const associatedTokenIds = new Set(
      (data.tokens || []).map((token: any) => token.token_id)
    );

    // Check each requested token
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
  const exchangeAssociations = await checkTokenAssociations(EXCHANGE_CONTRACT_ID, tokenIds);

  let exchangeMissing = 0;
  for (const [tokenId, isAssociated] of exchangeAssociations) {
    const status = isAssociated ? '✅' : '❌';
    console.log(`   ${status} ${tokenId}`);
    if (!isAssociated) exchangeMissing++;
  }

  // Check Adapter
  console.log('\n🔧 Checking Adapter (0.0.10087266)...');
  const adapterAssociations = await checkTokenAssociations(ADAPTER_CONTRACT_ID, tokenIds);

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
  console.log('\n💎 FREE Token Association Verification (No HBAR Cost!)');
  console.log('='.repeat(70));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 Network: mainnet`);
  console.log(`📦 Exchange: ${EXCHANGE_CONTRACT_ID}`);
  console.log(`🔧 Adapter: ${ADAPTER_CONTRACT_ID} (SaucerSwapV2_V5)`);
  console.log(`🔗 Validation Cloud: ${VALIDATION_CLOUD_BASE_URL}`);
  console.log(`🔑 API Key: ${VALIDATION_CLOUD_API_KEY ? 'Configured ✅' : '❌ Not configured'}`);
  console.log(`🆓 Using FREE Validation Cloud API - No wallet charges!`);
  console.log('='.repeat(70));

  try {
    // Test each scenario
    for (const [scenarioName, tokenIds] of Object.entries(TEST_SCENARIOS)) {
      await testScenario(scenarioName, tokenIds);

      // Small delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✨ All scenarios tested!');
    console.log('='.repeat(70));
    console.log();
    console.log('💡 Key Findings:');
    console.log('   1. If all scenarios show ✅, no new associations needed');
    console.log('   2. If you see ❌, those tokens will auto-associate on next swap');
    console.log('   3. You only pay for NEW associations (~0.05 HBAR each)');
    console.log('   4. ✅ This script uses FREE Mirror Node API - $0 cost!');
    console.log();

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  }
}

main().catch(console.error);
