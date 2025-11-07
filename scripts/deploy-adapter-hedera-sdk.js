/**
 * Deploy SaucerSwapV2Adapter using Hedera SDK
 *
 * This script uses Hedera SDK directly instead of Hardhat
 * to avoid the ECDSA account derivation issue.
 */

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  Hbar,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require('dotenv').config({ path: '.env.local' });

async function main() {
  // Determine network from command line args or default to testnet
  const args = process.argv.slice(2);
  const network = args.includes('--network')
    ? args[args.indexOf('--network') + 1]
    : 'testnet';

  console.log(`🚀 Desplegando SaucerSwapV2Adapter con Hedera SDK...\n`);

  // Setup client based on network
  const operatorId = network === 'mainnet'
    ? AccountId.fromString(process.env.HEDERA_ACCOUNT_ID)
    : AccountId.fromString(process.env.TESTNET_ACCOUNT_ID);

  const operatorKey = network === 'mainnet'
    ? PrivateKey.fromStringDer(
        "3030020100300706052b8104000a04220420" +
        process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
      )
    : PrivateKey.fromStringECDSA(process.env.TESTNET_PRIVATE_KEY);

  const client = network === 'mainnet'
    ? Client.forMainnet()
    : Client.forTestnet();

  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  console.log(`📋 Configuración:`);
  console.log(`- Operator Account: ${operatorId.toString()}`);
  console.log(`- Network: ${network}\n`);

  // Configuration based on network
  let FEE_WALLET, SAUCERSWAP_V2_ROUTER, WHBAR_TOKEN;
  const FEE_BASIS_POINTS = 25;

  if (network === 'mainnet') {
    FEE_WALLET = process.env.MAINNET_YOUR_FEE_WALLET;
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000007b925f"; // 0.0.8100447
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // 0.0.1456986 ✅
  } else {
    // Testnet configuration
    FEE_WALLET = process.env.YOUR_FEE_WALLET || "0x0000000000000000000000000000000000099f8a";
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000002ad431"; // 0.0.2806833
    WHBAR_TOKEN = "0x0000000000000000000000000000000000003ad2"; // 0.0.15058 ✅ (ETASwap testnet)
  }

  console.log(`📋 Parámetros del contrato:`);
  console.log(`- Fee Wallet: ${FEE_WALLET}`);
  console.log(`- Router: ${SAUCERSWAP_V2_ROUTER}`);
  console.log(`- WHBAR Token: ${WHBAR_TOKEN} ✅`);
  console.log(`- Fee: ${FEE_BASIS_POINTS / 100}%\n`);

  // Read compiled bytecode
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/adapters/SaucerSwapV2Adapter.sol/SaucerSwapV2Adapter.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Bytecode no encontrado. Ejecuta: npx hardhat compile");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bytecode = artifact.bytecode;

  console.log(`⏳ Leyendo bytecode... (${bytecode.length / 2} bytes)`);

  // Encode constructor parameters separately
  // ⚠️ IMPORTANTE: ETASwap usa .addUint256() incluso para uint8/uint16
  // Esto evita problemas de encoding en Hedera
  const { ContractFunctionParameters } = require("@hashgraph/sdk");
  const constructorParams = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(SAUCERSWAP_V2_ROUTER)
    .addUint256(FEE_BASIS_POINTS)  // ✅ Cambiadode addUint16 a addUint256
    .addAddress(WHBAR_TOKEN);

  console.log(`⏳ Desplegando contrato... (puede tardar 1-2 minutos)`);

  try {
    // Convert bytecode to Buffer (without constructor params)
    const bytecodeBuffer = Buffer.from(bytecode.replace("0x", ""), "hex");

    // Step 1: Create file with bytecode
    console.log("   Step 1/2: Creando archivo con bytecode...");
    const fileCreateTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(bytecodeBuffer.slice(0, 4096))
      .setMaxTransactionFee(new Hbar(2));

    const fileCreateSubmit = await fileCreateTx.execute(client);
    const fileCreateReceipt = await fileCreateSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateReceipt.fileId;

    console.log(`   Archivo creado: ${bytecodeFileId.toString()}`);

    // Append remaining bytecode in chunks if needed
    if (bytecodeBuffer.length > 4096) {
      console.log("   Agregando bytecode restante...");
      for (let i = 4096; i < bytecodeBuffer.length; i += 4096) {
        const chunk = bytecodeBuffer.slice(i, Math.min(i + 4096, bytecodeBuffer.length));
        const fileAppendTx = new FileAppendTransaction()
          .setFileId(bytecodeFileId)
          .setContents(chunk)
          .setMaxTransactionFee(new Hbar(2));

        await (await fileAppendTx.execute(client)).getReceipt(client);
      }
    }

    // Step 2: Create contract with constructor params
    console.log("   Step 2/2: Creando contrato...");
    const contractCreateTx = new ContractCreateTransaction()
      .setBytecodeFileId(bytecodeFileId)
      .setGas(2000000) // Much higher gas limit
      .setConstructorParameters(constructorParams)
      .setMaxTransactionFee(new Hbar(20));

    const contractCreateSubmit = await contractCreateTx.execute(client);
    const receipt = await contractCreateSubmit.getReceipt(client);
    const contractId = receipt.contractId;

    console.log(`\n✅ Adapter desplegado exitosamente!`);
    console.log(`   Contract ID: ${contractId.toString()}`);

    // Convert to EVM address
    const evmAddress = "0x" + contractId.toSolidityAddress();
    console.log(`   EVM Address: ${evmAddress}\n`);

    console.log(`📝 SIGUIENTE PASO: Registrar en Exchange`);
    console.log(`   Aggregator ID: SaucerSwapV2_V10`);
    console.log(`   Adapter Address: ${evmAddress}\n`);

    console.log(`💾 Actualiza tu .env.local:`);
    console.log(`SAUCERSWAP_V2_ADAPTER_V10=${evmAddress}`);
    console.log(`SAUCERSWAP_V2_ADAPTER_V10_HEDERA_ID=${contractId.toString()}\n`);

  } catch (error) {
    console.error("❌ Error al desplegar:", error.message);
    if (error.status) {
      console.error(`   Status: ${error.status.toString()}`);
    }
    process.exit(1);
  }

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
