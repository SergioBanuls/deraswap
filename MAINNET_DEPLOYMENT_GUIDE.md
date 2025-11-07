# 🚀 Guía de Deployment a Mainnet

Esta guía detalla todos los pasos necesarios para desplegar tus contratos en Hedera mainnet, incluyendo las soluciones a todos los problemas que encontramos en testnet.

---

## 📋 Pre-requisitos

### 1. Balance en Mainnet

Necesitarás **mínimo 100 HBAR** en tu wallet de mainnet para:
- Deploy del Exchange: ~30-40 HBAR
- Deploy del Adapter: ~30-40 HBAR
- Registro del Adapter: ~5-10 HBAR
- Buffer para gas: ~20 HBAR

### 2. Wallet de Mainnet Preparada

- Asegúrate de tener tu private key de mainnet
- Verifica el account ID (formato: 0.0.XXXXXX)
- Convierte a formato EVM para el fee wallet

### 3. Verificar Configuración de Hardhat

El archivo `hardhat.config.js` debe tener configurada la red mainnet:

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

---

## 🔧 Paso 1: Configurar Variables de Entorno

### Actualizar `.env.local`

Añade las variables de mainnet **sin eliminar las de testnet**:

```env
# ============================================
# MAINNET DEPLOYMENT CONFIGURATION
# ============================================

# ⚠️ MAINNET PRIVATE KEY - NEVER COMMIT THIS FILE
# Tu clave privada de Hedera MAINNET
MAINNET_PRIVATE_KEY=tu_private_key_de_mainnet_aqui

# Tu wallet de mainnet en formato Hedera
MAINNET_HEDERA_ACCOUNT_ID=0.0.XXXXXX

# Tu wallet de mainnet en formato EVM (donde recibirás las fees) 🔥
MAINNET_YOUR_FEE_WALLET=0x...

# ============================================
# MAINNET DEPLOYED CONTRACTS (se llenan después del deployment)
# ============================================

# Exchange contract mainnet
MAINNET_EXCHANGE_ADDRESS=

# SaucerSwap V2 Adapter mainnet
MAINNET_SAUCERSWAP_V2_ADAPTER=
```

### Convertir tu Account ID a formato EVM

```bash
# Ejecuta este comando con tu account ID de mainnet
node -e "
const accountId = '0.0.XXXXXX'; // REEMPLAZA CON TU ACCOUNT ID
const num = accountId.split('.')[2];
const hex = '0x' + num.toString(16).padStart(40, '0');
console.log('Account ID:', accountId);
console.log('EVM Address:', hex);
"
```

---

## 🛠️ Paso 2: Modificar Scripts para Mainnet

### Opción A: Usar Variable de Entorno Dinámica (Recomendado)

Modifica `scripts/02-deploy-adapter.js` para usar la variable correcta según la red:

```javascript
async function main() {
  console.log("🚀 Desplegando SaucerSwapV2Adapter...");
  
  const network = hre.network.name;
  
  // Seleccionar la variable de entorno correcta según la red
  const YOUR_FEE_WALLET = network === "mainnet" 
    ? process.env.MAINNET_YOUR_FEE_WALLET 
    : process.env.YOUR_FEE_WALLET;
  
  if (!YOUR_FEE_WALLET || YOUR_FEE_WALLET === "0x...") {
    console.error(`❌ ERROR: Debes configurar ${network === "mainnet" ? "MAINNET_YOUR_FEE_WALLET" : "YOUR_FEE_WALLET"} en el .env`);
    process.exit(1);
  }
  
  // ... resto del código
}
```

### Opción B: Crear Scripts Separados

Puedes duplicar los scripts con sufijo `-mainnet.js` si prefieres tener scripts dedicados.

---

## 🔍 Paso 3: Verificar Direcciones de Contratos de Mainnet

### Actualizar en `scripts/02-deploy-adapter.js`

Las direcciones de SaucerSwap V2 en mainnet son diferentes a testnet:

```javascript
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
```

**⚠️ IMPORTANTE:** Estas direcciones ya están configuradas en tu script, solo asegúrate de que estén correctas.

---

