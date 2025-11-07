# ✅ CHECKLIST PRE-DEPLOYMENT V1 ADAPTER
## ⚠️ NO DESPLEGAR HASTA COMPLETAR TODOS LOS PASOS

---

## PASO 1: ENCONTRAR DIRECCION DEL V1 ROUTER 🔍

**CRÍTICO**: Necesitamos la dirección exacta del SaucerSwap V1 Router en mainnet.

### Opciones para encontrarla:

#### Opción A: HashScan (RECOMENDADO)
1. Ve a https://hashscan.io/mainnet
2. Busca "SaucerSwap" o navega por contratos conocidos
3. Busca el V1 Router (anterior al V2 router 0.0.3949434)
4. Posibles nombres: "SaucerSwap Router", "UniswapV2Router02", etc.

#### Opción B: SaucerSwap Interface
1. Ve a https://www.saucerswap.finance/swap
2. Abre DevTools > Network
3. Haz un swap de prueba
4. Busca en las llamadas al contrato la dirección del router
5. Compara con 0.0.3949434 (V2) - el V1 debería ser diferente

#### Opción C: Preguntar a SaucerSwap
1. Discord de SaucerSwap
2. Telegram
3. Twitter @SaucerSwapLabs

#### Opción D: Revisar transacciones antiguas
1. Busca en HashScan transacciones de swap antiguas (antes de que existiera V2)
2. Ve qué router contract se usaba

### ✍️ UNA VEZ ENCONTRADO:

Anota aquí la dirección:
```
V1 Router (Hedera ID): 0.0.________
V1 Router (EVM): 0x________________________________________
```

**Verifica que sea diferente de:**
- V2 Router: `0.0.3949434` (`0x00000000000000000000000000000000003c437a`)

---

## PASO 2: VERIFICAR PARÁMETROS DEL CONTRATO ✅

### Parámetros del constructor:

```javascript
// TU WALLET DE FEES (mainnet)
FEE_WALLET = process.env.MAINNET_YOUR_FEE_WALLET
// Debe ser: 0x...

// ROUTER V1 (encontrado en PASO 1)
SAUCERSWAP_V1_ROUTER = "0x..." // ← COMPLETAR

// FEE (igual que V2)
FEE_PROMILLE = 3  // 0.3%

// WHBAR TOKEN (mainnet - igual que V2)
WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"  // 0.0.1456986

// WHBAR CONTRACT (mainnet - igual que V2)
WHBAR_CONTRACT = "0x0000000000000000000000000000000000163b59"  // 0.0.1456985
```

### ✅ Verificaciones:

- [ ] `MAINNET_YOUR_FEE_WALLET` existe en `.env.local`
- [ ] `SAUCERSWAP_V1_ROUTER` está configurado (NO es 0x000...000)
- [ ] WHBAR addresses son los mismos que usaste en V2
- [ ] Network es `mainnet`
- [ ] Tienes al menos 15-20 HBAR en tu cuenta operadora

---

## PASO 3: VERIFICAR EL CONTRATO SOLIDITY ✅

### Checklist del código:

```bash
# 1. Verificar que el contrato compila
npx hardhat compile

# Debe mostrar:
# ✅ Compiled 21 Solidity files successfully
```

### Verificaciones del código:

- [ ] `SaucerSwapV1Adapter.sol` existe
- [ ] `IUniswapV2Router.sol` existe
- [ ] Compila sin errores
- [ ] `viaIR: true` está habilitado en `hardhat.config.js`

### Diferencias críticas V1 vs V2:

| Concepto | V2 | V1 |
|----------|----|----|
| Router Interface | `IUniswapV3Router` | `IUniswapV2Router` ✅ |
| Swap Function | `exactInput/exactOutput` | `swapExactTokensForTokens` ✅ |
| Path Decode | Bytes path | `abi.decode(path, (address[]))` ✅ |
| Fee Handling | Embedded in path | No embedded ✅ |

---

## PASO 4: PREPARAR ENTORNO (.env.local) 📝

### Verifica que existan:

```bash
# Operador mainnet
HEDERA_ACCOUNT_ID=0.0.XXXXXX
MAINNET_PRIVATE_KEY=xxxxxxxxxx

# Fee wallet (TU wallet para recibir fees)
MAINNET_YOUR_FEE_WALLET=0x...

# Router V1 (del PASO 1)
SAUCERSWAP_V1_ROUTER=0x...  # ← AÑADIR ESTA LÍNEA
```

### ✅ Verificaciones:

- [ ] `HEDERA_ACCOUNT_ID` es tu cuenta de mainnet
- [ ] `MAINNET_PRIVATE_KEY` es la clave correcta (DER format sin 0x)
- [ ] `MAINNET_YOUR_FEE_WALLET` es TU wallet (no la de ETASwap)
- [ ] `SAUCERSWAP_V1_ROUTER` está configurado

---

## PASO 5: SIMULAR DEPLOYMENT (DRY RUN) 🧪

### Verificar parámetros sin ejecutar:

