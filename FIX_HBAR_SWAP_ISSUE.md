# 🔧 Fix: HBAR Swap Issue - CONTRACT_REVERT_EXECUTED

## 🔍 Problema Identificado

Tu contrato adapter fue desplegado con una **dirección incorrecta de wHBAR que no existe**:

```
❌ Dirección usada: 0x0000000000000000000000000000000000163a3a (0.0.1456698) - NO EXISTE
✅ Dirección correcta: 0x0000000000000000000000000000000000163b5a (0.0.1456986) - "Wrapped Hbar"
```

### ¿Por qué falla el swap?

1. Usuario envía **HBAR nativo** → Exchange → Adapter ✅
2. ETASwap API devuelve un path que empieza con **wHBAR correcto** (`0x163b5a`) ✅
3. El adapter compara:
   - `tokenFrom` (del path) = `0x163b5a` ✅
   - `whbarToken` (del constructor) = `0x163a3a` ❌
4. Como **NO coinciden**, el adapter piensa que NO es un swap de HBAR
5. Intenta hacer: `safeTransferFrom(Exchange, adapter, amount)`
6. El Exchange **no tiene wHBAR ni allowance** → **BOOM** 💥

```
Error: SPENDER_DOES_NOT_HAVE_ALLOWANCE
```

---

## 🛠️ Solución: Re-desplegar Adapter

**No hay forma de actualizar el `whbarToken` existente** porque es `immutable` en el contrato.

Debes **re-desplegar** el adapter con la configuración correcta.

### 📋 Pasos a Seguir

#### **Paso 1: Verificar configuración**

Asegúrate de que `.env.local` tiene tu wallet de fees configurada:

```bash
# Para mainnet (tu wallet principal 0.0.10081592):
MAINNET_YOUR_FEE_WALLET=0x0000000000000000000000000000000000099f88
```

Si no sabes cuál es tu wallet en formato EVM:
- Tu wallet Hedera: `0.0.10081592`
- En formato EVM: `0x0000000000000000000000000000000000099f88`

#### **Paso 2: Re-desplegar el adapter (FIXED)**

```bash
npx hardhat run scripts/redeploy-adapter-fixed.js --network mainnet
```

Este script:
- ✅ Usa la dirección **correcta** de wHBAR (`0x163b5a`)
- ✅ Pasa solo **4 parámetros** al constructor (no 5)
- ✅ Establece fee de **0.25%** (más bajo que ETASwap)
- ✅ Usa tu wallet como destino de fees

**Guarda la dirección del nuevo adapter!** Lo necesitarás en el siguiente paso.

#### **Paso 3: Registrar el nuevo adapter en el Exchange**

```bash
npx hardhat run scripts/register-new-adapter.js --network mainnet
```

Cuando te pregunte:
- **Aggregator ID**: `SaucerSwapV2_V10` (usa V10 para diferenciar del anterior)
- **Adapter Address**: `<dirección del paso 2>`

#### **Paso 4: Actualizar el frontend**

Necesitas actualizar `hooks/useSwapRoutes.ts` para mapear el aggregator de ETASwap al nuevo:

Busca la función que procesa las rutas y agrega un mapeo:

```typescript
// Mapear aggregators de ETASwap a los nuestros
const aggregatorMapping: Record<string, string> = {
  'SaucerSwapV2': 'SaucerSwapV2_V10',  // ✅ Usar nuestro adapter
  'SaucerSwapV2_V9': 'SaucerSwapV2_V10', // ✅ Backward compatibility
  // ... otros mapeos si los necesitas
};

// Al procesar rutas, mapea el aggregatorId
route.aggregatorId = aggregatorMapping[route.aggregatorId] || route.aggregatorId;
```

O más simple: busca dónde se usa `'SaucerSwapV2_V9'` y reemplázalo por `'SaucerSwapV2_V10'`.

#### **Paso 5: (Opcional) Asociar tokens al nuevo adapter**

Si vas a swapear tokens HTS (no HBAR), el adapter necesita estar asociado:

```bash
npx hardhat run scripts/associate-tokens-to-new-adapter.ts --network mainnet
```

#### **Paso 6: ¡Prueba el swap!**

Intenta hacer un swap de **HBAR → USDC** nuevamente. Ahora debería funcionar! 🎉

