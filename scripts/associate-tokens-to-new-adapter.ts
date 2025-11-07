import {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADAPTER_CONTRACT_ID = '0.0.10086985';
const MAINNET_TOKENS = [
  '0.0.1456986',  // WHBAR [new]
  '0.0.456858',   // USDC
  '0.0.731861',   // SAUCE
];

async function associateTokens() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔗 Associating tokens to adapter:', ADAPTER_CONTRACT_ID);

  for (const tokenId of MAINNET_TOKENS) {
    try {
      const tx = await new TokenAssociateTransaction()
        .setAccountId(ADAPTER_CONTRACT_ID)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(operatorKey);

      const response = await tx.execute(client);
      const receipt = await response.getReceipt(client);
      
      console.log(`✅ ${tokenId}: ${receipt.status.toString()}`);
    } catch (error: any) {
      console.log(`⚠️  ${tokenId}: ${error.message}`);
    }
  }

  client.close();
}

associateTokens().catch(console.error);
