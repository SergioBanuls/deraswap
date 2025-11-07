/**
 * Script to deploy SaucerSwapV2Adapter contract to Hedera Mainnet
 * 
 * Prerequisites:
 * 1. Compile contracts: npx hardhat compile
 * 2. Deploy Exchange contract first
 * 3. Set environment variables in .env.local:
 *    - HEDERA_ACCOUNT_ID (your mainnet account)
 *    - PRIVATE_KEY (your ECDSA private key)
 * 
 * Usage: npx tsx scripts/deploy-mainnet-adapter.ts
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
const BYTECODE_PATH = './artifacts/contracts/solidity/adapters/SaucerSwapV2Adapter.sol/SaucerSwapV2Adapter.json';

// Mainnet addresses
const SAUCERSWAP_V2_ROUTER = '0x00000000000000000000000000000000004979b5'; // SaucerSwap V2 Router (0.0.4815285)
const WHBAR_TOKEN = '0x0000000000000000000000000000000000163456'; // WHBAR mainnet (0.0.1456986)
const FEE_BASIS_POINTS = 25; // 0.25% fee (basis points: 25 = 0.25%, 30 = 0.3%)

async function deployAdapter() {
  // Setup client for MAINNET
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  // Fee wallet - wallet que recibirá las fees del 0.3%
  const feeWalletId = AccountId.fromString('0.0.10085914');
  const feeWalletEVM = `0x${feeWalletId.toSolidityAddress()}`;

  console.log('📝 Deploying SaucerSwapV2Adapter to MAINNET...');
  console.log('Account:', operatorId.toString());
  console.log('Fee Wallet:', feeWalletId.toString(), `(${feeWalletEVM})`);
  console.log('SaucerSwap Router:', SAUCERSWAP_V2_ROUTER);
  console.log('WHBAR Token:', WHBAR_TOKEN);
  console.log('Fee:', FEE_BASIS_POINTS / 100, '%');

  try {
    // Read bytecode
    const contractJson = JSON.parse(fs.readFileSync(BYTECODE_PATH, 'utf8'));
    const bytecode = contractJson.bytecode;

    if (!bytecode || bytecode === '0x') {
      throw new Error('Invalid bytecode. Run: npx hardhat compile');
    }

    console.log('\n📦 Bytecode size:', bytecode.length / 2, 'bytes');

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

    // Step 3: Create contract with constructor parameters AND admin key
    console.log('3️⃣ Creating contract...');
    const contractCreateTx = await new ContractCreateTransaction()
      .setBytecodeFileId(fileId!)
      .setGas(2000000)
      .setAdminKey(operatorKey.publicKey) // 🔥 CRITICAL: Set admin key to allow token associations
      .setConstructorParameters(
        new ContractFunctionParameters()
          .addAddress(feeWalletEVM)           // _feeWallet - your wallet receives fees
          .addAddress(SAUCERSWAP_V2_ROUTER)   // _router
          .addUint16(FEE_BASIS_POINTS)        // _feeBasisPoints (25 = 0.25%)
          .addAddress(WHBAR_TOKEN)            // _whbarToken
          .addAddress(WHBAR_TOKEN)            // _whbarContract (same as token)
      )
      .setMaxTransactionFee(new Hbar(20))
      .execute(client);

    const contractCreateReceipt = await contractCreateTx.getReceipt(client);
    const contractId = contractCreateReceipt.contractId;

    console.log('\n✅ SaucerSwapV2Adapter deployed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Contract ID:', contractId?.toString());
    console.log('EVM Address:', `0x${contractId?.toSolidityAddress()}`);
    console.log('Fee Wallet:', feeWalletEVM, `(${operatorId.toString()})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Next steps:');
    console.log('1. Configure the adapter in Exchange contract:');
    console.log('   Update scripts/configure-adapter-mainnet.ts with:');
    console.log(`   - EXCHANGE_CONTRACT_ID: (from previous deployment)`);
    console.log(`   - ADAPTER_CONTRACT_ID: ${contractId?.toString()}`);
    console.log('2. Run: npx tsx scripts/configure-adapter-mainnet.ts');

  } catch (error) {
    console.error('❌ Error deploying contract:', error);
    throw error;
  } finally {
    client.close();
  }
}

deployAdapter().catch(console.error);
