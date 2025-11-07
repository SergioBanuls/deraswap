import { Client, AccountId, PrivateKey, TokenAssociateTransaction } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet().setOperator(operatorId, operatorKey);
  
  const feeWallet = '0.0.10085914';
  const whbar = '0.0.1456986';
  
  console.log(`🔗 Associating WHBAR to fee wallet ${feeWallet}...`);
  
  try {
    const tx = await new TokenAssociateTransaction()
      .setAccountId(feeWallet)
      .setTokenIds([whbar])
      .freezeWith(client)
      .sign(operatorKey);
    
    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    
    console.log(`✅ ${whbar}: ${receipt.status.toString()}`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  client.close();
}

run();
