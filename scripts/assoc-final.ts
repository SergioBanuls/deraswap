import { Client, AccountId, PrivateKey, TokenAssociateTransaction } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const client = Client.forMainnet().setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
  );
  
  const tokens = ['0.0.1456986', '0.0.456858', '0.0.731861'];
  for (const t of tokens) {
    try {
      const tx = await (await new TokenAssociateTransaction()
        .setAccountId('0.0.10087040')
        .setTokenIds([t])
        .freezeWith(client)
        .sign(PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)))
        .execute(client);
      const receipt = await tx.getReceipt(client);
      console.log(`✅ ${t}: ${receipt.status}`);
    } catch (e: any) { console.log(`⚠️ ${t}: ${e.message}`); }
  }
  client.close();
}
run();
