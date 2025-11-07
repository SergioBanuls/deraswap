/**
 * Contract Info Script
 * 
 * Gets information about deployed contracts
 * 
 * Usage: npx tsx scripts/get-contract-info.ts <NETWORK> <CONTRACT_ID>
 * Example: npx tsx scripts/get-contract-info.ts mainnet 0.0.1234567
 */

import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const network = process.argv[2] || 'mainnet';
const contractId = process.argv[3];

if (!contractId) {
  console.error('❌ Usage: npx tsx scripts/get-contract-info.ts <NETWORK> <CONTRACT_ID>');
  console.error('Example: npx tsx scripts/get-contract-info.ts mainnet 0.0.1234567');
  process.exit(1);
}

async function getContractInfo() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log(`🔍 Getting info for contract: ${contractId} on ${network}`);
  console.log('━'.repeat(70));

  try {
    // Try to get owner (works for both Exchange and Adapter)
    try {
      const ownerQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(50000)
        .setFunction('owner');

      const ownerResult = await ownerQuery.execute(client);
      const ownerAddress = ownerResult.getAddress(0);
      console.log('👤 Owner:', ownerAddress);
    } catch (e) {
      console.log('👤 Owner: [Unable to query]');
    }

    // Try to get adapter info (Exchange contract)
    try {
      const adapterQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction('adapters', new ContractFunctionParameters().addString('SaucerSwapV2'));

      const adapterResult = await adapterQuery.execute(client);
      const adapterAddress = adapterResult.getAddress(0);
      
      if (adapterAddress !== '0x0000000000000000000000000000000000000000') {
        console.log('🔌 Adapter (SaucerSwapV2):', adapterAddress);
        console.log('   Type: Exchange Contract');
      }
    } catch (e) {
      // Not an Exchange or adapter not set
    }

    // Try to get fee info (Adapter contract)
    try {
      const feeWalletQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(50000)
        .setFunction('feeWallet');

      const feeWalletResult = await feeWalletQuery.execute(client);
      const feeWallet = feeWalletResult.getAddress(0);
      
      console.log('💰 Fee Wallet:', feeWallet);

      const feePromilleQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(50000)
        .setFunction('feePromille');

      const feePromilleResult = await feePromilleQuery.execute(client);
      const feePromille = feePromilleResult.getUint8(0);
      
      console.log('💵 Fee:', (feePromille / 10).toFixed(1) + '%', `(${feePromille} promille)`);
      console.log('   Type: Adapter Contract');

      const routerQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(50000)
        .setFunction('router');

      const routerResult = await routerQuery.execute(client);
      const router = routerResult.getAddress(0);
      console.log('🔀 Router:', router);

    } catch (e) {
      // Not an Adapter
    }

    // Try to get paused status
    try {
      const pausedQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(50000)
        .setFunction('paused');

      const pausedResult = await pausedQuery.execute(client);
      const isPaused = pausedResult.getBool(0);
      console.log('⏸️  Paused:', isPaused ? '❌ YES' : '✅ NO');
    } catch (e) {
      // No paused function
    }

    console.log('━'.repeat(70));
    console.log(`\n🔗 View on HashScan: https://hashscan.io/${network}/contract/${contractId}`);

  } catch (error) {
    console.error('❌ Error getting contract info:', error);
  } finally {
    client.close();
  }
}

getContractInfo().catch(console.error);
