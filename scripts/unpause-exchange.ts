import {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  Hbar,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086840';

async function unpauseExchange() {
  console.log('🔓 Despausando Exchange en Mainnet...\n');

  // Configurar cliente
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  try {
    console.log(`📋 Exchange Contract: ${EXCHANGE_CONTRACT_ID}`);
    console.log(`👤 Owner Account: ${operatorId.toString()}\n`);

    // Ejecutar unpauseSwaps()
    const tx = await new ContractExecuteTransaction()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(100000) // Gas suficiente para unpause
      .setFunction('unpauseSwaps')
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);

    console.log(`⏳ Transaction ID: ${tx.transactionId.toString()}`);

    const receipt = await tx.getReceipt(client);
    console.log(`✅ Status: ${receipt.status.toString()}\n`);

    if (receipt.status.toString() === 'SUCCESS') {
      console.log('🎉 EXCHANGE DESPAUSADO!');
      console.log('✅ Los swaps ahora están habilitados en mainnet');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

unpauseExchange();
