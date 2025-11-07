import { Client, AccountId, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_ID = '0.0.10086948';
const OLD_NAME = 'SaucerSwapV2_V6';
const ADAPTER_V8_ID = '0.0.10087369';
const NEW_NAME = 'SaucerSwapV2_V6'; // Reuse same name

async function main() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);
  
  console.log('🗑️  Removing old adapter...\n');
  
  // Remove old adapter
  const removeTx = await new ContractExecuteTransaction()
    .setContractId(EXCHANGE_ID)
    .setGas(200000)
    .setFunction('removeAdapter', new ContractFunctionParameters()
      .addString(OLD_NAME)
    )
    .execute(client);
  
  await removeTx.getReceipt(client);
  console.log(`✅ Removed ${OLD_NAME}`);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n🔧 Registering new adapter v8...\n');
  
  // Convert adapter ID to EVM address
  const parts = ADAPTER_V8_ID.split('.');
  const adapterEvmAddress = '0x' + parseInt(parts[2]).toString(16).padStart(40, '0');
  
  console.log(`Exchange: ${EXCHANGE_ID}`);
  console.log(`Adapter: ${ADAPTER_V8_ID} (${adapterEvmAddress})`);
  console.log(`Name: ${NEW_NAME}\n`);
  
  // Add new adapter (use setAdapter, not addAdapter)
  const addTx = await new ContractExecuteTransaction()
    .setContractId(EXCHANGE_ID)
    .setGas(200000)
    .setFunction('setAdapter', new ContractFunctionParameters()
      .addString(NEW_NAME)
      .addAddress(adapterEvmAddress)
    )
    .execute(client);
  
  await addTx.getReceipt(client);
  
  console.log(`✅ Adapter v8 registered as ${NEW_NAME}!`);
  
  client.close();
}

main().catch(console.error);
