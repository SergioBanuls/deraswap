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

  console.log('🔍 Testing adapter configuration:', ADAPTER_CONTRACT_ID);
  console.log();

  try {
    // Query router address
    const routerQuery = new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(100000)
      .setFunction('router');

    const routerResult = await routerQuery.execute(client);
    const routerAddress = routerResult.getAddress(0);
    
    console.log('Router address in adapter:', routerAddress);
    
    // Expected: 0x00000000000000000000000000000000004979b5 (0.0.4815285)
    const routerNum = parseInt(routerAddress.slice(2), 16);
    console.log('Router Hedera ID:', `0.0.${routerNum}`);
    
    if (routerNum === 4815285) {
      console.log('✅ Correct SaucerSwap V2 router');
    } else {
      console.log('❌ Wrong router!');
    }
  } catch (error: any) {
    console.log('Error querying router:', error.message);
  }

  client.close();
}

testAdapter().catch(console.error);
