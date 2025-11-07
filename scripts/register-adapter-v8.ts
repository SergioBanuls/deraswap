import { Client, AccountId, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_ID = '0.0.10086948';
const ADAPTER_V8_ID = '0.0.10087369';
const ADAPTER_NAME = 'SaucerSwapV2_V8';

async function main() {
  console.log('🔧 Registering adapter v8 in Exchange...\n');
  
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);
  
  // Convert adapter ID to EVM address
  const parts = ADAPTER_V8_ID.split('.');
  const adapterEvmAddress = '0x' + parseInt(parts[2]).toString(16).padStart(40, '0');
  
  console.log(`Exchange: ${EXCHANGE_ID}`);
  console.log(`Adapter: ${ADAPTER_V8_ID} (${adapterEvmAddress})`);
  console.log(`Name: ${ADAPTER_NAME}\n`);
  
  // Call addAdapter(string name, address adapter)
  const tx = await new ContractExecuteTransaction()
    .setContractId(EXCHANGE_ID)
    .setGas(200000)
    .setFunction('addAdapter', new ContractFunctionParameters()
      .addString(ADAPTER_NAME)
      .addAddress(adapterEvmAddress)
    )
    .execute(client);
  
  const receipt = await tx.getReceipt(client);
  
  console.log(`✅ Adapter registered!`);
  console.log(`Transaction ID: ${tx.transactionId.toString()}`);
  console.log(`Status: ${receipt.status.toString()}`);
  
  client.close();
}

main().catch(console.error);
