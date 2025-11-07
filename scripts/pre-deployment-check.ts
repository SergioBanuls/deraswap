/**
 * Pre-deployment Checklist Script
 * 
 * Run this before deploying to mainnet to verify everything is ready
 * 
 * Usage: npx tsx scripts/pre-deployment-check.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Client, AccountId, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';

dotenv.config({ path: '.env.local' });

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
}

async function runChecks() {
  console.log('🔍 Running pre-deployment checks for MAINNET...\n');

  // Check 1: Environment variables
  console.log('1️⃣ Checking environment variables...');
  const hasAccountId = !!process.env.HEDERA_ACCOUNT_ID;
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  
  if (hasAccountId && hasPrivateKey) {
    addResult('Environment Variables', true, 'HEDERA_ACCOUNT_ID and PRIVATE_KEY are set');
  } else {
    addResult('Environment Variables', false, 'Missing HEDERA_ACCOUNT_ID or PRIVATE_KEY in .env.local');
    return; // Can't continue without these
  }

  // Check 2: Account balance
  console.log('2️⃣ Checking account balance...');
  try {
    const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
    const privateKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
    
    const client = Client.forMainnet();
    client.setOperator(accountId, privateKey);

    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    const hbarBalance = balance.hbars.toBigNumber().toNumber();
    
    if (hbarBalance >= 50) {
      addResult('Account Balance', true, `${hbarBalance.toFixed(2)} HBAR (sufficient for deployment)`);
    } else if (hbarBalance >= 30) {
      addResult('Account Balance', true, `${hbarBalance.toFixed(2)} HBAR (minimum met, but 50+ recommended)`);
    } else {
      addResult('Account Balance', false, `${hbarBalance.toFixed(2)} HBAR (need at least 30 HBAR, 50+ recommended)`);
    }

    client.close();
  } catch (error: any) {
    addResult('Account Balance', false, `Error checking balance: ${error.message}`);
  }

  // Check 3: Compiled contracts
  console.log('3️⃣ Checking compiled contracts...');
  const exchangePath = './artifacts/contracts/solidity/Exchange.sol/Exchange.json';
  const adapterPath = './artifacts/contracts/solidity/adapters/SaucerSwapV2Adapter.sol/SaucerSwapV2Adapter.json';
  
  const exchangeExists = fs.existsSync(exchangePath);
  const adapterExists = fs.existsSync(adapterPath);
  
  if (exchangeExists && adapterExists) {
    try {
      const exchangeJson = JSON.parse(fs.readFileSync(exchangePath, 'utf8'));
      const adapterJson = JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
      
      if (exchangeJson.bytecode && exchangeJson.bytecode !== '0x' &&
          adapterJson.bytecode && adapterJson.bytecode !== '0x') {
        addResult('Compiled Contracts', true, 'Exchange and Adapter contracts compiled');
      } else {
        addResult('Compiled Contracts', false, 'Contracts need compilation: npx hardhat compile');
      }
    } catch (error) {
      addResult('Compiled Contracts', false, 'Error reading contract files');
    }
  } else {
    addResult('Compiled Contracts', false, 'Contracts not found. Run: npx hardhat compile');
  }

  // Check 4: Network configuration
  console.log('4️⃣ Checking network configuration...');
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK;
  
  if (network === 'mainnet') {
    addResult('Network Config', true, 'Configured for mainnet');
  } else {
    addResult('Network Config', true, `Current: ${network || 'not set'} (will use NetworkSwitcher in UI)`);
  }

  // Check 5: Hardhat config
  console.log('5️⃣ Checking hardhat.config.ts...');
  if (fs.existsSync('./hardhat.config.ts')) {
    addResult('Hardhat Config', true, 'hardhat.config.ts exists');
  } else if (fs.existsSync('./hardhat.config.js')) {
    addResult('Hardhat Config', true, 'hardhat.config.js exists');
  } else {
    addResult('Hardhat Config', false, 'hardhat.config file not found');
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 PRE-DEPLOYMENT CHECKLIST RESULTS');
  console.log('='.repeat(70));
  
  let allPassed = true;
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (!result.passed) allPassed = false;
  });

  console.log('\n' + '='.repeat(70));
  
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED! You are ready to deploy to mainnet.');
    console.log('\n📋 Next steps:');
    console.log('1. npx tsx scripts/deploy-mainnet-exchange.ts');
    console.log('2. npx tsx scripts/deploy-mainnet-adapter.ts');
    console.log('3. Update configure-adapter-mainnet.ts with contract IDs');
    console.log('4. npx tsx scripts/configure-adapter-mainnet.ts');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  }
  
  console.log('='.repeat(70) + '\n');
}

runChecks().catch(console.error);
