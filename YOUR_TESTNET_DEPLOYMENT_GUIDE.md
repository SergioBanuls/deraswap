# 🚀 Guía Completa: Deploy en Testnet

## ✅ Tu Configuración

- **Wallet Hedera**: `0.0.7192078`
- **Wallet EVM** (para fees): `0x00000000000000000000000000000000006dbe0e`
- **Red**: Testnet
- **Configuración**: Ya está en `.env.local` ✅

---

## 📋 Checklist Previo

- [x] Clave privada configurada en `.env.local`
- [x] Wallet convertida a formato EVM
- [ ] HBAR de testnet en tu wallet (mínimo 50 HBAR)
- [ ] Dependencias de Hardhat instaladas
- [ ] Hook de testnet configurado

---

## Paso 0: Obtener HBAR de Testnet

### 0.1 Verificar tu balance actual

```bash
# Abre HashScan testnet
open https://hashscan.io/testnet/account/0.0.7192078
```

### 0.2 Obtener HBAR gratis del faucet

Si necesitas más HBAR:

1. Ve a: https://portal.hedera.com/faucet
2. Ingresa tu cuenta: `0.0.7192078`
3. Solicita HBAR (recibirás ~100 HBAR)
4. Espera 1-2 minutos

---

## Paso 1: Instalar Dependencias

```bash
# Desde la raíz del proyecto
cd /Users/sergiobanuls/Documents/PERSONAL/deraswap

# Instalar Hardhat y OpenZeppelin
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts@4.9.3

# Instalar Hedera SDK
npm install @hashgraph/sdk
```

---

## Paso 2: Configurar Hook de Testnet

Edita `app/page.tsx` o donde importes el hook:

```typescript
// Busca esta línea:
import { useSwapRoutes } from '@/hooks/useSwapRoutes';

// Reemplázala por:
import { useSwapRoutes } from '@/hooks/useSwapRoutes.testnet-simple';
```

**O mejor**, crea un archivo `hooks/index.ts`:

```typescript
// hooks/index.ts
const IS_TESTNET = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'testnet';

export { useSwapRoutes } from IS_TESTNET 
  ? './useSwapRoutes.testnet-simple' 
  : './useSwapRoutes';
```

---

## Paso 3: Buscar Direcciones de Contratos de Testnet

Necesitas las direcciones de SaucerSwap V2 en testnet.

### 3.1 Buscar en HashScan

```bash
# Abre HashScan testnet
open https://hashscan.io/testnet
```

Busca "SaucerSwap V2 Router" o consulta docs:
- https://docs.saucerswap.finance/

### 3.2 Actualizar el script de deployment

Edita `scripts/02-deploy-adapter.js`, línea ~25:

```javascript
if (network === "mainnet") {
  // Mainnet addresses
  SAUCERSWAP_V2_ROUTER = "0x00000000000000000000000000000000003c3f7a";
  WHBAR_TOKEN = "0x0000000000000000000000000000000000163a3a";
  WHBAR_CONTRACT = "0x0000000000000000000000000000000000163a3a";
} else {
  // 🔥 ACTUALIZA ESTAS DIRECCIONES PARA TESTNET
  SAUCERSWAP_V2_ROUTER = "0x0000000000000000000000000000000000159198"; // 0.0.1414040
  WHBAR_TOKEN = "0x0000000000000000000000000000000000163c52"; // WHBAR testnet
  WHBAR_CONTRACT = "0x0000000000000000000000000000000000163c52";
}
```

**Nota**: Las direcciones ya están en tu `.env.local` (NEXT_PUBLIC_SWAP_ROUTER_ADDRESS)

---

## Paso 4: Desplegar Exchange

```bash
# Asegúrate de estar en la raíz del proyecto
cd /Users/sergiobanuls/Documents/PERSONAL/deraswap

# Desplegar el contrato Exchange
npx hardhat run scripts/01-deploy-exchange.js --network testnet
```

**Output esperado:**
```
🚀 Desplegando contrato Exchange...
✅ Exchange desplegado en: 0x...
📝 Guarda esta dirección en tu .env:
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.XXX
```

### 4.1 Actualizar .env.local

Copia las direcciones del output y actualiza:

```bash
# Edita .env.local y agrega:
EXCHANGE_ADDRESS=0x... # La dirección que salió
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.XXX
```

---

## Paso 5: Desplegar Adapter (con tu wallet para fees)

```bash
npx hardhat run scripts/02-deploy-adapter.js --network testnet
```

**Output esperado:**
```
🚀 Desplegando SaucerSwapV2Adapter...

📋 Configuración:
- Fee Wallet: 0x00000000000000000000000000000000006dbe0e
- Router: 0x0000000000000000000000000000000000159198
- Fee: 0.3%
- Network: testnet

✅ SaucerSwapV2Adapter desplegado en: 0x...
Hedera ID: 0.0.YYY
```

### 5.1 Actualizar .env.local

```bash
# Edita .env.local:
SAUCERSWAP_V2_ADAPTER=0x... # La dirección del adapter
```

---

## Paso 6: Registrar Adapter en Exchange

```bash
npx hardhat run scripts/03-register-adapters.js --network testnet
```

**Output esperado:**
```
🔗 Registrando adapters en Exchange...

📋 Configuración:
- Exchange: 0x...
- SaucerSwapV2 Adapter: 0x...

Registrando SaucerSwapV2...
✅ SaucerSwapV2 adapter registrado!

✓ Verificación: CORRECTO

🎉 ¡Listo! Tu contrato está configurado.
```

