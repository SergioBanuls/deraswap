import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086840';

async function checkPauseStatus() {
  console.log('🔍 Verificando estado de pausa del Exchange...\n');

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  try {
    // Llamar a paused() view function
    const result = await new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(50000)
      .setFunction('paused')
      .execute(client);

    const isPaused = result.getBool(0);
    
    console.log(`📋 Exchange Contract: ${EXCHANGE_CONTRACT_ID}`);
    console.log(`⏸️  Paused: ${isPaused ? 'YES ❌' : 'NO ✅'}\n`);

    if (isPaused) {
      console.log('⚠️  El contrato está PAUSADO');
      console.log('💡 Los swaps NO funcionarán hasta despausar');
    } else {
      console.log('✅ El contrato está ACTIVO');
      console.log('🎉 Los swaps están habilitados');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    client.close();
  }
}

checkPauseStatus();
