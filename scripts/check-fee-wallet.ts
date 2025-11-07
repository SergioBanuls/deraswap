import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADAPTER_CONTRACT_ID = '0.0.10086985';

async function checkFeeWallet() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔍 Checking fee wallet in adapter:', ADAPTER_CONTRACT_ID);

  try {
    const query = new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(100000)
      .setFunction('feeWallet');

    const result = await query.execute(client);
    const feeWalletAddress = result.getAddress(0);
    
    console.log('Fee wallet address:', feeWalletAddress);
    
    const feeWalletNum = parseInt(feeWalletAddress.slice(2), 16);
    console.log('Fee wallet Hedera ID:', `0.0.${feeWalletNum}`);
    
    // Check if it exists
    const accountInfo = await client.getAccountInfo(`0.0.${feeWalletNum}`);
    console.log('Fee wallet exists:', accountInfo.accountId.toString());
    console.log('Balance:', accountInfo.balance.toString());
  } catch (error: any) {
    console.log('Error:', error.message);
  }

  client.close();
}

checkFeeWallet().catch(console.error);
