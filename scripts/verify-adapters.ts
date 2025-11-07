import { Client, AccountId, PrivateKey, ContractCallQuery, ContractFunctionParameters } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
  const client = Client.forMainnet().setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
  );
  
  const names = ['SaucerSwapV2_FIXED', 'SaucerSwapV2_WORKING', 'SaucerSwapV2_FINAL'];
  
  for (const name of names) {
    const query = new ContractCallQuery()
      .setContractId('0.0.10086948')
      .setGas(100000)
      .setFunction('adapters', new ContractFunctionParameters().addString(name));
    
    const result = await query.execute(client);
    const addr = result.getAddress(0);
    const num = parseInt(addr.slice(2), 16);
    
    console.log(`${name}: ${addr} (0.0.${num})`);
  }
  
  client.close();
}
verify();