---

## Paso 7: Actualizar Frontend

### 7.1 Cambiar a modo custom router

Edita `.env.local`:

```bash
# Cambia esta línea:
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom  # Era 'etaswap'
```

### 7.2 Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

---

## Paso 8: Probar el Swap

### 8.1 Abrir la app

```bash
open http://localhost:3000
```

### 8.2 Conectar tu wallet

1. Click en "Connect Wallet"
2. Conecta con tu wallet `0.0.7192078`
3. Asegúrate de estar en testnet

### 8.3 Hacer un swap de prueba

1. Selecciona HBAR → USDC (o cualquier par disponible)
2. Ingresa un monto pequeño (ej: 10 HBAR)
3. Verás el precio calculado localmente
4. Click "Swap"
5. Firma la transacción en tu wallet
6. Espera confirmación

---

## Paso 9: Verificar que las Fees Llegaron

### 9.1 Ver tu transacción

```bash
# Abre HashScan con tu cuenta
open https://hashscan.io/testnet/account/0.0.7192078
```

### 9.2 Buscar la fee

1. Ve a la pestaña "Transactions"
2. Busca una transacción entrante reciente
3. Deberías ver ~0.03 HBAR (0.3% de 10 HBAR)

### 9.3 Ver el contrato

```bash
# Abre el Exchange contract
open https://hashscan.io/testnet/contract/[TU_EXCHANGE_ID]

# Abre el Adapter contract
open https://hashscan.io/testnet/contract/[TU_ADAPTER_ID]
```

---

## Paso 10: Testing Adicional

### 10.1 Probar diferentes montos

- 1 HBAR → USDC (fee: ~0.003 HBAR)
- 100 HBAR → USDC (fee: ~0.3 HBAR)
- USDC → HBAR (fee: ~0.3% en USDC)

### 10.2 Verificar slippage

- Prueba con diferentes slippage (0.1%, 0.5%, 1%)
- Verifica que el mínimo recibido sea correcto

### 10.3 Probar con diferentes tokens

Si hay otros pares disponibles en testnet:
- HBAR → SAUCE
- USDC → SAUCE
- etc.

---

## 🐛 Troubleshooting

### Error: "Insufficient balance"

**Solución:**
```bash
# Obtén más HBAR del faucet
open https://portal.hedera.com/faucet
```

### Error: "Contract deployment failed"

**Verificar:**
1. ¿Tu PRIVATE_KEY es correcta?
2. ¿Tienes suficiente HBAR? (mínimo 50)
3. ¿Estás en la red correcta? (testnet)

```bash
# Verificar red en hardhat.config.js
cat hardhat.config.js | grep testnet
```

### Error: "Adapter not found"

**Solución:**
El adapter no está registrado. Ejecuta de nuevo:
```bash
npx hardhat run scripts/03-register-adapters.js --network testnet
```

### Las rutas no aparecen

**Verificar:**
1. ¿Estás usando el hook de testnet?
   - Debe ser `useSwapRoutes.testnet-simple`
2. ¿Hay liquidez en testnet para ese par?
3. Revisa la consola del navegador (F12)

### Las fees no llegan a mi wallet

**Verificar:**
1. ¿El adapter tiene tu wallet correcta?
   ```javascript
   // En el deployment debe decir:
   Fee Wallet: 0x00000000000000000000000000000000006dbe0e
   ```
2. ¿El swap se ejecutó correctamente?
3. Revisa en HashScan si hay transacciones pendientes

---

## 📊 Resumen de Direcciones

Después del deployment, tendrás:

```
Tu Wallet:
├─ Hedera: 0.0.7192078
└─ EVM: 0x00000000000000000000000000000000006dbe0e

Contratos Desplegados:
├─ Exchange: 0.0.XXX (0x...)
└─ SaucerSwapV2Adapter: 0.0.YYY (0x...)
    └─ feeWallet: 0x00000000000000000000000000000000006dbe0e ← TÚ
```

---

## ✅ Checklist Final

- [ ] Exchange desplegado
- [ ] Adapter desplegado con tu wallet
- [ ] Adapter registrado en Exchange
- [ ] Frontend actualizado (SWAP_ROUTER_TYPE=custom)
- [ ] Hook de testnet configurado
- [ ] Swap de prueba exitoso
- [ ] Fees recibidas en tu wallet
- [ ] Todo verificado en HashScan

---

## 🎉 ¡Éxito!

Si llegaste aquí, tienes:

✅ Tu propio contrato de swap en testnet  
✅ Fees yendo a TU wallet  
✅ Todo funcionando correctamente  

**Próximo paso:** Cuando estés listo, repite el proceso en mainnet ($5-7 USD)

---

## 📚 Archivos de Referencia

- `DEPLOYMENT_GUIDE.md` - Guía general
- `TESTNET_GUIDE.md` - Guía de testnet con API
- `CONTRACTS_SUMMARY.md` - Resumen de contratos
- `FLOW_DIAGRAM.md` - Diagramas visuales

---

## 🆘 ¿Problemas?

1. Revisa la consola del terminal (errores de Hardhat)
2. Revisa la consola del navegador (errores de frontend)
3. Verifica en HashScan que las transacciones se ejecutaron
4. Lee los mensajes de error completos

---

**Fecha**: Noviembre 6, 2025  
**Wallet**: 0.0.7192078  
**Red**: Testnet Hedera  
**Status**: ✅ Listo para deployment
