/**
 * Script para desplegar el contrato Exchange
 * 
 * Uso:
 * npx hardhat run scripts/01-deploy-exchange.js --network testnet
 * npx hardhat run scripts/01-deploy-exchange.js --network mainnet
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Desplegando contrato Exchange...");
  
  const Exchange = await hre.ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy();

  await exchange.deployed();
  
  console.log("✅ Exchange desplegado en:", exchange.address);
  console.log("\n📝 Guarda esta dirección en tu .env:");
  console.log(`NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=${exchange.address}`);
  
  // Convertir a formato Hedera (0.0.X)
  const evmAddress = exchange.address.toLowerCase().replace('0x', '');
  const hederaId = `0.0.${parseInt(evmAddress, 16)}`;
  console.log(`NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=${hederaId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
