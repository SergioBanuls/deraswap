# Configuración de Wallet de Fees

Este documento explica cómo configurar la wallet que recibirá las fees del 0.3% en cada swap.

## 📍 Dónde se Configura

La wallet de fees se configura **una sola vez** durante el deployment del **SaucerSwapV2Adapter** contract.

### Archivo: `scripts/deploy-mainnet-adapter.ts`

```typescript
// Tu wallet recibirá las fees automáticamente
const feeWalletEVM = `0x${operatorId.toSolidityAddress()}`;
```

Por defecto, **tu cuenta de deployment** (la configurada en `HEDERA_ACCOUNT_ID`) será la que reciba las fees.

## 🔄 Cambiar la Wallet de Fees

⚠️ **IMPORTANTE:** La wallet de fees es **immutable** - no puede ser cambiada después del deployment.

Si necesitas cambiar la wallet de fees, tienes estas opciones:

### Opción 1: Durante el Deployment (Recomendado)

Antes de ejecutar `deploy-mainnet-adapter.ts`, edita el archivo:

```typescript
async function deployAdapter() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);
  
  // 🔥 CAMBIA AQUÍ: Usa cualquier wallet que quieras
  const feeWalletId = AccountId.fromString('0.0.XXXXXX'); // Tu otra wallet
  const feeWalletEVM = `0x${feeWalletId.toSolidityAddress()}`;
  
  // ... resto del código
}
```

### Opción 2: Redeploy del Adapter (Si ya deployaste)

Si ya desplegaste el adapter y necesitas cambiar la wallet:

1. **Deploy un nuevo adapter** con la nueva wallet:
   ```bash
   # Edita deploy-mainnet-adapter.ts con la nueva wallet
   # Luego ejecuta:
   npx tsx scripts/deploy-mainnet-adapter.ts
   ```

2. **Registrar el nuevo adapter** en Exchange:
   ```bash
   # Actualiza configure-adapter-mainnet.ts con el nuevo ADAPTER_CONTRACT_ID
   npx tsx scripts/configure-adapter-mainnet.ts
   ```

3. **Actualizar .env.local** para usar el nuevo adapter (si es necesario)

**Costo:** ~20-25 HBAR (solo el nuevo Adapter + configuración)

⚠️ **Nota:** El adapter viejo sigue existiendo pero ya no se usa. No puedes modificar su feeWallet porque es `immutable`.

### Opción 3: Auto-Forward de Fees (Sin redeploy)

Si no quieres pagar por redeploy, puedes configurar un forward automático:

```bash
# Edita scripts/forward-fees.ts con la wallet destino
# Ejecuta periódicamente (manual o con cron):
npx tsx scripts/forward-fees.ts
```

**Ventajas:**
- No cuesta redeploy (~20 HBAR)
- Solo cuesta gas de transfer (~$0.01)
- Puedes cambiar destino cuando quieras

**Desventajas:**
- Debes ejecutarlo manualmente o automatizar
- Las fees primero van a la wallet original

## 💰 Cómo Funcionan las Fees

### Durante un Swap

1. Usuario ejecuta swap de 100 HBAR → USDC
2. El adapter calcula: `100 * 0.003 = 0.3 HBAR` (fee)
3. Del swap se descuenta la fee: `100 - 0.3 = 99.7 HBAR` (monto real)
4. **0.3 HBAR se envían a tu feeWallet**
5. 99.7 HBAR se swappean en SaucerSwap

### Código del Contrato

```solidity
// En SaucerSwapV2Adapter.sol
address payable public immutable feeWallet; // ✅ Tu wallet
uint8 public feePromille; // 3 = 0.3%

// Durante el swap
uint256 feeAmount = (amountFrom * feePromille) / 1000;
feeWallet.transfer(feeAmount); // 💰 Fee va a tu wallet
```

## 🔍 Verificar la Wallet de Fees

### En HashScan

1. Ve a tu Adapter contract: `https://hashscan.io/mainnet/contract/0.0.XXXXXX`
2. Busca la función `feeWallet()`
3. Verifica que sea tu dirección EVM

### Con Script

```typescript
import { ContractCallQuery, ContractFunctionParameters } from '@hashgraph/sdk';

const query = new ContractCallQuery()
  .setContractId('0.0.XXXXXX') // Tu adapter
  .setGas(50000)
  .setFunction('feeWallet');

const result = await query.execute(client);
console.log('Fee Wallet:', result.getAddress(0));
```

## 💸 Monitorear Fees Recibidas

### En HashScan

Visita: `https://hashscan.io/mainnet/account/0.0.XXXXXX` (tu fee wallet)

Verás:
- Transacciones entrantes de fees
- Balance acumulado
- Historial de fees por swap

### Cálculo de Ingresos

```
Fees totales = Volumen de swaps * 0.003

Ejemplo:
- 10,000 HBAR de volumen → 30 HBAR de fees
- 100,000 HBAR de volumen → 300 HBAR de fees
```

## ⚙️ Configuraciones Avanzadas

### Cambiar el Porcentaje de Fee

Si quieres cobrar más o menos del 0.3%:

```typescript
// En deploy-mainnet-adapter.ts
const FEE_PROMILLE = 5; // 0.5% en lugar de 0.3%
// o
const FEE_PROMILLE = 1; // 0.1%
```

**Nota:** El fee máximo recomendado es 0.5% (5 promille) para mantener competitividad.

### Múltiples Wallets de Fees

Si quieres distribuir fees entre varias wallets:

1. Despliega múltiples adapters (uno por wallet)
2. Configura todos con `setAdapter()` usando diferentes nombres
3. En la UI, selecciona qué adapter usar

**Ejemplo:**
```typescript
setAdapter("SaucerSwapV2_Wallet1", adapter1_address)
setAdapter("SaucerSwapV2_Wallet2", adapter2_address)
```

## 🔒 Seguridad

- ✅ La wallet de fees es **immutable** - no puede ser cambiada después del deployment
- ✅ Solo el owner del adapter puede cambiar el porcentaje de fee (con `setFeePromille`)
- ✅ Las fees se transfieren automáticamente en cada swap
- ⚠️ Asegúrate de usar la wallet correcta antes del deployment

## 📊 Best Practices

1. **Usa una wallet dedicada para fees:**
   - Facilita el tracking de ingresos
   - Mejor organización contable

2. **Monitorea regularmente:**
   - Verifica que las fees lleguen correctamente
   - Rastrea el volumen de swaps

3. **Backup de información:**
   - Guarda el Contract ID del adapter
   - Documenta la wallet de fees
   - Mantén registro de transaction IDs

## 🎯 Ejemplo Completo

Configuración típica:

```typescript
// .env.local
HEDERA_ACCOUNT_ID=0.0.7192078    // Tu cuenta de deployment
PRIVATE_KEY=302e020100...         // Tu private key

// El script usa automáticamente esta cuenta como fee wallet
// O puedes especificar otra:
const feeWalletId = AccountId.fromString('0.0.1234567');
```

Resultado:
- Adapter deployed: 0.0.XXXXXXX
- Fee wallet: 0.0.1234567 (recibe el 0.3%)
- Fee promille: 3 (0.3%)

¡Listo! Cada swap ahora generará ingresos a tu wallet especificada.
