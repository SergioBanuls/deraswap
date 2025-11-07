/**
 * Create a temporary testnet account for testing
 */

const {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");

async function main() {
  console.log("🔧 Creando cuenta temporal de testnet...\n");

  // Create client - use Hedera's default testnet operator
  const client = Client.forTestnet();

  // Generate new keys for the account
  const newAccountPrivateKey = PrivateKey.generateED25519();
  const newAccountPublicKey = newAccountPrivateKey.publicKey;

  console.log("🔑 Keys generadas:");
  console.log(`   Private Key: ${newAccountPrivateKey.toString()}`);
  console.log(`   Public Key: ${newAccountPublicKey.toString()}`);
  console.log(`   Private Key DER: ${newAccountPrivateKey.toStringDer()}\n`);

  // Try to create account (this requires an existing funded account)
  // For testnet, we can use the Hedera portal faucet
  console.log("⚠️  Para crear la cuenta, necesitas:");
  console.log("   1. Ir a: https://portal.hedera.com/");
  console.log("   2. Crear una cuenta de testnet (gratis)");
  console.log("   3. Copiar el Account ID y Private Key");
  console.log("   4. Agregar a .env.local:");
  console.log(`      TESTNET_ACCOUNT_ID=0.0.XXXXX`);
  console.log(`      TESTNET_PRIVATE_KEY=${newAccountPrivateKey.toStringRaw()}\n`);

  console.log("💡 O usa esta private key para importar en HashPack:");
  console.log(`   ${newAccountPrivateKey.toStringRaw()}`);
  console.log("   Y luego usa la faucet de HashPack para fondear la cuenta.\n");

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
