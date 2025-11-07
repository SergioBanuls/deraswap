# 🔧 Modificaciones de Scripts para Mainnet

Este documento detalla los cambios exactos que debes hacer en los scripts de deployment para que funcionen correctamente en mainnet.

---

## 📝 Archivo: `scripts/02-deploy-adapter.js`

### ❌ ANTES (Solo funciona con una red)

```javascript
const YOUR_FEE_WALLET = process.env.YOUR_FEE_WALLET || "0x...";
```

### ✅ DESPUÉS (Funciona con testnet y mainnet)

Reemplaza la línea que define `YOUR_FEE_WALLET` con:

```javascript
const network = hre.network.name;

// Seleccionar la variable de entorno correcta según la red
const YOUR_FEE_WALLET = network === "mainnet" 
  ? process.env.MAINNET_YOUR_FEE_WALLET 
  : process.env.YOUR_FEE_WALLET;

if (!YOUR_FEE_WALLET || YOUR_FEE_WALLET === "0x...") {
  console.error(`❌ ERROR: Debes configurar ${network === "mainnet" ? "MAINNET_YOUR_FEE_WALLET" : "YOUR_FEE_WALLET"} en el .env`);
  process.exit(1);
}
```

**Ubicación:** Línea ~18 (después de `async function main()`)

---

## 📝 Archivo: `scripts/03-register-adapters.js`

### ❌ ANTES (Solo funciona con una red)

```javascript
const EXCHANGE_ADDRESS = process.env.EXCHANGE_ADDRESS || "0x...";
const SAUCERSWAP_V2_ADAPTER = process.env.SAUCERSWAP_V2_ADAPTER || "0x...";
```

### ✅ DESPUÉS (Funciona con testnet y mainnet)

Reemplaza esas dos líneas con:

```javascript
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
```

**Ubicación:** Línea ~12-16 (después de `async function main()`)

---

## 📝 Archivo: `hardhat.config.js`

### ✅ Verificar Configuración

Tu archivo debe tener esta estructura (ya debería estar configurado):

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '.env.local' });

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296
    },
    mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 295
    }
  },
  paths: {
    sources: "./contracts/solidity"
  }
};
```

**Nota:** La diferencia clave es que mainnet usa `MAINNET_PRIVATE_KEY` en lugar de `PRIVATE_KEY`.

---

## 📝 Archivo: `.env.local`

### ✅ Estructura Completa

Tu `.env.local` debe tener AMBAS configuraciones (testnet y mainnet):

```env
# ============================================
# TESTNET CONFIGURATION
# ============================================

# Private key de testnet
PRIVATE_KEY=tu_private_key_testnet

# Account ID de testnet
HEDERA_ACCOUNT_ID=0.0.7192078

# Fee wallet de testnet (EVM format)
YOUR_FEE_WALLET=0x00000000000000000000000000000000006dbe0e

# Contratos desplegados en testnet
EXCHANGE_ADDRESS=0xCE8E6103859CF600Ee42b1B52Cbf07bADBC42D33
SAUCERSWAP_V2_ADAPTER=0x45C3eefbff223D21d87252D348e37f3826b1f3bA

# ============================================
# MAINNET CONFIGURATION
# ============================================

# Private key de mainnet
MAINNET_PRIVATE_KEY=tu_private_key_mainnet

# Account ID de mainnet
MAINNET_HEDERA_ACCOUNT_ID=0.0.XXXXXX

# Fee wallet de mainnet (EVM format)
MAINNET_YOUR_FEE_WALLET=0x...

# Contratos desplegados en mainnet (se llenan después del deployment)
MAINNET_EXCHANGE_ADDRESS=
MAINNET_SAUCERSWAP_V2_ADAPTER=

# ============================================
# FRONTEND CONFIGURATION (cambiar según la red activa)
# ============================================

# Network actual (testnet o mainnet)
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# Swap router type (etaswap o custom)
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom

# Custom router address (usar testnet o mainnet según corresponda)
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0xCE8E6103859CF600Ee42b1B52Cbf07bADBC42D33
```

---

## 🔄 Resumen de Cambios Necesarios

| Archivo | Línea | Cambio | Propósito |
|---------|-------|--------|-----------|
| `scripts/02-deploy-adapter.js` | ~18 | Añadir detección de network | Usar fee wallet correcto |
| `scripts/03-register-adapters.js` | ~12-16 | Añadir detección de network | Usar direcciones correctas |
| `hardhat.config.js` | N/A | Verificar config mainnet | Ya configurado |
| `.env.local` | N/A | Añadir variables mainnet | Credenciales separadas |

---

## 🎯 Aplicar Cambios Ahora

### Opción 1: Editar Manualmente

Abre cada archivo y aplica los cambios mostrados arriba.

### Opción 2: Script de Parche (Recomendado)

Crea un archivo `patch-for-mainnet.sh`:

```bash
#!/bin/bash