## 🚨 Paso 4: Solucionar Errores Conocidos

### Error 1: Hardhat ESM vs CommonJS

**Problema:** Hardhat 3.x requiere ESM pero Next.js puede causar conflictos.

**Solución:** Ya instalamos Hardhat 2.27.0 que funciona con CommonJS.

```bash
# Verificar versión
npx hardhat --version
# Debe mostrar: 2.27.0
```

Si tienes Hardhat 3.x:
```bash
pnpm remove hardhat @nomicfoundation/hardhat-toolbox
pnpm add -D hardhat@^2.19.0 @nomicfoundation/hardhat-toolbox@^2.0.0
```

### Error 2: Ethers v6 vs v5

**Problema:** Hardhat 2.x requiere ethers v5, pero puede tener v6 instalado.

**Solución:**
```bash
pnpm remove ethers
pnpm add -D ethers@^5.7.2
```

### Error 3: Node.js 23.11.0 no soportado

**Problema:** Hardhat recomienda Node.js LTS (v22.10.0).

**Solución (opcional pero recomendada):**
```bash
# Instalar nvm si no lo tienes
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js LTS
nvm install 22.10.0
nvm use 22.10.0

# Verificar
node --version
```

**Alternativa:** Continuar con Node.js 23.11.0 (funciona pero con warnings).

### Error 4: "network does not support ENS"

**Problema:** Direcciones como `"0x..."` causan error de resolución ENS.

**Solución:** Asegúrate de que TODAS las direcciones estén completas en los scripts (ya solucionado en testnet).

---

## 📦 Paso 5: Compilar Contratos

Antes de desplegar, asegúrate de que los contratos compilen correctamente:

```bash
# Limpiar compilaciones anteriores
rm -rf artifacts cache

# Compilar
npx hardhat compile
```

**Salida esperada:**
```
Compiled 16 Solidity files successfully (evm target: paris).
```

**⚠️ Si hay errores:**
- Verifica que tengas Hardhat 2.x: `npx hardhat --version`
- Verifica que tengas ethers 5.x: `pnpm list ethers`
- Verifica que el archivo `hardhat.config.js` existe (no `.cjs` ni `.mjs`)

---

## 🚀 Paso 6: Deployment Secuencial

### 6.1. Verificar Balance

```bash
# Modifica check-balance.js para mainnet
node scripts/check-balance.js
```

O verifica manualmente en HashScan:
```
https://hashscan.io/mainnet/account/0.0.XXXXXX
```

### 6.2. Deploy Exchange Contract

```bash
npx hardhat run scripts/01-deploy-exchange.js --network mainnet
```

**Salida esperada:**
```
🚀 Desplegando contrato Exchange...
✅ Exchange desplegado en: 0x...

📝 Guarda esta dirección en tu .env:
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x...
```

**⚠️ IMPORTANTE:** Guarda inmediatamente esta dirección en `.env.local`:
```env
MAINNET_EXCHANGE_ADDRESS=0x...
```

**Tiempo estimado:** 30-60 segundos

### 6.3. Deploy SaucerSwap V2 Adapter

```bash
npx hardhat run scripts/02-deploy-adapter.js --network mainnet
```

**Salida esperada:**
```
🚀 Desplegando SaucerSwapV2Adapter...

📋 Configuración:
- Fee Wallet: 0x... (tu wallet mainnet)
- Router: 0x00000000000000000000000000000000007b925f
- Fee: 0.3%
- Network: mainnet

✅ SaucerSwapV2Adapter desplegado en: 0x...
```

**⚠️ IMPORTANTE:** Guarda esta dirección en `.env.local`:
```env
MAINNET_SAUCERSWAP_V2_ADAPTER=0x...
```

**Tiempo estimado:** 30-60 segundos

### 6.4. Registrar Adapter en Exchange

```bash
npx hardhat run scripts/03-register-adapters.js --network mainnet
```

**Salida esperada:**
```
🔗 Registrando adapters en Exchange...

Registrando SaucerSwapV2...
✅ SaucerSwapV2 adapter registrado!

✓ Verificación: CORRECTO
```

**Tiempo estimado:** 10-20 segundos

