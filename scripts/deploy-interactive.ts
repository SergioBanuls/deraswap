#!/usr/bin/env node

/**
 * Interactive Deployment Assistant
 * 
 * Guides you through the deployment process step by step
 * 
 * Usage: npx tsx scripts/deploy-interactive.ts
 */

import * as readline from 'readline';
import { execSync } from 'child_process';
import * as fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command: string) {
  console.log(`\n💻 Running: ${command}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('\n❌ Command failed');
    return false;
  }
}

async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║     🚀 DERASWAP - INTERACTIVE DEPLOYMENT ASSISTANT 🚀      ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('This wizard will guide you through deploying your contracts to Hedera Mainnet.\n');
  console.log('⚠️  IMPORTANT: Make sure you have:');
  console.log('   - At least 50 HBAR in your mainnet account');
  console.log('   - HEDERA_ACCOUNT_ID and PRIVATE_KEY in .env.local');
  console.log('   - Compiled contracts (npx hardhat compile)\n');

  const proceed = await question('Ready to proceed? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes') {
    console.log('\n👋 Deployment cancelled. Come back when you\'re ready!');
    rl.close();
    return;
  }

  // Step 1: Pre-deployment check
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: PRE-DEPLOYMENT CHECK');
  console.log('='.repeat(60));
  
  const runCheck = await question('\nRun pre-deployment checks? (yes/no): ');
  if (runCheck.toLowerCase() === 'yes') {
    const success = exec('npx tsx scripts/pre-deployment-check.ts');
    if (!success) {
      console.log('\n❌ Pre-deployment checks failed. Please fix the issues and try again.');
      rl.close();
      return;
    }
  }

  const continueAfterCheck = await question('\nContinue with deployment? (yes/no): ');
  if (continueAfterCheck.toLowerCase() !== 'yes') {
    console.log('\n👋 Deployment cancelled.');
    rl.close();
    return;
  }

  // Step 2: Deploy Exchange
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: DEPLOY EXCHANGE CONTRACT');
  console.log('='.repeat(60));
  console.log('\nThis will deploy the Exchange contract to mainnet.');
  console.log('Cost: ~15-20 HBAR\n');

  const deployExchange = await question('Deploy Exchange contract? (yes/no): ');
  if (deployExchange.toLowerCase() === 'yes') {
    const success = exec('npx tsx scripts/deploy-mainnet-exchange.ts');
    if (!success) {
      console.log('\n❌ Exchange deployment failed.');
      rl.close();
      return;
    }
  } else {
    console.log('\n⚠️  Skipping Exchange deployment.');
  }

  const exchangeId = await question('\n📝 Enter the Exchange Contract ID (0.0.XXXXXX): ');
  console.log(`✅ Exchange Contract ID saved: ${exchangeId}`);

  // Step 3: Deploy Adapter
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: DEPLOY ADAPTER CONTRACT');
  console.log('='.repeat(60));
  console.log('\nThis will deploy the SaucerSwapV2Adapter contract.');
  console.log('Cost: ~20-25 HBAR\n');

  const deployAdapter = await question('Deploy Adapter contract? (yes/no): ');
  if (deployAdapter.toLowerCase() === 'yes') {
    const success = exec('npx tsx scripts/deploy-mainnet-adapter.ts');
    if (!success) {
      console.log('\n❌ Adapter deployment failed.');
      rl.close();
      return;
    }
  } else {
    console.log('\n⚠️  Skipping Adapter deployment.');
  }

  const adapterId = await question('\n📝 Enter the Adapter Contract ID (0.0.XXXXXX): ');
  console.log(`✅ Adapter Contract ID saved: ${adapterId}`);

  // Step 4: Update configure script
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: CONFIGURE ADAPTER');
  console.log('='.repeat(60));
  
  console.log(`\n📝 Updating configure-adapter-mainnet.ts...`);
  
  try {
    const configPath = './scripts/configure-adapter-mainnet.ts';
    let content = fs.readFileSync(configPath, 'utf8');
    
    content = content.replace(
      /const EXCHANGE_CONTRACT_ID = '0\.0\.\w+';/,
      `const EXCHANGE_CONTRACT_ID = '${exchangeId}';`
    );
    
    content = content.replace(
      /const ADAPTER_CONTRACT_ID = '0\.0\.\w+';/,
      `const ADAPTER_CONTRACT_ID = '${adapterId}';`
    );
    
    fs.writeFileSync(configPath, content);
    console.log('✅ File updated successfully!');
  } catch (error) {
    console.log('❌ Error updating file. Please update manually.');
  }

  console.log('\nThis will register the Adapter in the Exchange contract.');
  console.log('Cost: ~2-3 HBAR\n');

  const configure = await question('Configure adapter now? (yes/no): ');
  if (configure.toLowerCase() === 'yes') {
    const success = exec('npx tsx scripts/configure-adapter-mainnet.ts');
    if (!success) {
      console.log('\n❌ Adapter configuration failed.');
      rl.close();
      return;
    }
  }

  // Step 5: Update .env.local
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: UPDATE ENVIRONMENT VARIABLES');
  console.log('='.repeat(60));

  const updateEnv = await question('\nUpdate .env.local with new contract IDs? (yes/no): ');
  if (updateEnv.toLowerCase() === 'yes') {
    try {
      const envPath = '.env.local';
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Convert exchange ID to EVM address
      const exchangeNum = exchangeId.split('.')[2];
      const exchangeEvmAddress = '0x' + parseInt(exchangeNum).toString(16).padStart(40, '0');
      
      // Update or add variables
      const updates = {
        'NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID': exchangeId,
        'NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS': exchangeEvmAddress,
        'NEXT_PUBLIC_HEDERA_NETWORK': 'mainnet',
        'NEXT_PUBLIC_SWAP_ROUTER_TYPE': 'custom'
      };
      
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env.local updated successfully!');
    } catch (error) {
      console.log('❌ Error updating .env.local. Please update manually.');
    }
  }

  // Step 6: Verify
  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: VERIFY DEPLOYMENT');
  console.log('='.repeat(60));

  const verify = await question('\nVerify deployed contracts? (yes/no): ');
  if (verify.toLowerCase() === 'yes') {
    console.log('\n📊 Exchange Contract Info:');
    exec(`npx tsx scripts/get-contract-info.ts mainnet ${exchangeId}`);
    
    console.log('\n📊 Adapter Contract Info:');
    exec(`npx tsx scripts/get-contract-info.ts mainnet ${adapterId}`);
  }

  // Final summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('═'.repeat(60));
  console.log('\n📋 Summary:');
  console.log(`   Exchange Contract: ${exchangeId}`);
  console.log(`   Adapter Contract:  ${adapterId}`);
  console.log(`   Network: Mainnet`);
  console.log('\n🔗 View on HashScan:');
  console.log(`   Exchange: https://hashscan.io/mainnet/contract/${exchangeId}`);
  console.log(`   Adapter:  https://hashscan.io/mainnet/contract/${adapterId}`);
  console.log('\n📚 Next steps:');
  console.log('   1. Start dev server: pnpm dev');
  console.log('   2. Open http://localhost:3000');
  console.log('   3. Switch to mainnet in NetworkSwitcher');
  console.log('   4. Connect your wallet');
  console.log('   5. Test a small swap!');
  console.log('\n📖 Documentation:');
  console.log('   - Post-deployment checklist: POST_DEPLOYMENT_CHECKLIST.md');
  console.log('   - Fee configuration: FEE_WALLET_CONFIG.md');
  console.log('   - Full package info: DEPLOYMENT_PACKAGE.md');
  console.log('\n✨ Your DEX is now live on Hedera Mainnet!');
  console.log('═'.repeat(60) + '\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
