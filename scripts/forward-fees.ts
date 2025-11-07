/**
 * Auto-forward fees from fee wallet to another wallet
 * 
 * Run this periodically to forward accumulated fees
 * from your fee wallet to a different destination wallet
 * 
 * Usage: npx tsx scripts/forward-fees.ts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  Hbar,
  AccountBalanceQuery,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 🔥 CONFIGURE THESE
const SOURCE_WALLET = process.env.HEDERA_ACCOUNT_ID!; // Wallet que recibe fees
const SOURCE_KEY = process.env.PRIVATE_KEY!;
const DESTINATION_WALLET = '0.0.XXXXXX'; // Nueva wallet destino
const KEEP_BALANCE_HBAR = 2; // Dejar 2 HBAR para gas fees futuras

async function forwardFees() {
  const sourceId = AccountId.fromString(SOURCE_WALLET);
  const sourceKey = PrivateKey.fromStringECDSA(SOURCE_KEY);
  const destinationId = AccountId.fromString(DESTINATION_WALLET);
  
  const client = Client.forMainnet();
  client.setOperator(sourceId, sourceKey);

  console.log('💸 Forwarding fees...');
  console.log('From:', sourceId.toString());
  console.log('To:', destinationId.toString());

  try {
    // Get current balance
    const balance = await new AccountBalanceQuery()
      .setAccountId(sourceId)
      .execute(client);

    const currentHbar = balance.hbars.toBigNumber().toNumber();
    const amountToSend = currentHbar - KEEP_BALANCE_HBAR;

    if (amountToSend <= 0) {
      console.log('⚠️  Not enough balance to forward (need to keep', KEEP_BALANCE_HBAR, 'HBAR for gas)');
      console.log('Current balance:', currentHbar, 'HBAR');
      return;
    }

    console.log('\nCurrent balance:', currentHbar, 'HBAR');
    console.log('Amount to send:', amountToSend, 'HBAR');
    console.log('Will keep:', KEEP_BALANCE_HBAR, 'HBAR');

    // Transfer
    const tx = await new TransferTransaction()
      .addHbarTransfer(sourceId, new Hbar(-amountToSend))
      .addHbarTransfer(destinationId, new Hbar(amountToSend))
      .execute(client);

    const receipt = await tx.getReceipt(client);

    console.log('\n✅ Fees forwarded successfully!');
    console.log('Transaction ID:', tx.transactionId.toString());
    console.log('Status:', receipt.status.toString());
    console.log('\n💰 Summary:');
    console.log(`Sent ${amountToSend} HBAR to ${DESTINATION_WALLET}`);

  } catch (error) {
    console.error('❌ Error forwarding fees:', error);
    throw error;
  } finally {
    client.close();
  }
}

forwardFees().catch(console.error);
