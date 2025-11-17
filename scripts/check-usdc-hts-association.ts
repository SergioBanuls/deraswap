/**
 * Check if USDC[hts] is associated with Exchange and Adapter
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086840';
const ADAPTER_CONTRACT_ID = '0.0.10086852';
const USDC_HTS_TOKEN_ID = '0.0.1055459'; // USDC[hts]
const USDC_NORMAL_TOKEN_ID = '0.0.456858'; // USDC (normal)

async function checkTokenAssociation(accountId: string, tokenId: string): Promise<boolean> {
  try {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'mainnet';
    const baseUrl = network === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com/api/v1'
      : 'https://testnet.mirrornode.hedera.com/api/v1';

    const url = `${baseUrl}/accounts/${accountId}/tokens`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Failed to fetch tokens for ${accountId}: ${response.status}`);
      return false;
    }

    const data = await response.json();
    const isAssociated = data.tokens?.some((token: any) => token.token_id === tokenId) || false;

    return isAssociated;
  } catch (error: any) {
    console.error(`❌ Error checking association: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking USDC[hts] Association with Contracts\n');
  console.log('=' .repeat(60));
  console.log('Token Information:');
  console.log(`  USDC[hts]:  ${USDC_HTS_TOKEN_ID}`);
  console.log(`  USDC:       ${USDC_NORMAL_TOKEN_ID}`);
  console.log('=' .repeat(60));
  console.log();

  // Check Exchange
  console.log('1️⃣ Checking Exchange Contract (0.0.10086840)');
  const exchangeHasUsdcHts = await checkTokenAssociation(EXCHANGE_CONTRACT_ID, USDC_HTS_TOKEN_ID);
  const exchangeHasUsdc = await checkTokenAssociation(EXCHANGE_CONTRACT_ID, USDC_NORMAL_TOKEN_ID);
  console.log(`   USDC[hts] associated: ${exchangeHasUsdcHts ? '✅ YES' : '❌ NO'}`);
  console.log(`   USDC associated:      ${exchangeHasUsdc ? '✅ YES' : '❌ NO'}`);
  console.log();

  // Check Adapter
  console.log('2️⃣ Checking Adapter Contract (0.0.10086852)');
  const adapterHasUsdcHts = await checkTokenAssociation(ADAPTER_CONTRACT_ID, USDC_HTS_TOKEN_ID);
  const adapterHasUsdc = await checkTokenAssociation(ADAPTER_CONTRACT_ID, USDC_NORMAL_TOKEN_ID);
  console.log(`   USDC[hts] associated: ${adapterHasUsdcHts ? '✅ YES' : '❌ NO'}`);
  console.log(`   USDC associated:      ${adapterHasUsdc ? '✅ YES' : '❌ NO'}`);
  console.log();

  // Summary
  console.log('=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));

  const allAssociated = exchangeHasUsdcHts && adapterHasUsdcHts;

  if (allAssociated) {
    console.log('✅ USDC[hts] is associated with both Exchange and Adapter');
  } else {
    console.log('❌ USDC[hts] is NOT associated with one or more contracts:');
    if (!exchangeHasUsdcHts) console.log('   - Missing from Exchange');
    if (!adapterHasUsdcHts) console.log('   - Missing from Adapter');
    console.log();
    console.log('💡 SOLUTION:');
    console.log('   Run the association script to add USDC[hts] to both contracts:');
    console.log(`   npx tsx scripts/associate-token-to-contracts.ts ${USDC_HTS_TOKEN_ID}`);
  }

  console.log('=' .repeat(60));
}

main().catch(console.error);
