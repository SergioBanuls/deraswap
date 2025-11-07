import { Client, AccountId, PrivateKey, ContractCallQuery } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086840';

async function checkExchange() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('🔍 Checking Exchange status...');
  console.log('Exchange:', EXCHANGE_CONTRACT_ID);
  console.log('Operator:', operatorId.toString());

  try {
    // Check owner
    const ownerQuery = new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(100000)
      .setFunction('owner');
    const ownerResult = await ownerQuery.execute(client);
    const ownerAddress = ownerResult.getAddress(0);
    const owner = '0.0.' + parseInt(ownerAddress.substring(24), 16);

    // Check paused
    const pausedQuery = new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(100000)
      .setFunction('paused');
    const pausedResult = await pausedQuery.execute(client);
    const paused = pausedResult.getBool(0);

    console.log('\n📋 Exchange State:');
    console.log('Owner:', owner);
    console.log('Paused:', paused);
    console.log('Operator is owner:', owner === operatorId.toString());

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkExchange();
