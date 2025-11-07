/**
 * Script para verificar el balance de tu wallet antes del deployment
 * 
 * Uso:
 * node scripts/check-balance.js
 */

const fs = require('fs');
const path = require('path');

// Leer .env.local sin depender de dotenv
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local no existe');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

async function checkBalance() {
  const env = loadEnv();
  const accountId = env.HEDERA_ACCOUNT_ID;
  
  if (!accountId) {
    console.error('❌ Error: HEDERA_ACCOUNT_ID no está configurado en .env.local');
    process.exit(1);
  }

  console.log('🔍 Verificando balance...\n');
  console.log(`Wallet: ${accountId}`);
  console.log(`EVM Address: ${env.YOUR_FEE_WALLET}`);
  console.log(`Network: ${env.NEXT_PUBLIC_HEDERA_NETWORK}\n`);

  const network = env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  const hashscanUrl = `https://hashscan.io/${network}/account/${accountId}`;
  
  console.log('📊 Ver balance en HashScan:');
  console.log(hashscanUrl);
  console.log('\n💡 Necesitas mínimo 50 HBAR para el deployment');
  console.log('💡 Si necesitas más HBAR de testnet: https://portal.hedera.com/faucet');
  
  // Abrir en navegador (macOS)
  const { exec } = require('child_process');
  exec(`open ${hashscanUrl}`);
}

checkBalance();
