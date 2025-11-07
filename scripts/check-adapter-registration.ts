import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086948';

async function checkAdapter() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔍 Checking adapter registration in Exchange:', EXCHANGE_CONTRACT_ID);
  console.log();

  const adapterNames = [
    'SaucerSwapV2_V5',      // Latest - v5
    'SaucerSwapV2',         // Old name (conflict)
    'SaucerSwapV2_WORKING',
    'SaucerSwapV2_FINAL',
    'SaucerSwapV2_HTS',
  ];

  for (const name of adapterNames) {
    try {
      const query = new ContractCallQuery()
        .setContractId(EXCHANGE_CONTRACT_ID)
        .setGas(100000)
        .setFunction('adapters', new ContractFunctionParameters().addString(name));

      const result = await query.execute(client);
      const adapterAddress = result.getAddress(0);
      
      console.log(`${name}:`);
      console.log(`  Address: ${adapterAddress}`);
      
      // Convert EVM address to Hedera ID
      if (adapterAddress && adapterAddress !== '0x0000000000000000000000000000000000000000') {
        const adapterNum = parseInt(adapterAddress.slice(2), 16);
        console.log(`  Hedera ID: 0.0.${adapterNum}`);
      } else {
        console.log(`  ⚠️  NOT REGISTERED`);
      }
      console.log();
    } catch (error: any) {
      console.log(`${name}: Error - ${error.message}\n`);
    }
  }

  client.close();
}

checkAdapter().catch(console.error);
