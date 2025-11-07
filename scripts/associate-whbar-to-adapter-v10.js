/**
 * Associate wHBAR to the new adapter V10
 */

const {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  Hbar,
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🔗 Asociando wHBAR al adapter V10...\n");

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringDer(
    "3030020100300706052b8104000a04220420" +
    process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
  );

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  const ADAPTER_ID = process.env.SAUCERSWAP_V2_ADAPTER_V10_HEDERA_ID;
  const WHBAR_TOKEN_ID = "0.0.1456986"; // wHBAR mainnet
  const USDC_TOKEN_ID = "0.0.456858"; // USDC

  console.log(`📋 Configuración:`);
  console.log(`- Adapter: ${ADAPTER_ID}`);
  console.log(`- wHBAR: ${WHBAR_TOKEN_ID}`);
  console.log(`- USDC: ${USDC_TOKEN_ID}\n`);

  console.log("⏳ Asociando tokens al adapter...");

  try {
    // Since the operator is both the payer and the admin key,
    // we just need to execute directly - client will sign with operator key
    const response = await new TokenAssociateTransaction()
      .setAccountId(ADAPTER_ID)
      .setTokenIds([WHBAR_TOKEN_ID, USDC_TOKEN_ID])
      .execute(client);

    const receipt = await response.getReceipt(client);

    console.log(`\n✅ Tokens asociados exitosamente!`);
    console.log(`   Transaction ID: ${response.transactionId.toString()}`);
    console.log(`   Status: ${receipt.status.toString()}\n`);

    console.log("🎉 Ahora puedes probar el swap de HBAR → USDC!");

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
