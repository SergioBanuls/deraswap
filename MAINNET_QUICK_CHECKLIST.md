# ⚡ Checklist Rápido: Deployment a Mainnet

Usa esta lista de verificación rápida cuando estés listo para desplegar a mainnet.

---

## 🔴 ANTES DE EMPEZAR

### Balance y Credenciales

- [ ] Tengo **mínimo 100 HBAR** en mi wallet de mainnet
- [ ] Tengo mi **private key de mainnet** guardada de forma segura
- [ ] Conozco mi **Account ID de mainnet** (formato: 0.0.XXXXXX)
- [ ] He convertido mi Account ID a **formato EVM** para fees

```bash
# Convertir Account ID a EVM
node -e "
const accountId = '0.0.XXXXXX'; // TU ACCOUNT ID
const num = accountId.split('.')[2];
const hex = '0x' + num.toString(16).padStart(40, '0');
console.log('EVM Address:', hex);
"
```

### Verificar Versiones

- [ ] Hardhat versión 2.x (NO 3.x)
- [ ] Ethers versión 5.x (NO 6.x)
- [ ] Node.js recomendado: 22.10.0 (funciona con 23.11.0 pero con warnings)

```bash
npx hardhat --version    # Debe mostrar 2.x
pnpm list ethers         # Debe mostrar 5.x
node --version           # Recomendado: v22.10.0
```

**Si las versiones son incorrectas:**

```bash
# Instalar versiones correctas
pnpm remove hardhat @nomicfoundation/hardhat-toolbox ethers
pnpm add -D hardhat@^2.19.0 @nomicfoundation/hardhat-toolbox@^2.0.0 ethers@^5.7.2
```

---

## 🔧 CONFIGURACIÓN

### 1. Actualizar `.env.local`

Añade estas líneas al **final** del archivo (sin borrar testnet):

```env
# ============================================
# MAINNET DEPLOYMENT CONFIGURATION
# ============================================

# Private key de mainnet
MAINNET_PRIVATE_KEY=tu_private_key_aqui

# Account ID de mainnet
MAINNET_HEDERA_ACCOUNT_ID=0.0.XXXXXX

# Fee wallet en formato EVM
MAINNET_YOUR_FEE_WALLET=0x...

# Contratos desplegados (se llenan después)
MAINNET_EXCHANGE_ADDRESS=
MAINNET_SAUCERSWAP_V2_ADAPTER=
```

### 2. Verificar `hardhat.config.js`

Debe tener la configuración de mainnet:

```javascript
networks: {
  mainnet: {
    url: "https://mainnet.hashio.io/api",
    accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
    chainId: 295
  }
}
```

### 3. Modificar `scripts/02-deploy-adapter.js`

Busca la línea que define `YOUR_FEE_WALLET` y cámbiala a:

```javascript
const network = hre.network.name;

const YOUR_FEE_WALLET = network === "mainnet" 
  ? process.env.MAINNET_YOUR_FEE_WALLET 
  : process.env.YOUR_FEE_WALLET;
```

### 4. Verificar Direcciones de SaucerSwap

En `scripts/02-deploy-adapter.js`, confirma que estén estas direcciones de mainnet:

```javascript
if (network === "mainnet") {
  SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000007b925f"; // 0.0.8100447
  WHBAR_TOKEN = "0x0000000000000000000000000000000000163a3a"; // 0.0.1456698
  WHBAR_CONTRACT = "0x0000000000000000000000000000000000163a3a";
}
```

---

## 🚀 DEPLOYMENT

### Paso 1: Compilar

```bash
rm -rf artifacts cache
npx hardhat compile
```

✅ **Resultado esperado:** `Compiled 16 Solidity files successfully`

❌ **Si falla:** Revisa las versiones de Hardhat y Ethers arriba

### Paso 2: Desplegar Exchange

```bash
npx hardhat run scripts/01-deploy-exchange.js --network mainnet
```

✅ **Copia la dirección** y actualiza `.env.local`:

```env
MAINNET_EXCHANGE_ADDRESS=0x...
```

⏱️ **Tiempo:** ~30-60 segundos

### Paso 3: Desplegar Adapter

```bash
npx hardhat run scripts/02-deploy-adapter.js --network mainnet
```

✅ **Copia la dirección** y actualiza `.env.local`:

```env
MAINNET_SAUCERSWAP_V2_ADAPTER=0x...
```

⏱️ **Tiempo:** ~30-60 segundos

### Paso 4: Registrar Adapter

**ANTES DE EJECUTAR:** Actualiza `.env.local` con las direcciones copiadas arriba.

Luego modifica el script `03-register-adapters.js` para usar las variables de mainnet:

```javascript
const network = hre.network.name;

const EXCHANGE_ADDRESS = network === "mainnet"
  ? process.env.MAINNET_EXCHANGE_ADDRESS
  : process.env.EXCHANGE_ADDRESS;

const SAUCERSWAP_V2_ADAPTER = network === "mainnet"
  ? process.env.MAINNET_SAUCERSWAP_V2_ADAPTER
  : process.env.SAUCERSWAP_V2_ADAPTER;
```

Ahora ejecuta:

```bash
npx hardhat run scripts/03-register-adapters.js --network mainnet
```

✅ **Resultado esperado:** `✅ SaucerSwapV2 adapter registrado!`

