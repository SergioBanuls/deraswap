/**
 * DEPLOYMENT SCRIPT - CÓDIGO EXACTO DE ETASWAP
 *
 * Constructor con 5 parámetros (igual que ETASwap):
 * - feeWallet (tu wallet)
 * - router (SaucerSwap V2)
 * - feePromille (3 = 0.3%)
 * - whbarToken (0.0.1456986)
 * - whbarContract (0.0.1456986) - mismo que token en Hedera
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

  console.log(`🚀 Desplegando SaucerSwapV2Adapter (CÓDIGO EXACTO ETASWAP)\n`);

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

  // Network-specific configuration (EXACTO como ETASwap)
  let FEE_WALLET, SAUCERSWAP_V2_ROUTER, WHBAR_TOKEN, WHBAR_CONTRACT;
  const FEE_PROMILLE = 3; // 3/1000 = 0.3% (igual que ETASwap)

  if (network === 'mainnet') {
    FEE_WALLET = process.env.MAINNET_YOUR_FEE_WALLET;
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000003c437a"; // 0.0.3949434 (ETASwap usa este)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // 0.0.1456986
    WHBAR_CONTRACT = "0x0000000000000000000000000000000000163b59"; // 0.0.1456985 (ETASwap usa este)
  } else {
    FEE_WALLET = process.env.YOUR_FEE_WALLET || "0x0000000000000000000000000000000000099f8a";
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000002ad431"; // 0.0.2806833
    WHBAR_TOKEN = "0x0000000000000000000000000000000000003ad2"; // 0.0.15058
    WHBAR_CONTRACT = "0x0000000000000000000000000000000000003ad1"; // 0.0.15057
  }

  console.log(`📋 Parámetros del contrato:`);
  console.log(`- Fee Wallet: ${FEE_WALLET}`);
  console.log(`- Router: ${SAUCERSWAP_V2_ROUTER}`);
  console.log(`- Fee: ${FEE_PROMILLE}/1000 = ${FEE_PROMILLE/10}%`);
  console.log(`- WHBAR Token: ${WHBAR_TOKEN}`);
  console.log(`- WHBAR Contract: ${WHBAR_CONTRACT}\n`);

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

  // Constructor parameters (5 parámetros como ETASwap)
  const constructorParams = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(SAUCERSWAP_V2_ROUTER)
    .addUint256(FEE_PROMILLE)  // ETASwap usa addUint256 para uint8
    .addAddress(WHBAR_TOKEN)
    .addAddress(WHBAR_CONTRACT);

  console.log(`⏳ Desplegando contrato...\n`);

  try {
    // MÉTODO CORRECTO: ContractCreateFlow (EXACTO como ETASwap)
    const contractTx = new ContractCreateFlow()
      .setGas(3000000)  // Alto gas para contrato grande
      .setAdminKey(operatorKey.publicKey)
      .setMaxAutomaticTokenAssociations(-1)  // ✅ CRÍTICO: Auto-associations ilimitadas (como ETASwap)
      .setConstructorParameters(constructorParams)
      .setBytecode(artifact.bytecode);

    const contractResponse = await contractTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);
    const contractId = contractReceipt.contractId;

    const evmAddress = "0x" + contractId.toSolidityAddress();

    console.log(`\n✅ ¡Adapter desplegado exitosamente!`);
    console.log(`   Contract ID: ${contractId.toString()}`);
    console.log(`   EVM Address: ${evmAddress}`);
    console.log(`   Fee: 0.3% (igual que ETASwap)\n`);

    console.log(`📝 SIGUIENTE PASO: Registrar en Exchange`);
    console.log(`   Aggregator ID: SaucerSwapV2_EXACT (o el nombre que prefieras)`);
    console.log(`   Adapter Address: ${evmAddress}\n`);

    console.log(`💾 Actualiza tu .env.local:`);
    if (network === 'mainnet') {
      console.log(`SAUCERSWAP_V2_ADAPTER_EXACT=${evmAddress}`);
      console.log(`SAUCERSWAP_V2_ADAPTER_EXACT_ID=${contractId.toString()}\n`);
    } else {
      console.log(`TESTNET_ADAPTER_EXACT=${evmAddress}`);
      console.log(`TESTNET_ADAPTER_EXACT_ID=${contractId.toString()}\n`);
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
