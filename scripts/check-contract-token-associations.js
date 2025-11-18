/**
 * Script to check token associations for Exchange and Adapter contracts
 * 
 * This script:
 * 1. Fetches all tokens from /api/tokens endpoint (available for swaps)
 * 2. Checks token associations for Exchange contract
 * 3. Checks token associations for both Adapter contracts
 * 4. Compares and reports differences
 */

require('dotenv').config({ path: '.env.local' });

const VALIDATION_CLOUD_BASE_URL = 'https://mainnet.hedera.validationcloud.io/v1';
const VALIDATION_CLOUD_API_KEY = process.env.VALIDATION_CLOUD_API_KEY;

// Contract addresses from your .env.local
const EXCHANGE_HEDERA_ID = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID;
const ADAPTER_1_HEDERA_ID = process.env.SAUCERSWAP_V2_ADAPTER_EXACT_ID || process.env.SAUCERSWAP_V2_ADAPTER_ID;
const ADAPTER_2_HEDERA_ID = process.env.SAUCERSWAP_V1_ADAPTER_ID;

// API endpoint for tokens
const TOKENS_API = 'https://api.etaswap.com/v1/tokens';

/**
 * Fetch account info from Hedera Mirror Node
 */
async function fetchAccountInfo(accountId) {
  if (!VALIDATION_CLOUD_API_KEY) {
    throw new Error('VALIDATION_CLOUD_API_KEY not configured');
  }

  const baseUrlWithKey = `${VALIDATION_CLOUD_BASE_URL}/${VALIDATION_CLOUD_API_KEY}`;
  const url = `${baseUrlWithKey}/api/v1/accounts/${accountId}?limit=100&transactions=false`;
  
  console.log(`🔍 Fetching info for account: ${accountId}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Mirror Node API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract associated tokens from balance.tokens
  const associatedTokens = data.balance?.tokens?.map(token => token.token_id) || [];
  
  return {
    accountId,
    associatedTokens,
    tokenCount: associatedTokens.length
  };
}

/**
 * Fetch all available tokens from API
 */
async function fetchAvailableTokens() {
  console.log(`🔍 Fetching available tokens from API...`);
  
  const response = await fetch(TOKENS_API);
  
  if (!response.ok) {
    throw new Error(`Tokens API error: ${response.status}`);
  }

  const tokens = await response.json();
  
  // Extract token IDs (filter out HBAR as it doesn't need association)
  // The API uses 'address' field for Hedera ID (format: 0.0.XXXX)
  const tokenIds = tokens
    .filter(token => token.address && token.address !== '') // HBAR has empty address
    .map(token => token.address);
  
  return {
    tokens,
    tokenIds,
    count: tokenIds.length,
    totalWithHBAR: tokens.length
  };
}

/**
 * Compare associations and find missing tokens
 */
function compareAssociations(contractName, contractTokens, availableTokens) {
  const contractSet = new Set(contractTokens);
  const availableSet = new Set(availableTokens);
  
  const missing = availableTokens.filter(token => !contractSet.has(token));
  const extra = contractTokens.filter(token => !availableSet.has(token));
  
  return {
    contractName,
    totalAssociated: contractTokens.length,
    totalAvailable: availableTokens.length,
    missing,
    extra,
    missingCount: missing.length,
    extraCount: extra.length,
    coverage: ((contractTokens.length / availableTokens.length) * 100).toFixed(2)
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║    Contract Token Association Analysis                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Validate configuration
  if (!VALIDATION_CLOUD_API_KEY) {
    console.error('❌ ERROR: VALIDATION_CLOUD_API_KEY not configured in .env.local');
    process.exit(1);
  }

  if (!EXCHANGE_HEDERA_ID) {
    console.error('❌ ERROR: NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID not configured in .env.local');
    process.exit(1);
  }

  if (!ADAPTER_1_HEDERA_ID) {
    console.error('❌ ERROR: SAUCERSWAP_V2_ADAPTER_EXACT_ID or SAUCERSWAP_V2_ADAPTER_ID not configured in .env.local');
    process.exit(1);
  }

  if (!ADAPTER_2_HEDERA_ID) {
    console.error('❌ ERROR: SAUCERSWAP_V1_ADAPTER_ID not configured in .env.local');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Exchange:    ${EXCHANGE_HEDERA_ID}`);
  console.log(`   Adapter 1:   ${ADAPTER_1_HEDERA_ID} (SaucerSwap V2)`);
  console.log(`   Adapter 2:   ${ADAPTER_2_HEDERA_ID} (SaucerSwap V1)`);
  console.log('');

  try {
    // Step 1: Fetch available tokens
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: Fetching Available Tokens');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const availableTokensData = await fetchAvailableTokens();
    console.log(`✅ Found ${availableTokensData.totalWithHBAR} tokens total (${availableTokensData.count} HTS tokens + HBAR)`);
    console.log('');

    // Step 2: Fetch contract associations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Checking Contract Token Associations');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [exchangeInfo, adapter1Info, adapter2Info] = await Promise.all([
      fetchAccountInfo(EXCHANGE_HEDERA_ID),
      fetchAccountInfo(ADAPTER_1_HEDERA_ID),
      fetchAccountInfo(ADAPTER_2_HEDERA_ID)
    ]);

    console.log(`✅ Exchange has ${exchangeInfo.tokenCount} tokens associated`);
    console.log(`✅ Adapter 1 (SaucerSwap V2) has ${adapter1Info.tokenCount} tokens associated`);
    console.log(`✅ Adapter 2 (SaucerSwap V1) has ${adapter2Info.tokenCount} tokens associated`);
    console.log('');

    // Step 3: Compare and analyze
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 3: Analysis & Comparison');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const exchangeComparison = compareAssociations(
      'Exchange',
      exchangeInfo.associatedTokens,
      availableTokensData.tokenIds
    );

    const adapter1Comparison = compareAssociations(
      'Adapter 1 (SaucerSwap V2)',
      adapter1Info.associatedTokens,
      availableTokensData.tokenIds
    );

    const adapter2Comparison = compareAssociations(
      'Adapter 2 (SaucerSwap V1)',
      adapter2Info.associatedTokens,
      availableTokensData.tokenIds
    );

    // Display results
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    EXCHANGE CONTRACT                        │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  Associated Tokens:  ${exchangeComparison.totalAssociated}`);
    console.log(`  Available Tokens:   ${exchangeComparison.totalAvailable}`);
    console.log(`  Coverage:           ${exchangeComparison.coverage}%`);
    console.log(`  Missing Tokens:     ${exchangeComparison.missingCount}`);
    console.log(`  Extra Tokens:       ${exchangeComparison.extraCount}`);
    
    if (exchangeComparison.missingCount > 0) {
      console.log('\n  ⚠️  Missing tokens:');
      exchangeComparison.missing.slice(0, 10).forEach(token => {
        console.log(`     - ${token}`);
      });
      if (exchangeComparison.missingCount > 10) {
        console.log(`     ... and ${exchangeComparison.missingCount - 10} more`);
      }
    }
    console.log('');

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│           ADAPTER 1 (SaucerSwap V2) CONTRACT                │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  Associated Tokens:  ${adapter1Comparison.totalAssociated}`);
    console.log(`  Available Tokens:   ${adapter1Comparison.totalAvailable}`);
    console.log(`  Coverage:           ${adapter1Comparison.coverage}%`);
    console.log(`  Missing Tokens:     ${adapter1Comparison.missingCount}`);
    console.log(`  Extra Tokens:       ${adapter1Comparison.extraCount}`);
    
    if (adapter1Comparison.missingCount > 0) {
      console.log('\n  ⚠️  Missing tokens:');
      adapter1Comparison.missing.slice(0, 10).forEach(token => {
        console.log(`     - ${token}`);
      });
      if (adapter1Comparison.missingCount > 10) {
        console.log(`     ... and ${adapter1Comparison.missingCount - 10} more`);
      }
    }
    console.log('');

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│           ADAPTER 2 (SaucerSwap V1) CONTRACT                │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`  Associated Tokens:  ${adapter2Comparison.totalAssociated}`);
    console.log(`  Available Tokens:   ${adapter2Comparison.totalAvailable}`);
    console.log(`  Coverage:           ${adapter2Comparison.coverage}%`);
    console.log(`  Missing Tokens:     ${adapter2Comparison.missingCount}`);
    console.log(`  Extra Tokens:       ${adapter2Comparison.extraCount}`);
    
    if (adapter2Comparison.missingCount > 0) {
      console.log('\n  ⚠️  Missing tokens:');
      adapter2Comparison.missing.slice(0, 10).forEach(token => {
        console.log(`     - ${token}`);
      });
      if (adapter2Comparison.missingCount > 10) {
        console.log(`     ... and ${adapter2Comparison.missingCount - 10} more`);
      }
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 AVAILABLE TOKENS (from API):');
    console.log(`   Total HTS Tokens: ${availableTokensData.count}`);
    console.log('');

    console.log('📋 CONTRACT STATUS:\n');

    // Exchange Summary
    console.log('   🔹 EXCHANGE CONTRACT (0.0.10086948):');
    console.log(`      ✅ Associated:  ${exchangeComparison.totalAssociated} tokens`);
    console.log(`      ❌ Missing:     ${exchangeComparison.missingCount} tokens`);
    console.log(`      📈 Coverage:    ${exchangeComparison.coverage}%`);
    console.log('');

    // Adapter 1 Summary
    console.log('   🔹 ADAPTER 1 - SaucerSwap V2 (0.0.10087551):');
    console.log(`      ✅ Associated:  ${adapter1Comparison.totalAssociated} tokens`);
    console.log(`      ❌ Missing:     ${adapter1Comparison.missingCount} tokens`);
    console.log(`      📈 Coverage:    ${adapter1Comparison.coverage}%`);
    console.log('');

    // Adapter 2 Summary
    console.log('   🔹 ADAPTER 2 - SaucerSwap V1 (0.0.10087830):');
    console.log(`      ✅ Associated:  ${adapter2Comparison.totalAssociated} tokens`);
    console.log(`      ❌ Missing:     ${adapter2Comparison.missingCount} tokens`);
    console.log(`      📈 Coverage:    ${adapter2Comparison.coverage}%`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allMissing = new Set([
      ...exchangeComparison.missing,
      ...adapter1Comparison.missing,
      ...adapter2Comparison.missing
    ]);

    if (allMissing.size === 0) {
      console.log('\n✅ All contracts have all required tokens associated!\n');
    } else {
      console.log('\n⚠️  PENDING ASSOCIATIONS:\n');
      console.log(`   Total unique tokens to associate: ${allMissing.size}`);
      console.log('');
      
      // Show which tokens are missing in which contracts
      const missingInAll = exchangeComparison.missing.filter(token => 
        adapter1Comparison.missing.includes(token) && 
        adapter2Comparison.missing.includes(token)
      );
      
      const missingInExchangeOnly = exchangeComparison.missing.filter(token =>
        !adapter1Comparison.missing.includes(token) ||
        !adapter2Comparison.missing.includes(token)
      );

      const missingInAdaptersOnly = Array.from(allMissing).filter(token =>
        !exchangeComparison.missing.includes(token)
      );

      console.log(`   📌 Missing in ALL 3 contracts:     ${missingInAll.length} tokens`);
      console.log(`   📌 Missing in Exchange only:       ${missingInExchangeOnly.length} tokens`);
      console.log(`   📌 Missing in Adapters only:       ${missingInAdaptersOnly.length} tokens`);
      
      console.log('\n   💡 Tip: Run association scripts to add missing tokens to contracts');
      
      // Cost calculation
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💰 COST ESTIMATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const ASSOCIATION_COST_USD = 0.0506; // Cost per token association in USD
      
      // Calculate total associations needed
      const exchangeAssociations = exchangeComparison.missingCount;
      const adapter1Associations = adapter1Comparison.missingCount;
      const adapter2Associations = adapter2Comparison.missingCount;
      const totalAssociations = exchangeAssociations + adapter1Associations + adapter2Associations;
      
      // Calculate costs
      const exchangeCost = exchangeAssociations * ASSOCIATION_COST_USD;
      const adapter1Cost = adapter1Associations * ASSOCIATION_COST_USD;
      const adapter2Cost = adapter2Associations * ASSOCIATION_COST_USD;
      const totalCost = totalAssociations * ASSOCIATION_COST_USD;
      
      console.log('   Association Cost: $0.0506 per token\n');
      console.log('   📊 Cost Breakdown:\n');
      console.log(`      Exchange Contract:          ${exchangeAssociations.toLocaleString()} associations × $0.0506 = $${exchangeCost.toFixed(2)}`);
      console.log(`      Adapter 1 (SaucerSwap V2):  ${adapter1Associations.toLocaleString()} associations × $0.0506 = $${adapter1Cost.toFixed(2)}`);
      console.log(`      Adapter 2 (SaucerSwap V1):  ${adapter2Associations.toLocaleString()} associations × $0.0506 = $${adapter2Cost.toFixed(2)}`);
      console.log('      ─────────────────────────────────────────────────────────');
      console.log(`      TOTAL:                      ${totalAssociations.toLocaleString()} associations × $0.0506 = $${totalCost.toFixed(2)}`);
      console.log('');
      console.log(`   💵 Total estimated cost to associate all missing tokens: $${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