---

## 🔄 Paso 7: Actualizar Configuración del Frontend

### 7.1. Actualizar `.env.local`

```env
# Cambiar de testnet a mainnet
NEXT_PUBLIC_HEDERA_NETWORK=mainnet

# Cambiar de etaswap a custom
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom

# Usar tu contrato desplegado
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x... # Dirección del Exchange en mainnet
NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.XXX # Opcional, para referencia
```

### 7.2. Restaurar Hook Original de Mainnet

El hook de testnet usa cálculo local de precios porque la API de ETASwap solo funciona en mainnet. Para mainnet, usa el hook original:

```bash
# Restaurar el hook de mainnet
mv hooks/useSwapRoutes.mainnet.ts hooks/useSwapRoutes.ts
```

**⚠️ IMPORTANTE:** Este paso es CRÍTICO. El hook de mainnet usa la API de ETASwap para calcular las mejores rutas, lo cual solo funciona en mainnet.

---

## ✅ Paso 8: Verificación Post-Deployment

### 8.1. Verificar en HashScan

Visita tus contratos en HashScan mainnet:

**Exchange:**
```
https://hashscan.io/mainnet/address/[MAINNET_EXCHANGE_ADDRESS]
```

**Adapter:**
```
https://hashscan.io/mainnet/address/[MAINNET_SAUCERSWAP_V2_ADAPTER]
```

**Tu Wallet de Fees:**
```
https://hashscan.io/mainnet/account/[TU_MAINNET_ACCOUNT_ID]
```

### 8.2. Verificar Código del Contrato

En HashScan, verifica:
- ✅ El contrato está desplegado
- ✅ La transacción fue exitosa
- ✅ El balance del contrato es 0 (no debe tener fondos atrapados)

### 8.3. Verificar Fee Wallet en el Adapter

Puedes verificar el fee wallet leyendo el contrato:

```bash
npx hardhat console --network mainnet
```

Luego en la consola:
```javascript
const adapter = await ethers.getContractAt("SaucerSwapV2Adapter", "0x..."); // Tu adapter address
const feeWallet = await adapter.feeWallet();
console.log("Fee Wallet:", feeWallet);
// Debe mostrar tu wallet en formato EVM
```

---

## 🧪 Paso 9: Testing en Mainnet

### 9.1. Reiniciar el Servidor

```bash
pnpm dev
```

### 9.2. Swap de Prueba Pequeño

1. Conecta tu wallet de mainnet
2. Selecciona un par de tokens (ej: HBAR → SAUCE)
3. Ingresa una cantidad PEQUEÑA para testing (ej: 5-10 HBAR)
4. Revisa la ruta propuesta
5. Confirma y firma la transacción

### 9.3. Verificar Fees Recibidas

Después de unos segundos:

1. Ve a HashScan: `https://hashscan.io/mainnet/account/[TU_ACCOUNT_ID]`
2. Busca la transacción de fees entrante
3. Debería ser el 0.3% del monto del swap

**Ejemplo:**
- Swap de 100 HBAR → USDC
- Fee esperada: 0.3 HBAR (100 × 0.003)

---

## 🚨 Troubleshooting Mainnet

### Error: "Insufficient HBAR balance"

**Solución:** Transfiere más HBAR a tu wallet de mainnet.

### Error: "Transaction failed" durante deployment

**Posibles causas:**
1. Gas insuficiente
2. Dirección de router incorrecta
3. Problema de red

**Solución:**
```bash
# Verificar balance
node -e "console.log(process.env.MAINNET_HEDERA_ACCOUNT_ID)"

# Ver en HashScan
# Verificar transacciones fallidas
```

### Error: "Adapter not found" al hacer swap

**Causa:** El adapter no está registrado correctamente.

**Solución:**
```bash
# Re-ejecutar registro
npx hardhat run scripts/03-register-adapters.js --network mainnet
```

### Fees no llegan a tu wallet

**Verificación:**
1. ¿El swap se completó? → Ver en HashScan
2. ¿El monto fue suficiente? → Swaps muy pequeños pueden generar fees < 0.001 HBAR
3. ¿El adapter tiene tu wallet? → Verificar con `hardhat console`

