/**
 * DEPLOYMENT SCRIPT - SaucerSwapV1Adapter
 *
 * Deploys V1 adapter for Uniswap V2-style swaps
 * Constructor parameters:
 * - feeWallet (your wallet)
 * - router (SaucerSwap V1 Router - need to find address)
 * - feePromille (3 = 0.3%)
 * - whbarToken (0.0.1456986)
 * - whbarContract (0.0.1456985)
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

  // DRY RUN mode - solo muestra parámetros sin desplegar
  const dryRun = args.includes('--dry-run');

  console.log(`🚀 ${dryRun ? '[DRY RUN] ' : ''}Desplegando SaucerSwapV1Adapter (Uniswap V2-style)\n`);

  if (dryRun) {
    console.log('⚠️  MODO DRY RUN: Solo se mostrarán los parámetros, NO se desplegará nada\n');
  }

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
  let FEE_WALLET, SAUCERSWAP_V1_ROUTER, WHBAR_TOKEN, WHBAR_CONTRACT;
  const FEE_PROMILLE = 3; // 3/1000 = 0.3%

  if (network === 'mainnet') {
    FEE_WALLET = process.env.MAINNET_YOUR_FEE_WALLET;
    // SaucerSwap V1 Router (RouterV3 - Current version)
    // From: https://www.saucerswap.finance/
    SAUCERSWAP_V1_ROUTER = "0x00000000000000000000000000000000002e7a5d"; // 0.0.3045981 (RouterV3)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // 0.0.1456986
    WHBAR_CONTRACT = "0x0000000000000000000000000000000000163b59"; // 0.0.1456985
  } else {
    FEE_WALLET = process.env.YOUR_FEE_WALLET || "0x0000000000000000000000000000000000099f8a";
    // SaucerSwap V1 Router (RouterV3 - Current version testnet)
    SAUCERSWAP_V1_ROUTER = "0x0000000000000000000000000000000000004b40"; // 0.0.19264 (RouterV3)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000003ad2"; // 0.0.15058
    WHBAR_CONTRACT = "0x0000000000000000000000000000000000003ad1"; // 0.0.15057
  }

  // Validate fee wallet is configured
  if (!FEE_WALLET) {
    console.error("❌ ERROR: MAINNET_YOUR_FEE_WALLET not configured!");
    console.error("   Please set your fee wallet address in .env.local\n");
    process.exit(1);
  }

  console.log(`📋 Parámetros del contrato:`);
  console.log(`- Fee Wallet: ${FEE_WALLET}`);
  console.log(`- V1 Router: ${SAUCERSWAP_V1_ROUTER}`);
  console.log(`- Fee: ${FEE_PROMILLE}/1000 = ${FEE_PROMILLE/10}%`);
  console.log(`- WHBAR Token: ${WHBAR_TOKEN}`);
  console.log(`- WHBAR Contract: ${WHBAR_CONTRACT}\n`);

  // En modo dry-run, salir aquí
  if (dryRun) {
    console.log('✅ Parámetros verificados. Para desplegar de verdad, ejecuta SIN --dry-run\n');
    console.log('Comando para desplegar:');
    console.log(`   node scripts/deploy-v1-adapter-mainnet.js --network ${network}\n`);
    process.exit(0);
  }

  // Read bytecode
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/solidity/adapters/SaucerSwapV1Adapter.sol/SaucerSwapV1Adapter.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Bytecode no encontrado. Ejecuta: npx hardhat compile");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Constructor parameters
  const constructorParams = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(SAUCERSWAP_V1_ROUTER)
    .addUint256(FEE_PROMILLE)
    .addAddress(WHBAR_TOKEN)
    .addAddress(WHBAR_CONTRACT);

  console.log(`⏳ Desplegando contrato...\n`);

  try {
    const contractTx = new ContractCreateFlow()
      .setGas(3000000)
      .setAdminKey(operatorKey.publicKey)
      .setMaxAutomaticTokenAssociations(-1)  // Auto-associations ilimitadas
      .setConstructorParameters(constructorParams)
      .setBytecode(artifact.bytecode);

    const contractResponse = await contractTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);
    const contractId = contractReceipt.contractId;

    const evmAddress = "0x" + contractId.toSolidityAddress();

    console.log(`\n✅ ¡V1 Adapter desplegado exitosamente!`);
    console.log(`   Contract ID: ${contractId.toString()}`);
    console.log(`   EVM Address: ${evmAddress}`);
    console.log(`   Fee: 0.3%\n`);

    console.log(`📝 SIGUIENTE PASO: Registrar en Exchange`);
    console.log(`   Aggregator ID: SaucerSwapV1`);
    console.log(`   Adapter Address: ${evmAddress}\n`);

    console.log(`💾 Actualiza tu .env.local:`);
    if (network === 'mainnet') {
      console.log(`SAUCERSWAP_V1_ADAPTER=${evmAddress}`);
      console.log(`SAUCERSWAP_V1_ADAPTER_ID=${contractId.toString()}\n`);
    } else {
      console.log(`TESTNET_V1_ADAPTER=${evmAddress}`);
      console.log(`TESTNET_V1_ADAPTER_ID=${contractId.toString()}\n`);
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
