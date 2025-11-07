import { Client, AccountId, PrivateKey, ContractCallQuery, ContractFunctionParameters } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086840';
const ADAPTER_NAME = 'SaucerSwapV2_HTS';

async function checkAdapter() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔍 Checking adapter status...');
  console.log('Exchange:', EXCHANGE_CONTRACT_ID);
  console.log('Adapter Name:', ADAPTER_NAME);

  try {
    // Check if adapter exists
    const params = new ContractFunctionParameters().addString(ADAPTER_NAME);
    
    const adapterQuery = new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(100000)
      .setFunction('adapters', params);
    
    const adapterResult = await adapterQuery.execute(client);
    const adapterAddress = adapterResult.getAddress(0);
    
    // Check if adapter is marked as removed
    const removedQuery = new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(100000)
      .setFunction('adapterRemoved', params);
    
    const removedResult = await removedQuery.execute(client);
    const isRemoved = removedResult.getBool(0);
    
    console.log('\n📋 Adapter State:');
    console.log('Adapter Address:', adapterAddress);
    console.log('Adapter exists:', adapterAddress !== '0x0000000000000000000000000000000000000000');
    console.log('Adapter removed:', isRemoved);
    
    if (adapterAddress !== '0x0000000000000000000000000000000000000000') {
      const adapterId = '0.0.' + parseInt(adapterAddress.substring(24), 16);
      console.log('Adapter ID:', adapterId);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
  }

  process.exit(0);
}

checkAdapter();