```javascript
// Edita temporalmente el script para solo MOSTRAR parámetros:
console.log('PARÁMETROS QUE SE USARÁN:');
console.log('Fee Wallet:', FEE_WALLET);
console.log('Router V1:', SAUCERSWAP_V1_ROUTER);
console.log('Fee Promille:', FEE_PROMILLE);
console.log('WHBAR Token:', WHBAR_TOKEN);
console.log('WHBAR Contract:', WHBAR_CONTRACT);
// process.exit(0); // ← Descomentar para no desplegar
```

### ✅ Ejecutar:

```bash
node scripts/deploy-v1-adapter-mainnet.js --network mainnet
```

### Verifica la salida:

- [ ] Fee Wallet es TU wallet
- [ ] Router V1 es la dirección correcta (del PASO 1)
- [ ] WHBAR addresses son correctos
- [ ] Network dice "mainnet"

---

## PASO 6: DEPLOYMENT REAL 🚀

### Solo si TODOS los pasos anteriores están ✅

```bash
# 1. Verifica balance
node scripts/check-balance.js

# 2. Deploy (comentar la línea process.exit(0) del dry run)
node scripts/deploy-v1-adapter-mainnet.js --network mainnet
```

### Captura estos datos:

```
Contract ID: 0.0.________
EVM Address: 0x________________________________________
Transaction ID: ________
Gas Used: ________
Cost: ________ HBAR
```

### ✅ Verificaciones post-deployment:

- [ ] Contract ID existe en HashScan
- [ ] Balance de HBAR disminuyó correctamente
- [ ] Guardaste Contract ID y EVM Address

---

## PASO 7: ACTUALIZAR .env.local 📝

Añadir:

```bash
# V1 Adapter (mainnet)
SAUCERSWAP_V1_ADAPTER=0x...  # EVM Address del PASO 6
SAUCERSWAP_V1_ADAPTER_ID=0.0.XXXXXX  # Contract ID del PASO 6
```

---

## PASO 8: REGISTRAR EN EXCHANGE 📝

### Script de registro:

```javascript
const aggregatorId = "SaucerSwapV1";
const adapterAddress = process.env.SAUCERSWAP_V1_ADAPTER;
```

### ✅ Ejecutar:

```bash
node scripts/register-new-adapter.js
# Ingresar: SaucerSwapV1
# Ingresar: (dirección del PASO 6)
```

---

## PASO 9: ASOCIAR TOKENS AL ADAPTER 🔗

Actualizar `app/api/ensure-tokens-associated/route.ts`:

```javascript
const V1_ADAPTER_CONTRACT_ID = process.env.SAUCERSWAP_V1_ADAPTER_ID || '0.0.XXXXXX';
```

Asociar tokens comunes:
- WHBAR: 0.0.1456986
- USDC: 0.0.456858
- SAUCE: 0.0.731861
- HBAR: No necesita asociación

---

## PASO 10: TESTING 🧪

### Test 1: HBAR → SAUCE

1. Ve a tu app en mainnet
2. Selecciona HBAR → SAUCE
3. Ingresa cantidad pequeña (ej: 1 HBAR)
4. Verifica que aparezca ruta V1
5. **NO EJECUTES** todavía

### Test 2: Verificar en consola

Debe mostrar:
```
Available aggregators from ETASwap: [..., 'SaucerSwapV1']
Filtered to SaucerSwap routes: X/Y routes (V1 + V2)
📍 V1 route detected, encoding address array: [...]
```

### Test 3: Ejecutar swap pequeño

1. Swap de 1-2 HBAR → SAUCE
2. Verificar que la transacción sea exitosa
3. Verificar que SAUCE llegue a tu wallet
4. Verificar que las fees lleguen a tu fee wallet

---

## ⚠️ COSAS QUE PUEDEN SALIR MAL

### Error: "Stack too deep"
**Solución**: Ya está resuelto con `viaIR: true` ✅

### Error: "SAUCERSWAP_V1_ROUTER not configured"
**Solución**: Completa PASO 1 y añade a `.env.local`

### Error: "CONTRACT_REVERT_EXECUTED"
**Posibles causas**:
1. Router V1 address incorrecto
2. Path encoding incorrecto
3. Token no asociado al adapter
4. Slippage muy bajo

### Error: "Invalid signature"
**Solución**: Verifica que MAINNET_PRIVATE_KEY sea correcta (DER format)

---

## COSTO ESTIMADO

- **Deployment**: 10-15 HBAR
- **Registro**: ~1 HBAR
- **Asociación de tokens**: ~1 HBAR por token
- **Test swap**: 1-2 HBAR
- **Total**: ~15-20 HBAR

---

## ANTES DE EMPEZAR

- [ ] Tengo al menos 20 HBAR en mi cuenta
- [ ] He leído TODO este checklist
- [ ] Entiendo cada paso
- [ ] Tengo la dirección del V1 Router confirmada
- [ ] He verificado TODOS los parámetros
- [ ] Estoy listo para desplegar SIN errores

---

## 🎯 SIGUIENTE ACCIÓN

**AHORA**: Buscar la dirección del SaucerSwap V1 Router siguiendo el PASO 1.

**NO CONTINUAR** hasta tener la dirección confirmada y verificada.
