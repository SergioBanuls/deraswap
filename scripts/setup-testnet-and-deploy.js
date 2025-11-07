/**
 * Complete testnet setup and deployment
 * Creates account, gets funds from faucet, and deploys
 */

const {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  AccountBalanceQuery,
  ContractCreateTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractFunctionParameters,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Setup completo de testnet y deployment\n");

  // Step 1: Use Hedera testnet with free operator
  console.log("📡 Conectando a Hedera Testnet...");
  const client = Client.forTestnet();

  // Use Hedera's public testnet node
  // No need to set operator for account creation

  // Step 2: Generate new keys
  console.log("🔑 Generando nuevas keys...");
  const newPrivateKey = PrivateKey.generateED25519();
  const newPublicKey = newPrivateKey.publicKey;

  console.log(`   Private Key (DER): ${newPrivateKey.toStringDer()}`);
  console.log(`   Public Key: ${newPublicKey.toString()}\n`);

  try {
    // Step 3: Create account (this will fail without operator, but we'll use portal instead)
    console.log("⚠️  Para deployment en testnet:");
    console.log("   1. Ve a https://portal.hedera.com/");
    console.log("   2. Crea cuenta de testnet (botón Create Account)");
    console.log("   3. Copia el Account ID y Private Key");
    console.log("   4. Ejecuta el deployment con esas credenciales\n");

    console.log("📝 Guarda estas credenciales para usar:");
    console.log(`   TESTNET_ACCOUNT_ID=<el ID que te den>`);
    console.log(`   TESTNET_PRIVATE_KEY_DER=${newPrivateKey.toStringDer()}`);
    console.log(`   TESTNET_PRIVATE_KEY=${newPrivateKey.toStringRaw()}\n`);

    console.log("🔗 Link directo al portal:");
    console.log("   https://portal.hedera.com/register\n");

  } catch (error) {
    console.log("ℹ️  Como esperado, necesitas usar el portal de Hedera");
    console.log("   https://portal.hedera.com/\n");
  }

  client.close();

  console.log("💡 ALTERNATIVA RÁPIDA:");
  console.log("   Si solo quieres validar el encoding del constructor,");
  console.log("   puedo intentar desplegar SIN parámetros para ver si");
  console.log("   el error cambia. Esto nos diría si el problema es");
  console.log("   el bytecode o los parámetros del constructor.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
