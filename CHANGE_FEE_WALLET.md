# 🔄 Cambiar Wallet de Fees - Guía Rápida

## ⚠️ Importante: Fee Wallet es Immutable

La wallet de fees **NO puede ser modificada** después del deployment porque es `immutable` en el contrato.

```solidity
address payable public immutable feeWallet; // ← No se puede cambiar
```

## 🎯 Opciones Disponibles

### Comparación Rápida

| Opción | Costo | Dificultad | Cuándo Usar |
|--------|-------|-----------|-------------|
| **Opción 1: Redeploy Adapter** | ~20-25 HBAR | Media | Cambio permanente, una sola vez |
| **Opción 2: Auto-Forward** | ~$0.01 por forward | Baja | Cambios temporales o frecuentes |
| **Opción 3: Múltiples Adapters** | ~20-25 HBAR cada uno | Media | Distribuir fees entre varias wallets |

---

## Opción 1: Redeploy del Adapter ✅ Recomendada

**Cuándo usarla:** Cambio permanente de wallet

### Pasos:

```bash
# 1. Editar deploy-mainnet-adapter.ts
# Cambiar la línea:
const feeWalletId = AccountId.fromString('0.0.NUEVA_WALLET');

# 2. Deploy nuevo adapter
npx tsx scripts/deploy-mainnet-adapter.ts
# → Guarda el nuevo Contract ID: 0.0.XXXXXX

# 3. Actualizar configure-adapter-mainnet.ts
# ADAPTER_CONTRACT_ID = '0.0.XXXXXX' (el nuevo)

# 4. Configurar en Exchange
npx tsx scripts/configure-adapter-mainnet.ts
```

### Costos:
- Deploy Adapter: ~20-25 HBAR
- Configure: ~2-3 HBAR
- **Total: ~22-28 HBAR**

### Resultado:
✅ Nueva wallet recibe todas las fees futuras  
✅ Cambio permanente  
❌ Costo de redeploy  

---

## Opción 2: Auto-Forward de Fees 💡 Económica

**Cuándo usarla:** No quieres pagar redeploy, o cambias de wallet frecuentemente

### Script Creado:

`scripts/forward-fees.ts` - Transfiere fees acumuladas a otra wallet

### Uso:

```bash
# 1. Editar scripts/forward-fees.ts
const DESTINATION_WALLET = '0.0.TU_NUEVA_WALLET';

# 2. Ejecutar cuando quieras transferir fees
npx tsx scripts/forward-fees.ts
```

### Automatización (Opcional):

```bash
# Cron job para ejecutar diariamente
# Editar crontab: crontab -e
0 0 * * * cd /path/to/deraswap && npx tsx scripts/forward-fees.ts
```

### Costos:
- Por transferencia: ~$0.01 (gas fees)
- Sin costo de deployment

### Resultado:
✅ Muy económico  
✅ Flexible (cambias destino cuando quieras)  
✅ Puedes tener múltiples destinos  
❌ Necesitas ejecutar el script periódicamente  
❌ Fees primero van a wallet original  

---

## Opción 3: Múltiples Adapters 🔀 Avanzada

**Cuándo usarla:** Quieres distribuir fees entre varias wallets o personas

### Concepto:

Despliega varios adapters, cada uno con diferente wallet de fees.

### Pasos:

```bash
# 1. Deploy Adapter #1 (wallet A)
# Editar: feeWalletId = '0.0.WALLET_A'
npx tsx scripts/deploy-mainnet-adapter.ts
# → 0.0.ADAPTER_1

# 2. Deploy Adapter #2 (wallet B)
# Editar: feeWalletId = '0.0.WALLET_B'
npx tsx scripts/deploy-mainnet-adapter.ts
# → 0.0.ADAPTER_2

# 3. Configurar ambos en Exchange
setAdapter("SaucerSwapV2_WalletA", adapter1_address)
setAdapter("SaucerSwapV2_WalletB", adapter2_address)
```

### Uso en la UI:

Puedes modificar el código para seleccionar qué adapter usar basado en:
- Usuario específico
- Token específico
- Volumen del swap
- Aleatorio (distribución)

### Costos:
- Por cada adapter: ~20-25 HBAR
- Configuración: ~2-3 HBAR por adapter

### Resultado:
✅ Distribución automática  
✅ Cada adapter independiente  
✅ Puedes tener reglas de negocio  
❌ Costo multiplicado por número de adapters  
❌ Más complejo de gestionar  

---

## 📊 Ejemplo de Decisión

### Escenario 1: Cambié de Wallet Personal
**Solución:** Opción 1 (Redeploy)  
**Por qué:** Cambio único, permanente, vale la pena el costo

### Escenario 2: Quiero Probar Diferentes Estrategias
**Solución:** Opción 2 (Auto-Forward)  
**Por qué:** Flexible, económico, puedo experimentar

### Escenario 3: Tengo Partners/Team
**Solución:** Opción 3 (Múltiples Adapters)  
**Por qué:** Distribución automática, transparente

### Escenario 4: No Quiero Gastar Nada
**Solución:** Opción 2 (Auto-Forward)  
**Por qué:** Solo cuesta gas (~$0.01), muy barato

---

## 🔍 Verificar Wallet Actual

Para ver qué wallet está recibiendo fees:

```bash
npx tsx scripts/get-contract-info.ts mainnet 0.0.TU_ADAPTER_ID
```

Output mostrará:
```
💰 Fee Wallet: 0x... (0.0.XXXXXX)
```

---

## ⚡ Quick Commands

```bash
# Verificar wallet actual
npx tsx scripts/get-contract-info.ts mainnet 0.0.ADAPTER_ID

# Redeploy con nueva wallet
# 1. Edita deploy-mainnet-adapter.ts
# 2. Ejecuta:
npx tsx scripts/deploy-mainnet-adapter.ts
npx tsx scripts/configure-adapter-mainnet.ts

# Forward fees a otra wallet
# 1. Edita forward-fees.ts
# 2. Ejecuta:
npx tsx scripts/forward-fees.ts
```

---

## 💡 Recomendación

**Para la mayoría de casos:**
- **Primera vez:** Asegúrate de usar la wallet correcta en el deployment inicial
- **Si te equivocaste:** Usa Opción 2 (Auto-Forward) primero, es gratis
- **Si necesitas cambio permanente:** Redeploy adapter (Opción 1)

**Best Practice:**
- Usa una wallet dedicada para fees desde el inicio
- Documenta qué wallet usaste
- Configura auto-forward como backup

---

**Archivos de Referencia:**
- `FEE_WALLET_CONFIG.md` - Documentación completa
- `scripts/forward-fees.ts` - Script de auto-forward
- `scripts/deploy-mainnet-adapter.ts` - Redeploy con nueva wallet