echo "🔧 Aplicando parches para soporte de mainnet..."

# Backup de archivos originales
cp scripts/02-deploy-adapter.js scripts/02-deploy-adapter.js.backup
cp scripts/03-register-adapters.js scripts/03-register-adapters.js.backup

echo "✅ Backups creados"
echo ""
echo "⚠️  Ahora debes editar manualmente los archivos según SCRIPT_MODIFICATIONS_FOR_MAINNET.md"
echo ""
echo "Archivos a modificar:"
echo "  - scripts/02-deploy-adapter.js (línea ~18)"
echo "  - scripts/03-register-adapters.js (línea ~12-16)"
echo ""
echo "Cuando termines, ejecuta los comandos de deployment normalmente."
```

Ejecuta:

```bash
chmod +x patch-for-mainnet.sh
./patch-for-mainnet.sh
```

---

## ✅ Verificar Cambios

Después de hacer las modificaciones, verifica que funcionen:

### Test 1: Compilar sin errores

```bash
npx hardhat compile
```

### Test 2: Verificar variables de testnet

```bash
npx hardhat run scripts/02-deploy-adapter.js --network testnet --dry-run
```

Debe mostrar: `Fee Wallet: 0x00000000000000000000000000000000006dbe0e`

### Test 3: Verificar variables de mainnet

```bash
# Primero configura MAINNET_YOUR_FEE_WALLET en .env.local
npx hardhat run scripts/02-deploy-adapter.js --network mainnet --dry-run
```

Debe mostrar: `Fee Wallet: [tu mainnet fee wallet]`

---

## 🐛 Troubleshooting

### Error: "MAINNET_YOUR_FEE_WALLET is not defined"

**Causa:** No agregaste las variables de mainnet a `.env.local`

**Solución:** Añade las variables mostradas arriba en `.env.local`

### Error: Scripts siguen usando variables de testnet en mainnet

**Causa:** No aplicaste los cambios en los scripts

**Solución:** Verifica que hayas añadido el código de detección de network

### Cambios no se reflejan

**Causa:** Cache de Node.js

**Solución:**
```bash
# Limpiar cache
rm -rf node_modules/.cache
rm -rf artifacts cache

# Re-compilar
npx hardhat compile
```

---

## 📚 Ejemplo Completo: `02-deploy-adapter.js` Modificado

Aquí está el archivo completo con los cambios aplicados:

```javascript
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
  let SAUCERSWAP_V2_ROUTER, WHBAR_TOKEN, WHBAR_CONTRACT;
  
  if (network === "mainnet") {
    // Mainnet addresses (VERIFICADAS)
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000007b925f"; // 0.0.8100447
    WHBAR_TOKEN = "0x0000000000000000000000000000000000163a3a"; // 0.0.1456698
    WHBAR_CONTRACT = "0x0000000000000000000000000000000000163a3a";
  } else {
    // Testnet addresses
    SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000002ad431"; // 0.0.2806833
    WHBAR_TOKEN = "0x0000000000000000000000000000000000068e26"; // 0.0.429606
    WHBAR_CONTRACT = "0x0000000000000000000000000000000000068e26";
  }
  
  const FEE_PROMILLE = 3; // 0.3% fee (igual que ETASwap)

  console.log(`\n📋 Configuración:`);
  console.log(`- Fee Wallet: ${YOUR_FEE_WALLET}`);
  console.log(`- Router: ${SAUCERSWAP_V2_ROUTER}`);
  console.log(`- Fee: ${FEE_PROMILLE / 10}%`);
  console.log(`- Network: ${network}\n`);

  // Deploy
  const SaucerSwapV2Adapter = await hre.ethers.getContractFactory("SaucerSwapV2Adapter");
  const adapter = await SaucerSwapV2Adapter.deploy(
    YOUR_FEE_WALLET,      // 🔥 AQUÍ VAN TUS FEES
    SAUCERSWAP_V2_ROUTER,
    FEE_PROMILLE,
    WHBAR_TOKEN,
    WHBAR_CONTRACT
  );

  await adapter.deployed();

  console.log(`✅ SaucerSwapV2Adapter desplegado en: ${adapter.address}`);
  
  // Convertir a Hedera ID
  const addressBigInt = BigInt(adapter.address);
  const hederaId = `0.0.${addressBigInt}`;
  
  console.log(`\n📝 Guarda esta dirección para registrarla en el Exchange`);
  console.log(`Hedera ID: ${hederaId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 🎯 Próximos Pasos

1. ✅ Aplicar las modificaciones en los scripts
2. ✅ Añadir variables de mainnet en `.env.local`
3. ✅ Verificar que compile correctamente
4. ✅ Proceder con el deployment usando la guía principal

---

**Documentos relacionados:**
- `MAINNET_DEPLOYMENT_GUIDE.md` - Guía completa de deployment
- `MAINNET_QUICK_CHECKLIST.md` - Checklist rápido
