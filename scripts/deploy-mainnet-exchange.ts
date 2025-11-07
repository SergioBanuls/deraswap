/**
 * Script to deploy Exchange contract to Hedera Mainnet
 * 
 * Prerequisites:
 * 1. Compile contracts: npx hardhat compile
 * 2. Set environment variables in .env.local:
 *    - HEDERA_ACCOUNT_ID (your mainnet account)
 *    - PRIVATE_KEY (your ECDSA private key)
 * 
 * Usage: npx tsx scripts/deploy-mainnet-exchange.ts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  Hbar,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

// Contract bytecode path
const BYTECODE_PATH = './artifacts/contracts/solidity/Exchange.sol/Exchange.json';

async function deployExchange() {
  // Setup client for MAINNET
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  console.log('📝 Deploying Exchange contract to MAINNET...');
  console.log('Account:', operatorId.toString());

  try {
    // Read bytecode
    const contractJson = JSON.parse(fs.readFileSync(BYTECODE_PATH, 'utf8'));
    const bytecode = contractJson.bytecode;

    if (!bytecode || bytecode === '0x') {
      throw new Error('Invalid bytecode. Run: npx hardhat compile');
    }

    console.log('📦 Bytecode size:', bytecode.length / 2, 'bytes');

    // Step 1: Create file with bytecode
    console.log('1️⃣ Creating file with bytecode...');
    const fileCreateTx = await new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(bytecode.slice(0, 4096))
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);

    const fileCreateReceipt = await fileCreateTx.getReceipt(client);
    const fileId = fileCreateReceipt.fileId;
    console.log('✅ File created:', fileId?.toString());

    // Step 2: Append remaining bytecode if needed
    if (bytecode.length > 4096) {
      console.log('2️⃣ Appending remaining bytecode...');
      let offset = 4096;
      while (offset < bytecode.length) {
        const chunk = bytecode.slice(offset, Math.min(offset + 4096, bytecode.length));
        const fileAppendTx = await new FileAppendTransaction()
          .setFileId(fileId!)
          .setContents(chunk)
          .setMaxTransactionFee(new Hbar(2))
          .execute(client);

        await fileAppendTx.getReceipt(client);
        offset += 4096;
        console.log(`   Appended ${offset}/${bytecode.length} bytes`);
      }
      console.log('✅ Bytecode fully uploaded');
    }

    // Step 3: Create contract WITH admin key
    console.log('3️⃣ Creating contract with admin key...');
    const contractCreateTx = await new ContractCreateTransaction()
      .setBytecodeFileId(fileId!)
      .setGas(2000000)
      .setAdminKey(operatorKey) // 🔑 CRITICAL: Set admin key to enable token association
      .setConstructorParameters(
        new ContractFunctionParameters()
        // Exchange constructor doesn't require parameters
      )
      .setMaxTransactionFee(new Hbar(30))
      .execute(client);

    const contractCreateReceipt = await contractCreateTx.getReceipt(client);
    const contractId = contractCreateReceipt.contractId;

    console.log('\n✅ Exchange contract deployed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Contract ID:', contractId?.toString());
    console.log('EVM Address:', `0x${contractId?.toSolidityAddress()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env.local with:');
    console.log(`   NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=${contractId?.toString()}`);
    console.log(`   NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x${contractId?.toSolidityAddress()}`);
    console.log('2. Deploy the SaucerSwapV2Adapter contract');
    console.log('3. Configure the adapter with: npx tsx scripts/configure-adapter-mainnet.ts');

  } catch (error) {
    console.error('❌ Error deploying contract:', error);
    throw error;
  } finally {
    client.close();
  }
}

deployExchange().catch(console.error);