---

## ✅ Cambios Realizados

### 1. **scripts/02-deploy-adapter.js** (CORREGIDO)
- ✅ Cambió `WHBAR_TOKEN` de `0x163a3a` a `0x163b5a` (correcto)
- ✅ Eliminó parámetro extra `WHBAR_CONTRACT`
- ✅ Cambió de `FEE_PROMILLE` a `FEE_BASIS_POINTS` (25 = 0.25%)
- ✅ Ahora pasa 4 parámetros al constructor (no 5)

### 2. **scripts/redeploy-adapter-fixed.js** (NUEVO)
- Script específico para re-desplegar con la configuración correcta
- Incluye verificaciones y documentación clara

### 3. **scripts/register-new-adapter.js** (NUEVO)
- Script interactivo para registrar el nuevo adapter
- Verifica que el registro fue exitoso

### 4. **.env.local** (ACTUALIZADO)
- ✅ Agregado `MAINNET_YOUR_FEE_WALLET` para mainnet

---

## 🔍 Verificación Post-Deployment

Después de desplegar, verifica que el adapter está correctamente configurado:

```bash
npx hardhat run scripts/check-adapter-status.ts --network mainnet
```

Verifica:
- ✅ `whbarToken` = `0x0000000000000000000000000000000000163b5a`
- ✅ `feeWallet` = tu wallet
- ✅ `feeBasisPoints` = `25` (0.25%)
- ✅ `router` = SaucerSwap V2 Router (`0x7b925f`)

---

## 💡 Por Qué Funciona Ahora

### Flujo CORRECTO con el adapter FIXED:

1. Usuario envía **0.5 HBAR** → Exchange
2. Exchange recibe HBAR y llama al adapter con `{value: 50000000}`
3. Adapter extrae `tokenFrom` del path = `0x163b5a` (wHBAR)
4. Adapter compara: `tokenFrom == whbarToken`
   - `0x163b5a` == `0x163b5a` ✅ **MATCH!**
5. Como coinciden, el adapter **usa `msg.value`** (HBAR nativo)
6. Calcula fee: `50000000 * 25 / 10000 = 125000` (0.125 HBAR)
7. Acumula fee en el contrato: `accumulatedHbarFees += 125000`
8. Envía al router: `router.exactInput{value: 49875000}(...)`
9. Router auto-wraps HBAR → wHBAR y hace el swap
10. Usuario recibe USDC ✅

### Retirar fees acumuladas:

```solidity
// Solo el owner puede llamar esto
exchange.withdrawHbarFees();
```

O vía script:
```bash
npx hardhat run scripts/withdraw-fees.js --network mainnet
```

---

## 📚 Referencias

- **wHBAR en Mainnet**: [0.0.1456986](https://hashscan.io/mainnet/token/0.0.1456986)
- **SaucerSwap V2 Router**: [0.0.8100447](https://hashscan.io/mainnet/contract/0.0.8100447)
- **Tu Exchange**: [0.0.10086948](https://hashscan.io/mainnet/contract/0.0.10086948)

---

## ❓ FAQ

### ¿Por qué no puedo actualizar el adapter existente?

El campo `whbarToken` es **immutable** en el contrato (línea 44):
```solidity
IERC20 public whbarToken; // immutable en práctica
```

Se establece en el constructor y no puede cambiar. Debes re-desplegar.

### ¿Perderé las fees del adapter anterior?

No. El adapter anterior sigue existiendo en la blockchain. Puedes llamar a `withdrawHbarFees()` en él si acumuló fees.

### ¿Qué pasa con el aggregatorId anterior?

Puedes dejarlo registrado o eliminarlo con:
```solidity
exchange.removeAdapter("SaucerSwapV2_V9");
```

Pero **no es necesario**. Simplemente deja de usarlo en el frontend.

---

## 🚨 IMPORTANTE: Antes de usar en producción

1. ✅ Prueba el swap con cantidades pequeñas primero
2. ✅ Verifica que las fees se acumulan correctamente
3. ✅ Prueba `withdrawHbarFees()` para asegurarte de que puedes retirar
4. ✅ Verifica que todos los tokens que quieres swapear estén asociados al adapter

---

¡Listo! Con estos pasos deberías poder hacer swaps de HBAR → Token sin problemas. 🚀
