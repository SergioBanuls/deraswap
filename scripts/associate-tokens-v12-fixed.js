/**
 * Associate tokens to V12 adapter using proper key management
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
  console.log("🔗 Asociando tokens al adapter V12...\n");

  // Setup operator
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringDer(
    "3030020100300706052b8104000a04220420" +
    process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
  );

  // Create client with operator as default signer
  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));

  const ADAPTER_ID = AccountId.fromString(process.env.SAUCERSWAP_V2_ADAPTER_V10_HEDERA_ID);
  const WHBAR_TOKEN_ID = "0.0.1456986";
  const USDC_TOKEN_ID = "0.0.456858";

  console.log(`📋 Configuración:`);
  console.log(`- Adapter: ${ADAPTER_ID.toString()}`);
  console.log(`- wHBAR: ${WHBAR_TOKEN_ID}`);
  console.log(`- USDC: ${USDC_TOKEN_ID}`);
  console.log(`- Operator (admin): ${operatorId.toString()}\n`);

  try {
    console.log("⏳ Creando transacción de asociación...");

    // Build transaction with all required signatures
    const transaction = await new TokenAssociateTransaction()
      .setAccountId(ADAPTER_ID)
      .setTokenIds([WHBAR_TOKEN_ID, USDC_TOKEN_ID])
      .setTransactionMemo("Associate wHBAR and USDC to V12 adapter")
      .freezeWith(client);

    // Sign with operator key (which is the admin key)
    const signedTx = await transaction.sign(operatorKey);

    console.log("✅ Transacción firmada");
    console.log("⏳ Ejecutando...");

    // Execute
    const response = await signedTx.execute(client);
    console.log(`📡 Transaction ID: ${response.transactionId.toString()}`);

    // Get receipt
    const receipt = await response.getReceipt(client);

    console.log(`\n✅ ¡Tokens asociados exitosamente!`);
    console.log(`   Status: ${receipt.status.toString()}\n`);

    // Verify associations
    console.log("🔍 Verificando asociaciones...");
    const verifyUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${ADAPTER_ID.toString()}/tokens`;
    console.log(`   Check: ${verifyUrl}\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.status) {
      console.error(`   Status: ${error.status.toString()}`);
    }
    console.error(`\n💡 Causa posible:`);
    console.error(`   - Admin key del adapter no coincide con operator key`);
    console.error(`   - Adapter fue deployado con admin key diferente`);
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
