import { Client, AccountId, PrivateKey, TokenAssociateTransaction } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ADAPTER = '0.0.10087030';
const TOKENS = ['0.0.1456986', '0.0.456858', '0.0.731861'];

async function run() {
  const client = Client.forMainnet().setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
  );
  
  for (const tokenId of TOKENS) {
    try {
      const tx = await (await new TokenAssociateTransaction()
        .setAccountId(ADAPTER)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)))
        .execute(client);
      const receipt = await tx.getReceipt(client);
      console.log(`✅ ${tokenId}: ${receipt.status.toString()}`);
    } catch (e: any) {
      console.log(`⚠️  ${tokenId}: ${e.message}`);
    }
  }
  client.close();
}
run();
