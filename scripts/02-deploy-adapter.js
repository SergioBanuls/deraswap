/**
 * Script para desplegar el adapter SaucerSwapV2
 * 
 * 🔥 IMPORTANTE: Modifica YOUR_FEE_WALLET con tu wallet
 * 
 * Uso:
 * npx hardhat run scripts/02-deploy-adapter.js --network testnet
 * npx hardhat run scripts/02-deploy-adapter.js --network mainnet
 */

const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🚀 Desplegando SaucerSwapV2Adapter...");
  
  const network = hre.network.name;
  
  // 🔥 CONFIGURA TU WALLET SEGÚN LA RED
  const YOUR_FEE_WALLET = network === "mainnet" 
    ? process.env.MAINNET_YOUR_FEE_WALLET 
    : process.env.YOUR_FEE_WALLET;
  
  if (!YOUR_FEE_WALLET || YOUR_FEE_WALLET === "0x...") {
    console.error(`❌ ERROR: Debes configurar ${network === "mainnet" ? "MAINNET_YOUR_FEE_WALLET" : "YOUR_FEE_WALLET"} en el .env`);
    process.exit(1);
  }
  
  // Direcciones de contratos según la red
  
  let SAUCERSWAP_V2_ROUTER, WHBAR_TOKEN;

  if (network === "mainnet") {
    // Mainnet addresses
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000007b925f"; // SaucerSwap V2 Router mainnet (0.0.8100447)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // ✅ WHBAR correcto en mainnet (0.0.1456986)
  } else {
    // Testnet addresses - SaucerSwap V2 on testnet
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000002ad431"; // SaucerSwap V2 Router testnet (0.0.2806833)
    WHBAR_TOKEN = "0x0000000000000000000000000000000000068e26"; // WHBAR en testnet (0.0.429606)
  }

  const FEE_BASIS_POINTS = 25; // 0.25% fee (tu fee custom - más bajo que ETASwap)

  console.log(`\n📋 Configuración:`);
  console.log(`- Fee Wallet: ${YOUR_FEE_WALLET}`);
  console.log(`- Router: ${SAUCERSWAP_V2_ROUTER}`);
  console.log(`- WHBAR Token: ${WHBAR_TOKEN}`);
  console.log(`- Fee: ${FEE_BASIS_POINTS / 100}%`);
  console.log(`- Network: ${network}\n`);

  const SaucerSwapV2Adapter = await hre.ethers.getContractFactory("SaucerSwapV2Adapter");
  const adapter = await SaucerSwapV2Adapter.deploy(
    YOUR_FEE_WALLET,
    SAUCERSWAP_V2_ROUTER,
    FEE_BASIS_POINTS,
    WHBAR_TOKEN
  );

  await adapter.deployed();
  
  console.log("✅ SaucerSwapV2Adapter desplegado en:", adapter.address);
  console.log("\n📝 Guarda esta dirección para registrarla en el Exchange");
  
  // Convertir a formato Hedera (0.0.X)
  const evmAddress = adapter.address.toLowerCase().replace('0x', '');
  const hederaId = `0.0.${parseInt(evmAddress, 16)}`;
  console.log(`Hedera ID: ${hederaId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