⏱️ **Tiempo:** ~10-20 segundos

---

## 🎨 ACTUALIZAR FRONTEND

### 1. Cambiar a Mainnet en `.env.local`

```env
# Cambiar network
NEXT_PUBLIC_HEDERA_NETWORK=mainnet

# Cambiar a custom router
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom

# Usar tu contrato
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=[MAINNET_EXCHANGE_ADDRESS]
```

### 2. Restaurar Hook de Mainnet

```bash
# El hook de mainnet usa la API de ETASwap que solo funciona en mainnet
mv hooks/useSwapRoutes.mainnet.ts hooks/useSwapRoutes.ts
```

### 3. Reiniciar Servidor

```bash
pnpm dev
```

---

## ✅ VERIFICACIÓN

### 1. HashScan

Verifica que los contratos estén desplegados:

- Exchange: `https://hashscan.io/mainnet/address/[MAINNET_EXCHANGE_ADDRESS]`
- Adapter: `https://hashscan.io/mainnet/address/[MAINNET_SAUCERSWAP_V2_ADAPTER]`
- Tu wallet: `https://hashscan.io/mainnet/account/[MAINNET_HEDERA_ACCOUNT_ID]`

### 2. Verificar Fee Wallet en el Adapter

```bash
npx hardhat console --network mainnet
```

En la consola:

```javascript
const adapter = await ethers.getContractAt("SaucerSwapV2Adapter", "[MAINNET_SAUCERSWAP_V2_ADAPTER]");
const feeWallet = await adapter.feeWallet();
console.log("Fee Wallet:", feeWallet);
// Debe mostrar: MAINNET_YOUR_FEE_WALLET
```

### 3. Swap de Prueba

- [ ] Conectar wallet de mainnet
- [ ] Seleccionar tokens (ej: HBAR → SAUCE)
- [ ] Ingresar cantidad PEQUEÑA (5-10 HBAR)
- [ ] Confirmar y firmar
- [ ] Esperar confirmación

### 4. Verificar Fees

Ve a HashScan y busca la transacción de fee entrante (0.3% del swap):

`https://hashscan.io/mainnet/account/[MAINNET_HEDERA_ACCOUNT_ID]`

---

## 🚨 SI ALGO FALLA

### Deployment Falla

**Error:** "Insufficient HBAR balance"
- **Solución:** Transfiere más HBAR (mínimo 100)

**Error:** "network does not support ENS"
- **Solución:** Verifica que TODAS las direcciones en los scripts estén completas (no `"0x..."`)

**Error:** Hardhat ESM error
- **Solución:** Downgrade a Hardhat 2.x (ver arriba)

**Error:** Ethers version mismatch
- **Solución:** Instala ethers 5.x (ver arriba)

### Swap Falla

**Error:** "Transaction failed"
- **Solución:** Verifica gas, balance, token association

**Error:** "Adapter not found"
- **Solución:** Re-ejecuta el script 03

### Fees No Llegan

1. ¿El swap se completó? → Ver HashScan
2. ¿El monto fue suficiente? → Mínimo ~1 HBAR para ver fees visibles
3. ¿El adapter tiene tu wallet? → Verificar con console (arriba)

---

## 🎯 RESUMEN

Total de comandos a ejecutar:

```bash
# 1. Verificar versiones
npx hardhat --version
pnpm list ethers

# 2. Compilar
rm -rf artifacts cache
npx hardhat compile

# 3. Desplegar (y copiar direcciones después de cada paso)
npx hardhat run scripts/01-deploy-exchange.js --network mainnet
npx hardhat run scripts/02-deploy-adapter.js --network mainnet
npx hardhat run scripts/03-register-adapters.js --network mainnet

# 4. Actualizar frontend
mv hooks/useSwapRoutes.mainnet.ts hooks/useSwapRoutes.ts
# Editar .env.local
pnpm dev

# 5. Testing
# Hacer swap de prueba en la UI
```

---

## 📊 COSTO TOTAL ESTIMADO

- Exchange deployment: ~35 HBAR
- Adapter deployment: ~35 HBAR
- Adapter registration: ~8 HBAR
- Testing swaps: ~5-10 HBAR
- **TOTAL: ~80-90 HBAR**

Recomendamos tener **100 HBAR** como mínimo.

---

## ✅ CHECKLIST FINAL

### Pre-Deployment
- [ ] Balance > 100 HBAR
- [ ] Private key en `.env.local`
- [ ] Fee wallet convertido a EVM
- [ ] Hardhat 2.x instalado
- [ ] Ethers 5.x instalado
- [ ] Scripts modificados para mainnet
- [ ] Compilación exitosa

### Deployment
- [ ] Exchange desplegado
- [ ] Adapter desplegado
- [ ] Adapter registrado
- [ ] Direcciones en `.env.local`

### Post-Deployment
- [ ] Contratos en HashScan ✅
- [ ] Fee wallet verificado
- [ ] Frontend actualizado
- [ ] Hook de mainnet restaurado
- [ ] Swap de prueba ✅
- [ ] Fees verificadas ✅

---

## 🎉 ¡ÉXITO!

Si todos los checks están ✅, tu contrato está en producción y las fees van a tu wallet.

**Siguiente paso:** Monitorear las fees entrantes en HashScan.

---

Para la **guía detallada**, ver: `MAINNET_DEPLOYMENT_GUIDE.md`
