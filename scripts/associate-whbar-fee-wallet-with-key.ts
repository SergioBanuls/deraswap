import { Client, AccountId, PrivateKey, TokenAssociateTransaction } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet().setOperator(operatorId, operatorKey);
  
  const feeWallet = '0.0.10085914';
  const feeWalletKey = PrivateKey.fromStringECDSA('3030020100300706052b8104000a0422042049caa6caa622c0e34981fe935b7bb1a2b51dfdf141401c27e6ad90699c22f488');
  const whbar = '0.0.1456986';
  
  console.log(`🔗 Associating WHBAR to fee wallet ${feeWallet}...`);
  
  try {
    const tx = await new TokenAssociateTransaction()
      .setAccountId(feeWallet)
      .setTokenIds([whbar])
      .freezeWith(client)
      .sign(feeWalletKey);  // ← Firma con la key de la fee wallet
    
    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    
    console.log(`✅ WHBAR associated: ${receipt.status.toString()}`);
    console.log(`\nFee wallet ${feeWallet} can now receive WHBAR fees! 🎉`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  client.close();
}

run();
