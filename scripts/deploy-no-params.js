/**
 * Deploy contract WITHOUT constructor params to test if bytecode itself works
 */

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateTransaction,
  FileCreateTransaction,
  Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🧪 Desplegando contrato SIN parámetros...\n");

  const operatorId = AccountId.fromString(process.env.TESTNET_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.TESTNET_PRIVATE_KEY);

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/TestNoParams.sol/TestNoParams.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bytecode = artifact.bytecode;
  const bytecodeBuffer = Buffer.from(bytecode.replace("0x", ""), "hex");

  console.log(`⏳ Bytecode length: ${bytecode.length / 2} bytes`);

  // Create file
  const fileCreateTx = new FileCreateTransaction()
    .setKeys([operatorKey])
    .setContents(bytecodeBuffer)
    .setMaxTransactionFee(new Hbar(2));

  const fileCreateSubmit = await fileCreateTx.execute(client);
  const fileCreateReceipt = await fileCreateSubmit.getReceipt(client);
  const bytecodeFileId = fileCreateReceipt.fileId;

  console.log(`   Archivo creado: ${bytecodeFileId.toString()}`);

  // Create contract WITHOUT params
  const contractCreateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(1000000)
    .setMaxTransactionFee(new Hbar(20));

  try {
    const contractCreateSubmit = await contractCreateTx.execute(client);
    const receipt = await contractCreateSubmit.getReceipt(client);
    const contractId = receipt.contractId;

    console.log(`\n✅ SUCCESS! Contract deployed: ${contractId.toString()}`);
    console.log(`   EVM Address: 0x${contractId.toSolidityAddress()}`);
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    if (error.status) {
      console.log(`   Status: ${error.status.toString()}`);
    }
  }

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
