import { Client, AccountId, PrivateKey, ContractCallQuery } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const client = Client.forMainnet().setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
  );
  
  const adapter = '0.0.10087040';
  
  // Check whbarContract address
  const query = new ContractCallQuery()
    .setContractId(adapter)
    .setGas(100000)
    .setFunction('whbarContract');
  
  const result = await query.execute(client);
  const addr = result.getAddress(0);
  const num = parseInt(addr.slice(2), 16);
  
  console.log('WHBAR Contract address in adapter:', addr);
  console.log('WHBAR Contract Hedera ID:', `0.0.${num}`);
  console.log();
  console.log('Expected: 0.0.1456986 (WHBAR token contract)');
  
  if (num === 1456986) {
    console.log('✅ Correct!');
  } else {
    console.log('❌ WRONG! This is the issue!');
  }
  
  client.close();
}
check();
