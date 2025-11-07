import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADAPTER_CONTRACT_ID = '0.0.10086985';

async function testAdapter() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔍 Testing adapter:', ADAPTER_CONTRACT_ID);
  console.log();

  try {
    // Query whbarToken public variable
    const query = new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(100000)
      .setFunction('whbarToken');

    const result = await query.execute(client);
    const whbarAddress = result.getAddress(0);
    
    console.log('WHBAR Token address in adapter:', whbarAddress);
    
    // Convert to Hedera ID
    if (whbarAddress) {
      const whbarNum = parseInt(whbarAddress.slice(2), 16);
      console.log('WHBAR Token Hedera ID:', `0.0.${whbarNum}`);
      
      // Check if it's correct
      const expectedId = 1456986; // WHBAR [new]
      const wrongId = 1455190; // The typo we had
      
      if (whbarNum === expectedId) {
        console.log('✅ CORRECT! Using WHBAR [new]');
      } else if (whbarNum === wrongId) {
        console.log('❌ WRONG! Using typo address (0x163456 instead of 0x163B5A)');
      } else {
        console.log(`⚠️  Unknown WHBAR: 0.0.${whbarNum}`);
      }
    }
  } catch (error: any) {
    console.log('Error:', error.message);
  }

  client.close();
}

testAdapter().catch(console.error);
