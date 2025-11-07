/**
 * Script to configure SaucerSwapV2 adapter in Exchange contract (MAINNET)
 * 
 * This script calls setAdapter() on the Exchange contract to register
 * the deployed adapter contract.
 * 
 * Prerequisites:
 * 1. Deploy Exchange contract (deploy-mainnet-exchange.ts)
 * 2. Deploy Adapter contract (deploy-mainnet-adapter.ts)
 * 3. Update EXCHANGE_CONTRACT_ID and ADAPTER_CONTRACT_ID below
 * 
 * Usage: npx tsx scripts/configure-adapter-mainnet.ts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 🔥 UPDATE THESE AFTER DEPLOYMENT
const EXCHANGE_CONTRACT_ID = '0.0.10086948'; // NEW Exchange with admin key
const ADAPTER_CONTRACT_ID = '0.0.10087279';  // v6: Accumulate HBAR fees (withdraw later)
const ADAPTER_NAME = 'SaucerSwapV2_V6'; // v6 with accumulated fees

async function configureAdapter() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔧 Configuring adapter in Exchange contract (MAINNET)...');
  console.log('Exchange:', EXCHANGE_CONTRACT_ID);
  console.log('Adapter:', ADAPTER_CONTRACT_ID);
  console.log('Adapter Name:', ADAPTER_NAME);

  try {
    // DO NOT remove adapter first - once removed, it can't be re-added (adapterRemoved flag)
    console.log('\n1️⃣ Setting adapter...');
    const params = new ContractFunctionParameters()
      .addString(ADAPTER_NAME)
      .addAddress(`0x${parseInt(ADAPTER_CONTRACT_ID.split('.')[2]).toString(16).padStart(40, '0')}`);

    // Execute setAdapter transaction
    const tx = await new ContractExecuteTransaction()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(200000)
      .setFunction('setAdapter', params)
      .setMaxTransactionFee(new Hbar(5))
      .execute(client);

    const receipt = await tx.getReceipt(client);
    
    console.log('✅ Adapter configured successfully!');
    console.log('Transaction ID:', tx.transactionId.toString());
    console.log('Status:', receipt.status.toString());

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Final steps:');
    console.log('1. Update .env.local with:');
    console.log(`   NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=${EXCHANGE_CONTRACT_ID}`);
    console.log(`   NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x${parseInt(EXCHANGE_CONTRACT_ID.split('.')[2]).toString(16).padStart(40, '0')}`);
    console.log('2. Change network to mainnet in the UI');
    console.log('3. Test swap functionality');

  } catch (error: any) {
    if (error.message?.includes('ADAPTER_ALREADY_EXISTS')) {
      console.log('ℹ️  Adapter already configured');
    } else {
      console.error('❌ Error configuring adapter:', error);
      throw error;
    }
  } finally {
    client.close();
  }
}

configureAdapter().catch(console.error);
