/**
 * Script para registrar el nuevo adapter en el Exchange
 *
 * Este script registra el adapter corregido con un nuevo aggregatorId
 * para no sobrescribir el anterior (por si acaso).
 *
 * Uso:
 * npx hardhat run scripts/register-new-adapter.js --network mainnet
 */

const hre = require("hardhat");
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("🔧 Registrando nuevo adapter en Exchange...\n");

  const network = hre.network.name;

  // Exchange address
  const EXCHANGE_ADDRESS = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS;

  if (!EXCHANGE_ADDRESS) {
    console.error("❌ ERROR: NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS no configurado en .env.local");
    process.exit(1);
  }

  console.log(`Exchange Address: ${EXCHANGE_ADDRESS}\n`);

  // Solicitar información del adapter
  const aggregatorId = await question("Aggregator ID (ej: SaucerSwapV2_V10): ");
  const adapterAddress = await question("Adapter Address (0x...): ");

  rl.close();

  console.log(`\n📋 Registrando adapter:`);
  console.log(`- Aggregator ID: ${aggregatorId}`);
  console.log(`- Adapter Address: ${adapterAddress}`);
  console.log(`- Exchange: ${EXCHANGE_ADDRESS}\n`);

  // Obtener contrato del Exchange
  const Exchange = await hre.ethers.getContractFactory("Exchange");
  const exchange = await Exchange.attach(EXCHANGE_ADDRESS);

  console.log("⏳ Registrando adapter...");

  // Llamar a setAdapter
  const tx = await exchange.setAdapter(aggregatorId, adapterAddress);
  await tx.wait();

  console.log("✅ Adapter registrado exitosamente!");
  console.log(`   Transaction hash: ${tx.hash}\n`);

  // Verificar registro
  const registeredAdapter = await exchange.adapters(aggregatorId);
  console.log(`✅ Verificación: ${registeredAdapter === adapterAddress ? "OK" : "FAILED"}`);
  console.log(`   Adapter registrado: ${registeredAdapter}\n`);

  console.log("📝 SIGUIENTE PASO: Actualizar tu frontend");
  console.log(`   En useSwapRoutes.ts, cambia el aggregatorId de 'SaucerSwapV2_V9' a '${aggregatorId}'`);
  console.log(`   O actualiza el mapeo de aggregators para usar el nuevo.\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
