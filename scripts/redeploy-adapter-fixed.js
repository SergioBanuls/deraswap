/**
 * Script para RE-DESPLEGAR el adapter SaucerSwapV2 con la dirección correcta de wHBAR
 *
 * 🔥 FIXES:
 * 1. Corrige la dirección de wHBAR a 0x163b5a (0.0.1456986)
 * 2. Reduce parámetros del constructor de 5 a 4
 * 3. Cambia fee de 0.3% a 0.25%
 *
 * Uso:
 * npx hardhat run scripts/redeploy-adapter-fixed.js --network mainnet
 */

const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🚀 RE-DESPLEGANDO SaucerSwapV2Adapter (FIXED)...\n");

  const network = hre.network.name;

  // Configuración de wallet
  const YOUR_FEE_WALLET = network === "mainnet"
    ? process.env.MAINNET_YOUR_FEE_WALLET
    : process.env.YOUR_FEE_WALLET;

  if (!YOUR_FEE_WALLET || YOUR_FEE_WALLET === "0x...") {
    console.error(`❌ ERROR: Debes configurar ${network === "mainnet" ? "MAINNET_YOUR_FEE_WALLET" : "YOUR_FEE_WALLET"} en el .env.local`);
    process.exit(1);
  }

  // ✅ DIRECCIONES CORRECTAS
  let SAUCERSWAP_V2_ROUTER, WHBAR_TOKEN;

  if (network === "mainnet") {
    // Mainnet addresses
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000007b925f"; // SaucerSwap V2 Router mainnet (0.0.8100447)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // ✅ WHBAR CORRECTO en mainnet (0.0.1456986)
  } else {
    // Testnet addresses
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000002ad431"; // SaucerSwap V2 Router testnet (0.0.2806833)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000068e26"; // WHBAR en testnet (0.0.429606)
  }

  const FEE_BASIS_POINTS = 25; // 0.25% fee (tu fee custom)

  console.log(`📋 Configuración CORREGIDA:`);
  console.log(`- Network: ${network}`);
  console.log(`- Fee Wallet: ${YOUR_FEE_WALLET}`);
  console.log(`- Router: ${SAUCERSWAP_V2_ROUTER}`);
  console.log(`- WHBAR Token: ${WHBAR_TOKEN} ✅ (CORRECTO)`);
  console.log(`- Fee: ${FEE_BASIS_POINTS / 100}%\n`);

  console.log("⏳ Desplegando contrato...");

  const SaucerSwapV2Adapter = await hre.ethers.getContractFactory("SaucerSwapV2Adapter");
  const adapter = await SaucerSwapV2Adapter.deploy(
    YOUR_FEE_WALLET,
    SAUCERSWAP_V2_ROUTER,
    FEE_BASIS_POINTS,
    WHBAR_TOKEN
  );

  await adapter.deployed();

  // Convertir a formato Hedera
  const evmAddress = adapter.address.toLowerCase().replace('0x', '');
  const hederaId = `0.0.${parseInt(evmAddress, 16)}`;

  console.log("\n✅ SaucerSwapV2Adapter FIXED desplegado!");
  console.log(`   EVM Address: ${adapter.address}`);
  console.log(`   Hedera ID: ${hederaId}`);

  console.log("\n📝 SIGUIENTE PASO: Registrar este adapter en el Exchange");
  console.log(`   Ejecuta: npx hardhat run scripts/register-new-adapter.js --network ${network}`);
  console.log(`   Y proporciona este aggregatorId: SaucerSwapV2_V10`);
  console.log(`   Y esta dirección: ${adapter.address}\n`);

  console.log("💾 Actualiza tu .env.local con:");
  console.log(`SAUCERSWAP_V2_ADAPTER_FIXED=${adapter.address}`);
  console.log(`SAUCERSWAP_V2_ADAPTER_HEDERA_ID=${hederaId}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
