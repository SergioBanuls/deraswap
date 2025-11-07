import { Client, AccountId, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_ID = '0.0.10086948';
const ADAPTER_V9_ID = '0.0.10087392';
const ADAPTER_NAME = 'SaucerSwapV2_V9'; // NEW name (v8 already exists)

async function main() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);
  
  console.log('🔧 Registering adapter v9...\n');
  
  // Convert adapter ID to EVM address
  const parts = ADAPTER_V9_ID.split('.');
  const adapterEvmAddress = '0x' + parseInt(parts[2]).toString(16).padStart(40, '0');
  
  console.log(`Exchange: ${EXCHANGE_ID}`);
  console.log(`Adapter: ${ADAPTER_V9_ID} (${adapterEvmAddress})`);
  console.log(`Name: ${ADAPTER_NAME}\n`);
  
  // Register adapter using setAdapter
  const tx = await new ContractExecuteTransaction()
    .setContractId(EXCHANGE_ID)
    .setGas(200000)
    .setFunction('setAdapter', new ContractFunctionParameters()
      .addString(ADAPTER_NAME)
      .addAddress(adapterEvmAddress)
    )
    .execute(client);
  
  const receipt = await tx.getReceipt(client);
  
  console.log(`✅ Adapter v9 registered!`);
  console.log(`Status: ${receipt.status.toString()}`);
  
  client.close();
}

main().catch(console.error);
