/**
 * Register the new SaucerSwapV2_V10 adapter in Exchange
 */

const {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🔧 Registrando SaucerSwapV2_V10 en Exchange...\n");

  // Setup client
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringDer(
    "3030020100300706052b8104000a04220420" +
    process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
  );

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  const EXCHANGE_ADDRESS = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID;
  const ADAPTER_ADDRESS = process.env.SAUCERSWAP_V2_ADAPTER_V10;
  const AGGREGATOR_ID = "SaucerSwapV2_V12";  // V12 = auto token associations enabled

  console.log(`📋 Configuración:`);
  console.log(`- Exchange: ${EXCHANGE_ADDRESS}`);
  console.log(`- Adapter: ${ADAPTER_ADDRESS}`);
  console.log(`- Aggregator ID: ${AGGREGATOR_ID}\n`);

  if (!EXCHANGE_ADDRESS || !ADAPTER_ADDRESS) {
    console.error("❌ Faltan variables de entorno");
    process.exit(1);
  }

  console.log("⏳ Registrando adapter...");

  try {
    // Call setAdapter on Exchange
    const params = new ContractFunctionParameters()
      .addString(AGGREGATOR_ID)
      .addAddress(ADAPTER_ADDRESS);

    const tx = new ContractExecuteTransaction()
      .setContractId(EXCHANGE_ADDRESS)
      .setGas(100000)
      .setFunction("setAdapter", params)
      .setMaxTransactionFee(new Hbar(2));

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`\n✅ Adapter registrado exitosamente!`);
    console.log(`   Transaction ID: ${response.transactionId.toString()}`);
    console.log(`   Status: ${receipt.status.toString()}\n`);

    console.log("📝 SIGUIENTE PASO: Actualizar frontend");
    console.log("   En hooks/useSwapRoutes.ts, mapear:");
    console.log(`   'SaucerSwapV2' -> '${AGGREGATOR_ID}'`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
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
