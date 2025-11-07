/**
 * Script para registrar adapters en el contrato Exchange
 * 
 * Uso:
 * npx hardhat run scripts/03-register-adapters.js --network testnet
 * npx hardhat run scripts/03-register-adapters.js --network mainnet
 */

const hre = require("hardhat");

async function main() {
  console.log("🔗 Registrando adapters en Exchange...");
  
  const network = hre.network.name;
  
  // Seleccionar las variables de entorno correctas según la red
  const EXCHANGE_ADDRESS = network === "mainnet"
    ? process.env.MAINNET_EXCHANGE_ADDRESS
    : process.env.EXCHANGE_ADDRESS;

  const SAUCERSWAP_V2_ADAPTER = network === "mainnet"
    ? process.env.MAINNET_SAUCERSWAP_V2_ADAPTER
    : process.env.SAUCERSWAP_V2_ADAPTER;
  
  if (!EXCHANGE_ADDRESS || EXCHANGE_ADDRESS === "0x..." || 
      !SAUCERSWAP_V2_ADAPTER || SAUCERSWAP_V2_ADAPTER === "0x...") {
    const prefix = network === "mainnet" ? "MAINNET_" : "";
    console.error(`❌ ERROR: Debes configurar ${prefix}EXCHANGE_ADDRESS y ${prefix}SAUCERSWAP_V2_ADAPTER en .env`);
    console.log("\nEjemplo .env:");
    console.log(`${prefix}EXCHANGE_ADDRESS=0x...`);
    console.log(`${prefix}SAUCERSWAP_V2_ADAPTER=0x...`);
    process.exit(1);
  }
  
  console.log(`\n📋 Configuración:`);
  console.log(`- Exchange: ${EXCHANGE_ADDRESS}`);
  console.log(`- SaucerSwapV2 Adapter: ${SAUCERSWAP_V2_ADAPTER}\n`);
  
  const exchange = await hre.ethers.getContractAt("Exchange", EXCHANGE_ADDRESS);
  
  // Registrar SaucerSwap V2 adapter
  console.log("Registrando SaucerSwapV2...");
  const tx = await exchange.setAdapter("SaucerSwapV2", SAUCERSWAP_V2_ADAPTER);
  await tx.wait();
  
  console.log("✅ SaucerSwapV2 adapter registrado!");
  
  // Verificar que se registró correctamente
  const registeredAdapter = await exchange.adapters("SaucerSwapV2");
  console.log(`\n✓ Verificación: ${registeredAdapter === SAUCERSWAP_V2_ADAPTER ? "CORRECTO" : "ERROR"}`);
  
  console.log("\n🎉 ¡Listo! Tu contrato está configurado.");
  console.log("\nAhora actualiza tu .env con:");
  console.log(`NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom`);
  console.log(`NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=${EXCHANGE_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
