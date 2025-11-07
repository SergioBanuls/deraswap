/**
 * Script to wrap HBAR to WHBAR on testnet
 */

import {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  Hbar,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const WHBAR_CONTRACT_ID = '0.0.1456986'; // WHBAR testnet
const AMOUNT_TO_WRAP = 10; // HBAR to wrap

async function wrapHbar() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log('💰 Wrapping', AMOUNT_TO_WRAP, 'HBAR to WHBAR...');

  try {
    // Call deposit() function on WHBAR contract
    const tx = await new ContractExecuteTransaction()
      .setContractId(WHBAR_CONTRACT_ID)
      .setGas(100000)
      .setPayableAmount(new Hbar(AMOUNT_TO_WRAP))
      .setFunction('deposit')
      .execute(client);

    const receipt = await tx.getReceipt(client);
    
    console.log('✅ HBAR wrapped successfully!');
    console.log('Transaction ID:', tx.transactionId.toString());
    console.log('Status:', receipt.status.toString());
    console.log('You now have', AMOUNT_TO_WRAP, 'WHBAR');

  } catch (error) {
    console.error('❌ Error wrapping HBAR:', error);
    throw error;
  } finally {
    client.close();
  }
}

wrapHbar()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
