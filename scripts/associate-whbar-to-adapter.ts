import {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  Hbar,
  TokenId,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ADAPTER_CONTRACT_ID = '0.0.10086893';
const WHBAR_TOKEN_ID = '0.0.1456986';
const USDC_TOKEN_ID = '0.0.456858';
const SAUCE_TOKEN_ID = '0.0.731861';
const HBARX_TOKEN_ID = '0.0.2543294';

async function associateTokens() {
  console.log('🔗 Asociando tokens al Adapter...\n');

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  try {
    console.log(`📋 Adapter Contract: ${ADAPTER_CONTRACT_ID}`);
    console.log(`🪙 WHBAR Token: ${WHBAR_TOKEN_ID}`);
    console.log(`💵 USDC Token: ${USDC_TOKEN_ID}`);
    console.log(`🍯 SAUCE Token: ${SAUCE_TOKEN_ID}`);
    console.log(`💎 HBARX Token: ${HBARX_TOKEN_ID}\n`);

    // Asociar todos los tokens en una sola transacción
    console.log('🔗 Asociando tokens al adapter...');
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(ADAPTER_CONTRACT_ID)
      .setTokenIds([
        TokenId.fromString(WHBAR_TOKEN_ID),
        TokenId.fromString(USDC_TOKEN_ID),
        TokenId.fromString(SAUCE_TOKEN_ID),
        TokenId.fromString(HBARX_TOKEN_ID),
      ])
      .freezeWith(client)
      .sign(operatorKey);

    const submitTx = await associateTx.execute(client);
    const receipt = await submitTx.getReceipt(client);
    console.log(`✅ Todos los tokens asociados: ${receipt.status.toString()}\n`);

    console.log('🎉 TOKENS ASOCIADOS!');
    console.log('Ahora el adapter puede interactuar con:');
    console.log('  - WHBAR (0.0.1456986)');
    console.log('  - USDC (0.0.456858)');
    console.log('  - SAUCE (0.0.731861)');
    console.log('  - HBARX (0.0.2543294)');

  } catch (error: any) {
    if (error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
      console.log('✅ Los tokens ya están asociados al adapter');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    client.close();
  }
}

associateTokens();
