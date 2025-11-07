# Deployment Guide - Mainnet

Esta guía te llevará paso a paso para desplegar tus contratos personalizados en Hedera Mainnet.

## 📋 Pre-requisitos

1. **Compilar los contratos:**
   ```bash
   npx hardhat compile
   ```

2. **Tener HBAR en mainnet:**
   - Mínimo recomendado: 50 HBAR para deployment y configuración
   - Account ID y Private Key en `.env.local`

3. **Verificar variables de entorno en `.env.local`:**
   ```env
   HEDERA_ACCOUNT_ID=0.0.XXXXXX
   PRIVATE_KEY=302e020100300506032b657004220420...
   ```

## 🚀 Paso 1: Deploy Exchange Contract

El contrato Exchange es el punto de entrada principal para los swaps.

```bash
npx tsx scripts/deploy-mainnet-exchange.ts
```

**Output esperado:**
```
✅ Exchange contract deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract ID: 0.0.XXXXXX
EVM Address: 0x...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**📝 Guarda el Contract ID - lo necesitarás en los siguientes pasos.**

## 🚀 Paso 2: Deploy SaucerSwapV2Adapter Contract

El adapter conecta tu Exchange con SaucerSwap V2 para ejecutar los swaps.

```bash
npx tsx scripts/deploy-mainnet-adapter.ts
```

**Output esperado:**
```
✅ SaucerSwapV2Adapter deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract ID: 0.0.XXXXXX
EVM Address: 0x...
Fee Wallet: 0x... (0.0.XXXXXX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**📝 Guarda el Contract ID del Adapter.**

## 🔧 Paso 3: Configurar el Adapter en Exchange

Conecta el Adapter con el Exchange.

1. **Edita el archivo:** `scripts/configure-adapter-mainnet.ts`
   
   Actualiza estas líneas con los Contract IDs de los pasos anteriores:
   ```typescript
   const EXCHANGE_CONTRACT_ID = '0.0.XXXXXX'; // Del Paso 1
   const ADAPTER_CONTRACT_ID = '0.0.XXXXXX';  // Del Paso 2
   ```

2. **Ejecuta la configuración:**
   ```bash
   npx tsx scripts/configure-adapter-mainnet.ts
   ```

**Output esperado:**
```
✅ Adapter configured successfully!
Transaction ID: 0.0.XXXXXX@...
Status: SUCCESS

🎉 DEPLOYMENT COMPLETE!
```

## ⚙️ Paso 4: Actualizar la Configuración de la UI

Actualiza tu archivo `.env.local` con los nuevos contract IDs:

```env
# Tus contratos en mainnet
NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.XXXXXX
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x...

# Configuración por defecto (mainnet)
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom
```

**O usa el NetworkSwitcher en la UI:**
- La UI ya tiene un toggle para cambiar entre testnet y mainnet
- Cambia a mainnet en el selector de red
- Tus contratos se usarán automáticamente

## 🧪 Paso 5: Testing

1. **Inicia el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

2. **Abre la aplicación:**
   - Ve a `http://localhost:3000`
   - Cambia a mainnet usando el NetworkSwitcher
   - Conecta tu wallet (HashPack/Blade)

3. **Prueba un swap:**
   - Selecciona tokens (ej: HBAR → USDC)
   - Ingresa un monto pequeño para probar
   - Verifica que el balance se muestre correctamente
   - Ejecuta el swap
   - Verifica que la transacción sea SUCCESS

4. **Monitorea la transacción:**
   - La UI mostrará el estado del swap
   - Puedes verificar en HashScan: `https://hashscan.io/mainnet/transaction/[TX_ID]`

## 💰 Fees

- **Deployment costs estimados:**
  - Exchange: ~15-20 HBAR
  - Adapter: ~20-25 HBAR
  - Configuración: ~2-3 HBAR
  - **Total: ~40-50 HBAR**

- **Fees de swap:**
  - 0.3% va a tu wallet (configurada en el Adapter)
  - Gas fees normales de Hedera (~$0.01 por transacción)

## 🔍 Verificación

Para verificar que todo está funcionando:

1. **Verifica los contratos en HashScan:**
   - Exchange: `https://hashscan.io/mainnet/contract/0.0.XXXXXX`
   - Adapter: `https://hashscan.io/mainnet/contract/0.0.XXXXXX`

2. **Verifica la configuración del adapter:**
   - Puedes llamar a `adapters("SaucerSwapV2")` en el Exchange
   - Debería retornar la dirección de tu Adapter

3. **Verifica tu wallet de fees:**
   - Tu cuenta recibirá el 0.3% de cada swap
   - Monitorea los ingresos en HashScan

## 🚨 Troubleshooting

### Error: "INVALID_FILE_ID" o "INSUFFICIENT_GAS"
- Aumenta el gas limit y max transaction fee
- Verifica que los contratos estén compilados

### Error: "ADAPTER_ALREADY_EXISTS"
- El adapter ya está configurado
- Puedes verificar llamando a `adapters("SaucerSwapV2")`

### Error: "INSUFFICIENT_ACCOUNT_BALANCE"
- Necesitas más HBAR en tu cuenta
- Mínimo recomendado: 50 HBAR

### El swap falla con "INSUFFICIENT_GAS"
- Ya está configurado en el código: 2M gas limit
- Verifica que setMaxTransactionFee esté en el código

## 📊 Post-Deployment

Después del deployment exitoso:

1. **Documenta tus contract IDs:**
   - Exchange: 0.0.XXXXXX
   - Adapter: 0.0.XXXXXX
   - Fee Wallet: 0.0.XXXXXX

2. **Backup de información importante:**
   - Private keys
   - Contract IDs
   - Transaction IDs del deployment

3. **Monitorea los swaps:**
   - Verifica que las fees lleguen a tu wallet
   - Monitorea el volumen de swaps
   - Revisa las transacciones en HashScan

## 🎉 ¡Listo!

Tu DEX personalizado está ahora en producción en Hedera Mainnet. Los usuarios pueden hacer swaps y tú recibirás el 0.3% de fees de cada transacción.

## 📚 Recursos Adicionales

- [Hedera Docs](https://docs.hedera.com)
- [SaucerSwap V2](https://www.saucerswap.finance)
- [HashScan Explorer](https://hashscan.io/mainnet)
- [ETASwap Original](https://github.com/EtaSwap/etaswap-smart-contracts-v2)
