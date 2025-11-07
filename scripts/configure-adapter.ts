/**
 * Script to configure SaucerSwapV2 adapter in Exchange contract
 * 
 * This script calls setAdapter() on the Exchange contract to register
 * the deployed adapter contract.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.5449267'; // Your Exchange contract
const ADAPTER_CONTRACT_ID = '0.0.5449275'; // Your Adapter contract (0x45C3eefbff223D21d87252D348e37f3826b1f3bA)
const ADAPTER_NAME = 'SaucerSwapV2';

async function configureAdapter() {
  // Setup client
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔧 Configurando adapter en Exchange contract...');
  console.log('Exchange:', EXCHANGE_CONTRACT_ID);
  console.log('Adapter:', ADAPTER_CONTRACT_ID);
  console.log('Adapter Name:', ADAPTER_NAME);

  try {
    // Build function parameters for setAdapter(string name, address adapter)
    const params = new ContractFunctionParameters()
      .addString(ADAPTER_NAME)
      .addAddress(`0x${parseInt(ADAPTER_CONTRACT_ID.split('.')[2]).toString(16).padStart(40, '0')}`);

    // Execute setAdapter transaction
    const tx = await new ContractExecuteTransaction()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(200000)
      .setFunction('setAdapter', params)
      .execute(client);

    const receipt = await tx.getReceipt(client);
    
    console.log('✅ Adapter configurado exitosamente!');
    console.log('Transaction ID:', tx.transactionId.toString());
    console.log('Status:', receipt.status.toString());

  } catch (error) {
    console.error('❌ Error configurando adapter:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Run the script
configureAdapter()
  .then(() => {
    console.log('\n✨ Configuración completada!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
