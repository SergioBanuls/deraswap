/**
 * Deploy TestSimple contract to isolate the encoding issue
 */

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🧪 Desplegando TestSimple para aislar problema...\n");

  const operatorId = AccountId.fromString(process.env.TESTNET_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.TESTNET_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  console.log(`📋 Usando cuenta: ${operatorId.toString()}\n`);

  // Read compiled bytecode
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/TestSimple.sol/TestSimple.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bytecode = artifact.bytecode;

  console.log(`⏳ Bytecode length: ${bytecode.length / 2} bytes`);

  // Test parameters
  const FEE_WALLET = "0x0000000000000000000000000000000000099f8a";
  const ROUTER = "0x00000000000000000000000000000000002ad431";
  const FEE = 25;
  const TOKEN = "0x0000000000000000000000000000000000003ad2";

  console.log("\n🔧 Probando diferentes encodings:\n");

  // Try 1: With addUint256
  console.log("=== Test 1: Using addUint256 ===");
  const params1 = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(ROUTER)
    .addUint256(FEE)
    .addAddress(TOKEN);

  await tryDeploy(client, operatorKey, bytecode, params1, "addUint256");

  // Try 2: With addUint16
  console.log("\n=== Test 2: Using addUint16 ===");
  const params2 = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(ROUTER)
    .addUint16(FEE)
    .addAddress(TOKEN);

  await tryDeploy(client, operatorKey, bytecode, params2, "addUint16");

  // Try 3: With addUint8
  console.log("\n=== Test 3: Using addUint8 ===");
  const params3 = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(ROUTER)
    .addUint8(FEE)
    .addAddress(TOKEN);

  await tryDeploy(client, operatorKey, bytecode, params3, "addUint8");

  client.close();
}

async function tryDeploy(client, operatorKey, bytecode, constructorParams, label) {
  try {
    const bytecodeBuffer = Buffer.from(bytecode.replace("0x", ""), "hex");

    // Create file
    const fileCreateTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(bytecodeBuffer.slice(0, 4096))
      .setMaxTransactionFee(new Hbar(2));

    const fileCreateSubmit = await fileCreateTx.execute(client);
    const fileCreateReceipt = await fileCreateSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateReceipt.fileId;

    // Append remaining
    if (bytecodeBuffer.length > 4096) {
      for (let i = 4096; i < bytecodeBuffer.length; i += 4096) {
        const chunk = bytecodeBuffer.slice(i, Math.min(i + 4096, bytecodeBuffer.length));
        const fileAppendTx = new FileAppendTransaction()
          .setFileId(bytecodeFileId)
          .setContents(chunk)
          .setMaxTransactionFee(new Hbar(2));

        await (await fileAppendTx.execute(client)).getReceipt(client);
      }
    }

    // Create contract
    const contractCreateTx = new ContractCreateTransaction()
      .setBytecodeFileId(bytecodeFileId)
      .setGas(1000000)
      .setConstructorParameters(constructorParams)
      .setMaxTransactionFee(new Hbar(20));

    const contractCreateSubmit = await contractCreateTx.execute(client);
    const receipt = await contractCreateSubmit.getReceipt(client);
    const contractId = receipt.contractId;

    console.log(`✅ SUCCESS with ${label}! Contract: ${contractId.toString()}`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED with ${label}: ${error.message}`);
    if (error.status) {
      console.log(`   Status: ${error.status.toString()}`);
    }
    return false;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
