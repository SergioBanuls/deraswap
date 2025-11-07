/**
 * Deploy using ContractCreateFlow like ETASwap does
 */

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🧪 Desplegando con ContractCreateFlow (método ETASwap)...\n");

  const operatorId = AccountId.fromString(process.env.TESTNET_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.TESTNET_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  // First, test TestNoParams
  console.log("=== Test 1: TestNoParams (sin parámetros) ===");
  const noParamsPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/TestNoParams.sol/TestNoParams.json"
  );
  const noParamsArtifact = JSON.parse(fs.readFileSync(noParamsPath, "utf8"));

  try {
    const tx1 = new ContractCreateFlow()
      .setGas(300000)
      .setBytecode(noParamsArtifact.bytecode);

    const response1 = await tx1.execute(client);
    const receipt1 = await response1.getReceipt(client);
    console.log(`✅ SUCCESS! Contract: ${receipt1.contractId.toString()}\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.status) console.log(`   Status: ${error.status.toString()}\n`);
  }

  // Now test TestSimple with params
  console.log("=== Test 2: TestSimple (con parámetros) ===");
  const simplePath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/TestSimple.sol/TestSimple.json"
  );
  const simpleArtifact = JSON.parse(fs.readFileSync(simplePath, "utf8"));

  const params = new ContractFunctionParameters()
    .addAddress("0x0000000000000000000000000000000000099f8a")
    .addAddress("0x00000000000000000000000000000000002ad431")
    .addUint256(25)
    .addAddress("0x0000000000000000000000000000000000003ad2");

  try {
    const tx2 = new ContractCreateFlow()
      .setGas(300000)
      .setConstructorParameters(params)
      .setBytecode(simpleArtifact.bytecode);

    const response2 = await tx2.execute(client);
    const receipt2 = await response2.getReceipt(client);
    console.log(`✅ SUCCESS! Contract: ${receipt2.contractId.toString()}\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.status) console.log(`   Status: ${error.status.toString()}\n`);
  }

  // Finally, test the real Adapter
  console.log("=== Test 3: SaucerSwapV2Adapter (real) ===");
  const adapterPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/adapters/SaucerSwapV2Adapter.sol/SaucerSwapV2Adapter.json"
  );
  const adapterArtifact = JSON.parse(fs.readFileSync(adapterPath, "utf8"));

  const adapterParams = new ContractFunctionParameters()
    .addAddress("0x0000000000000000000000000000000000099f8a")
    .addAddress("0x00000000000000000000000000000000002ad431")
    .addUint256(25)
    .addAddress("0x0000000000000000000000000000000000003ad2");

  try {
    const tx3 = new ContractCreateFlow()
      .setGas(3000000)  // ✅ Much higher gas
      .setConstructorParameters(adapterParams)
      .setBytecode(adapterArtifact.bytecode);

    const response3 = await tx3.execute(client);
    const receipt3 = await response3.getReceipt(client);
    console.log(`✅ SUCCESS! Contract: ${receipt3.contractId.toString()}\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.status) console.log(`   Status: ${error.status.toString()}\n`);
  }

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
