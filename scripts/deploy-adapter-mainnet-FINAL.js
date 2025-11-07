/**
 * FINAL WORKING DEPLOYMENT SCRIPT
 *
 * Uses ContractCreateFlow (like ETASwap) instead of FileCreate + ContractCreate
 *
 * VERIFIED ON TESTNET: Contract 0.0.7213039 deployed successfully!
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
  const args = process.argv.slice(2);
  const network = args.includes('--network')
    ? args[args.indexOf('--network') + 1]
    : 'testnet';

  console.log(`🚀 Desplegando SaucerSwapV2Adapter (MÉTODO CORRECTO)\n`);

  // Setup client
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
  console.log(`- Network: ${network}`);
  console.log(`- Operator: ${operatorId.toString()}\n`);

  // Network-specific configuration
  let FEE_WALLET, SAUCERSWAP_V2_ROUTER, WHBAR_TOKEN;
  const FEE_BASIS_POINTS = 25;

  if (network === 'mainnet') {
    FEE_WALLET = process.env.MAINNET_YOUR_FEE_WALLET;
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000007b925f"; // 0.0.8100447
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // 0.0.1456986 ✅ CORRECTO
  } else {
    FEE_WALLET = process.env.YOUR_FEE_WALLET || "0x0000000000000000000000000000000000099f8a";
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000002ad431"; // 0.0.2806833
    WHBAR_TOKEN = "0x0000000000000000000000000000000000003ad2"; // 0.0.15058
  }

  console.log(`📋 Parámetros del contrato:`);
  console.log(`- Fee Wallet: ${FEE_WALLET}`);
  console.log(`- Router: ${SAUCERSWAP_V2_ROUTER}`);
  console.log(`- WHBAR Token: ${WHBAR_TOKEN} ✅`);
  console.log(`- Fee: ${FEE_BASIS_POINTS / 100}%\n`);

  // Read bytecode
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/adapters/SaucerSwapV2Adapter.sol/SaucerSwapV2Adapter.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Bytecode no encontrado. Ejecuta: npx hardhat compile");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Constructor parameters
  // ⚠️ IMPORTANTE: Usar addUint256 para el uint16 (funciona en Hedera)
  const constructorParams = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(SAUCERSWAP_V2_ROUTER)
    .addUint256(FEE_BASIS_POINTS)  // ✅ addUint256 funciona para uint16
    .addAddress(WHBAR_TOKEN);

  console.log(`⏳ Desplegando contrato...\n`);

  try {
    // ✅ MÉTODO CORRECTO: ContractCreateFlow
    const contractTx = new ContractCreateFlow()
      .setGas(3000000)  // Alto gas para contrato grande
      .setAdminKey(operatorKey.publicKey)  // ✅ Set admin key explicitly
      .setMaxAutomaticTokenAssociations(-1)  // ✅ Enable unlimited auto token associations
      .setConstructorParameters(constructorParams)
      .setBytecode(artifact.bytecode);

    const contractResponse = await contractTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);
    const contractId = contractReceipt.contractId;

    const evmAddress = "0x" + contractId.toSolidityAddress();

    console.log(`\n✅ ¡Adapter desplegado exitosamente!`);
    console.log(`   Contract ID: ${contractId.toString()}`);
    console.log(`   EVM Address: ${evmAddress}`);
    console.log(`   🔄 Auto Token Associations: Enabled (unlimited)\n`);

    console.log(`📝 SIGUIENTE PASO: Registrar en Exchange`);
    console.log(`   Aggregator ID: SaucerSwapV2_V10`);
    console.log(`   Adapter Address: ${evmAddress}\n`);

    console.log(`💾 Actualiza tu .env.local:`);
    if (network === 'mainnet') {
      console.log(`SAUCERSWAP_V2_ADAPTER_V10=${evmAddress}`);
      console.log(`SAUCERSWAP_V2_ADAPTER_V10_HEDERA_ID=${contractId.toString()}\n`);
    } else {
      console.log(`TESTNET_ADAPTER=${evmAddress}`);
      console.log(`TESTNET_ADAPTER_ID=${contractId.toString()}\n`);
    }

  } catch (error) {
    console.error(`\n❌ Error al desplegar: ${error.message}`);
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