---

## 📊 Monitoreo Post-Deployment

### Dashboard de Monitoreo

Crea un documento para trackear tus métricas:

```markdown
# Métricas de Mainnet

- **Total Swaps:** Cuenta las transacciones en tu Exchange
- **Total Fees Recibidas:** Suma de fees en tu wallet
- **Volumen Total:** Suma de todos los swaps
- **Fee Promedio:** Total fees / Total swaps
```

### Alertas

Configura alertas para:
- Fees recibidas (Telegram, Discord, email)
- Errors en contratos
- Gas unusualmente alto

---

## 🔐 Seguridad Post-Deployment

### 1. Backup de Información Crítica

Guarda de forma SEGURA:
- Private key de mainnet
- Direcciones de contratos desplegados
- Account IDs
- ABI de los contratos

### 2. Revocar Permisos Innecesarios

Si tu wallet tiene permisos de admin en otros contratos, revócalos.

### 3. Monitorear Actividad Sospechosa

Revisa diariamente HashScan para:
- Transacciones no esperadas
- Cambios en balance
- Llamadas a funciones administrativas

---

## 📝 Checklist Final de Mainnet

### Pre-Deployment
- [ ] Balance de mainnet > 100 HBAR
- [ ] Private key de mainnet en `.env.local`
- [ ] Fee wallet convertido a formato EVM
- [ ] Hardhat 2.x instalado
- [ ] Ethers 5.x instalado
- [ ] Direcciones de SaucerSwap verificadas
- [ ] Contratos compilan sin errores

### Deployment
- [ ] Exchange desplegado exitosamente
- [ ] Adapter desplegado con tu fee wallet
- [ ] Adapter registrado en Exchange
- [ ] Direcciones guardadas en `.env.local`

### Post-Deployment
- [ ] Contratos verificados en HashScan
- [ ] `.env.local` actualizado con mainnet
- [ ] Hook de mainnet restaurado
- [ ] Servidor reiniciado
- [ ] Swap de prueba exitoso
- [ ] Fees verificadas en tu wallet
- [ ] Backup de información crítica
- [ ] Monitoreo configurado

---

## 🎯 Resumen de Comandos

```bash
# 1. Verificar versiones
npx hardhat --version  # Debe ser 2.x
pnpm list ethers       # Debe ser 5.x
node --version         # Recomendado: 22.10.0

# 2. Compilar
rm -rf artifacts cache
npx hardhat compile

# 3. Deploy
npx hardhat run scripts/01-deploy-exchange.js --network mainnet
npx hardhat run scripts/02-deploy-adapter.js --network mainnet
npx hardhat run scripts/03-register-adapters.js --network mainnet

# 4. Verificar
node scripts/check-balance.js  # (si lo modificas para mainnet)

# 5. Frontend
mv hooks/useSwapRoutes.mainnet.ts hooks/useSwapRoutes.ts
# Actualizar .env.local
pnpm dev
```

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. **Revisa los logs:** Hardhat proporciona mensajes de error detallados
2. **Verifica HashScan:** Mira las transacciones fallidas para detalles
3. **Compara con testnet:** Usa las mismas soluciones que funcionaron
4. **Rollback si es necesario:** Puedes volver a desplegar los contratos

---

## 🎉 ¡Éxito!

Una vez completado el deployment en mainnet:

- ✅ Tu contrato Exchange está en producción
- ✅ Tu Adapter está configurado con tu wallet
- ✅ Las fees del 0.3% van directamente a ti
- ✅ Tienes control total sobre el contrato
- ✅ Puedes modificar y actualizar el código

**¡Felicidades! Ya tienes tu propio protocolo de swaps en Hedera mainnet.** 🚀

---

## 📚 Documentos de Referencia

- `DEPLOYMENT_COMPLETE.md` - Resumen del deployment de testnet
- `CONTRACTS_SUMMARY.md` - Explicación técnica de los contratos
- `YOUR_TESTNET_DEPLOYMENT_GUIDE.md` - Guía de testnet completa
- Scripts en `scripts/` - Scripts de deployment configurados
