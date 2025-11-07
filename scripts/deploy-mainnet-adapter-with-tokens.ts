/**
 * Script to deploy SaucerSwapV2Adapter contract to Hedera Mainnet
 * Following ETASwap's approach: deploy WITH admin key and associate tokens immediately
 * 
 * Prerequisites:
 * 1. Compile contracts: npx hardhat compile
 * 2. Deploy Exchange contract first
 * 3. Set environment variables in .env.local
 * 
 * Usage: npx tsx scripts/deploy-mainnet-adapter-with-tokens.ts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  TokenAssociateTransaction,
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
const WHBAR_TOKEN = '0x0000000000000000000000000000000000163B5A'; // WHBAR mainnet (0.0.1456986) - FIXED: Was 163456 (wrong!)
const FEE_BASIS_POINTS = 25; // 0.25% fee (basis points: 25 = 0.25%, 30 = 0.3%)

// Top tokens to associate (ETASwap approach)
const TOKENS_TO_ASSOCIATE = [
  '0.0.1456986',  // WHBAR
  '0.0.456858',   // USDC
  '0.0.731861',   // SAUCE
  '0.0.2543294',  // HBARX
  '0.0.456858',   // USDC (duplicate check will be filtered)
  '0.0.1372508',  // USDT
];

async function deployAdapterWithTokens() {
  // Setup client for MAINNET
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  // Fee wallet - wallet que recibirá las fees del 0.25%
  const feeWalletId = AccountId.fromString('0.0.10085914');
  const feeWalletEVM = `0x${feeWalletId.toSolidityAddress()}`;

  console.log('🚀 Deploying SaucerSwapV2Adapter to MAINNET (ETASwap approach)...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Configuration:');
  console.log('   Operator Account:', operatorId.toString());
  console.log('   Fee Wallet:', feeWalletId.toString(), `(${feeWalletEVM})`);
  console.log('   SaucerSwap Router:', SAUCERSWAP_V2_ROUTER);
  console.log('   WHBAR Token:', WHBAR_TOKEN);
  console.log('   Fee:', FEE_BASIS_POINTS / 100, '%');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Read bytecode
    const contractJson = JSON.parse(fs.readFileSync(BYTECODE_PATH, 'utf8'));
    const bytecode = contractJson.bytecode;

    if (!bytecode || bytecode === '0x') {
      throw new Error('Invalid bytecode. Run: npx hardhat compile');
    }

    console.log('📦 Bytecode size:', bytecode.length / 2, 'bytes\n');

    // Step 1: Create file with bytecode
    console.log('1️⃣ Creating file with bytecode...');
    const fileCreateTx = await new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(bytecode.slice(0, 4096))
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);

    const fileCreateReceipt = await fileCreateTx.getReceipt(client);
    const fileId = fileCreateReceipt.fileId;
    console.log('   ✅ File created:', fileId?.toString());

    // Step 2: Append remaining bytecode if needed
    if (bytecode.length > 4096) {
      console.log('   📎 Appending remaining bytecode...');
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
        console.log(`      ${offset}/${bytecode.length} bytes appended`);
      }
      console.log('   ✅ Bytecode fully uploaded\n');
    }

    // Step 3: Create contract WITH ADMIN KEY (ETASwap approach)
    console.log('2️⃣ Creating contract WITH admin key...');
    const contractCreateTx = await new ContractCreateTransaction()
      .setBytecodeFileId(fileId!)
      .setGas(2000000)
      .setAdminKey(operatorKey)  // 🔑 THIS IS THE KEY - allows token association after deploy
      .setConstructorParameters(
        new ContractFunctionParameters()
          .addAddress(feeWalletEVM)           // _feeWallet
          .addAddress(SAUCERSWAP_V2_ROUTER)   // _router
          .addUint16(FEE_BASIS_POINTS)        // _feeBasisPoints
          .addAddress(WHBAR_TOKEN)            // _whbarToken (solo para identificar HBAR swaps)
      )
      .setMaxTransactionFee(new Hbar(20))
      .execute(client);

    const contractCreateReceipt = await contractCreateTx.getReceipt(client);
    const contractId = contractCreateReceipt.contractId;

    console.log('   ✅ Contract deployed:', contractId?.toString());
    console.log('   🔑 Admin key set: YES (can associate tokens)\n');

    // Step 4: Associate tokens immediately (ETASwap approach)
    console.log('3️⃣ Associating tokens to adapter...');
    
    // Remove duplicates
    const uniqueTokens = [...new Set(TOKENS_TO_ASSOCIATE)];
    console.log(`   📝 Tokens to associate: ${uniqueTokens.length}`);
    
    for (const tokenId of uniqueTokens) {
      try {
        const token = AccountId.fromString(tokenId);
        console.log(`   🪙 Associating ${tokenId}...`);
        
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(AccountId.fromString(contractId!.toString()))
          .setTokenIds([token])
          .freezeWith(client)
          .sign(operatorKey);  // Sign with operator key (who has admin rights)

        const associateSubmit = await associateTx.execute(client);
        await associateSubmit.getReceipt(client);
        
        console.log(`      ✅ Associated ${tokenId}`);
      } catch (error: any) {
        // Some tokens may already be associated or fail, continue anyway
        console.log(`      ⚠️  ${tokenId}: ${error.message}`);
      }
    }

    console.log('   ✅ Token association complete\n');

    console.log('\n🎉 DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Deployment Summary:');
    console.log('   Contract ID:', contractId?.toString());
    console.log('   EVM Address:', `0x${contractId?.toSolidityAddress()}`);
    console.log('   Fee Wallet:', feeWalletEVM, `(${feeWalletId.toString()})`);
    console.log('   Admin Key:', '✅ SET (operator can manage)');
    console.log('   Associated Tokens:', uniqueTokens.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Next Steps:');
    console.log('1. Remove old adapter from Exchange:');
    console.log('   - Update scripts/configure-adapter-mainnet.ts');
    console.log(`   - ADAPTER_CONTRACT_ID: ${contractId?.toString()}`);
    console.log('2. Register new adapter:');
    console.log('   npx tsx scripts/configure-adapter-mainnet.ts');
    console.log('3. Test a swap! 🎊\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    client.close();
  }
}

deployAdapterWithTokens().catch(console.error);
