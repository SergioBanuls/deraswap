#!/usr/bin/env node

/**
 * Script para verificar la configuración de Hedera Swap
 * Ejecuta: node check-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verificando configuración de Hedera Swap...\n');

// Leer .env.local
const envPath = path.join(__dirname, '.env.local');
let envVars = {};

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Error: No se pudo leer .env.local');
  process.exit(1);
}

// Verificaciones
let hasErrors = false;
let hasWarnings = false;

console.log('📋 Verificando variables de entorno:\n');

// 1. Reown Project ID
const projectId = envVars.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  console.log('❌ NEXT_PUBLIC_REOWN_PROJECT_ID no está configurado');
  console.log('   → Obtén uno en: https://dashboard.reown.com/\n');
  hasErrors = true;
} else if (projectId.length < 30) {
  console.log('⚠️  NEXT_PUBLIC_REOWN_PROJECT_ID parece inválido (muy corto)');
  console.log('   → Verifica que copiaste el ID completo\n');
  hasWarnings = true;
} else {
  console.log('✅ NEXT_PUBLIC_REOWN_PROJECT_ID configurado correctamente');
  console.log(`   → ${projectId.substring(0, 10)}...\n`);
}

// 2. Red de Hedera
const network = envVars.NEXT_PUBLIC_HEDERA_NETWORK;
if (!network) {
  console.log('⚠️  NEXT_PUBLIC_HEDERA_NETWORK no está configurado');
  console.log('   → Se usará "testnet" por defecto\n');
  hasWarnings = true;
} else if (network !== 'testnet' && network !== 'mainnet') {
  console.log('❌ NEXT_PUBLIC_HEDERA_NETWORK debe ser "testnet" o "mainnet"');
  console.log(`   → Valor actual: "${network}"\n`);
  hasErrors = true;
} else {
  console.log(`✅ NEXT_PUBLIC_HEDERA_NETWORK: ${network}\n`);
}

// 3. Direcciones de contratos
const contracts = {
  'SwapRouter': envVars.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS,
  'Quoter': envVars.NEXT_PUBLIC_QUOTER_ADDRESS,
  'Factory': envVars.NEXT_PUBLIC_FACTORY_ADDRESS,
};

console.log('📍 Verificando direcciones de contratos:\n');

let allContractsConfigured = true;
for (const [name, address] of Object.entries(contracts)) {
  if (!address) {
    console.log(`❌ NEXT_PUBLIC_${name.toUpperCase()}_ADDRESS no está configurado`);
    allContractsConfigured = false;
  } else if (!address.startsWith('0x') && !address.match(/^\d+\.\d+\.\d+$/)) {
    console.log(`⚠️  NEXT_PUBLIC_${name.toUpperCase()}_ADDRESS tiene formato inválido`);
    console.log(`   → Debe ser formato EVM (0x...) o Hedera (0.0.xxxxx)`);
    console.log(`   → Valor actual: ${address}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${name}: ${address}`);
  }
}

if (!allContractsConfigured) {
  console.log('\n⚠️  IMPORTANTE: No hay direcciones de contratos configuradas');
  console.log('   → La app se compilará pero los swaps NO funcionarán');
  console.log('   → Ver CONTRACT_ADDRESSES.md para instrucciones\n');
  console.log('   📖 Dónde obtener las direcciones:');
  console.log('      1. HashScan: https://hashscan.io/mainnet/contracts');
  console.log('      2. SaucerSwap Docs: https://docs.saucerswap.finance/');
  console.log('      3. GitHub: https://github.com/saucerswaplabs\n');
  hasWarnings = true;
}

console.log('\n' + '='.repeat(60) + '\n');

// Resumen
if (hasErrors) {
  console.log('❌ Configuración INCOMPLETA - Hay errores críticos');
  console.log('   → Corrige los errores antes de ejecutar la app\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuración PARCIAL - Hay advertencias');
  console.log('   → La app funcionará parcialmente');
  console.log('   → Configura las direcciones de contratos para funcionalidad completa\n');
  console.log('📚 Próximos pasos:');
  console.log('   1. Lee CONTRACT_ADDRESSES.md para obtener direcciones');
  console.log('   2. Lee SETUP_GUIDE.md para setup completo');
  console.log('   3. Ejecuta: npm run dev\n');
} else {
  console.log('✅ Configuración COMPLETA - Todo listo!');
  console.log('\n🚀 Ejecuta: npm run dev\n');
}

console.log('='.repeat(60) + '\n');
