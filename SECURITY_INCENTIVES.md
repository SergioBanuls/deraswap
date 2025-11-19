# Medidas de Seguridad - Sistema de Incentivos

## Prevención de Fraude en Record Swap

### 🔒 Validaciones Implementadas

El endpoint `/api/incentives/record-swap` implementa las siguientes validaciones para prevenir fraude:

#### 1. **Verificación en Mirror Node de Hedera**
- **Qué valida**: Cada transacción se verifica contra el Mirror Node oficial de Hedera
- **Cómo funciona**: 
  - Se consulta la API del Mirror Node con el `tx_hash`
  - Se verifica que la transacción exista en la blockchain
  - Se valida que el estado sea `SUCCESS`
- **Previene**: Envío de transacciones falsas o inexistentes

#### 2. **Validación de Wallet Address**
- **Qué valida**: El wallet que ejecutó la transacción coincide con el wallet que reclama los puntos
- **Cómo funciona**:
  - Compara el `entity_id` de la transacción en el Mirror Node
  - Con el `wallet_address` enviado en el request
- **Previene**: Un usuario reclamando puntos por transacciones de otros

#### 3. **Validación de Tipo de Transacción**
- **Qué valida**: La transacción es realmente un swap (no un transfer simple)
- **Cómo funciona**:
  - Verifica que el tipo de transacción sea: `CONTRACTCALL`, `CRYPTOTRANSFER`, o `TOKENTRANSFER`
- **Previene**: Reclamo de puntos por transacciones no relacionadas con swaps

#### 4. **Prevención de Duplicados**
- **Qué valida**: Un mismo `tx_hash` no se puede registrar múltiples veces
- **Cómo funciona**:
  - Consulta en base de datos si el `tx_hash` ya existe
  - Unique constraint en la columna `tx_hash` de la tabla
- **Previene**: Reclamar puntos múltiples veces por la misma transacción

#### 5. **Validación de USD Value**
- **Qué valida**: El valor USD es mayor a 0
- **Cómo funciona**:
  - Verifica que `usd_value > 0` antes de insertar
- **Previene**: Registros de swaps sin valor o negativos

---

## ⚠️ Limitaciones Actuales

### USD Value Calculation
**Estado**: El cálculo del valor USD se hace en el frontend
**Riesgo**: Un atacante podría modificar el valor enviado al endpoint
**Mitigación Futura**: 
- Calcular el USD value en el backend usando precios verificados
- Consultar SaucerSwap API desde el servidor
- Usar oracle de precios verificado

### Ejemplo de Mejora Futura:

```typescript
// En lugar de confiar en body.usd_value, calcularlo en el servidor:
async function calculateUsdValueFromMirrorNode(tx: any) {
  // 1. Extraer tokens y cantidades de la transacción
  const transfers = tx.token_transfers || []
  
  // 2. Consultar precios actuales de tokens
  const prices = await fetchTokenPrices([fromToken, toToken])
  
  // 3. Calcular valor USD real
  const usdValue = calculateValue(transfers, prices)
  
  return usdValue
}
```

---

## 🔐 Rate Limiting (TODO - Fase 8)

Para mayor seguridad, implementar:
- Límite de requests por IP: 10 swaps/minuto
- Límite por wallet: 100 swaps/día
- Implementar con: Upstash Redis o Vercel KV

---

## 📊 Monitoreo

### Logs de Seguridad
Cada validación registra en consola:
- ✅ `Transaction verified successfully`
- ❌ `Transaction verification failed`
- ⚠️ `Wallet mismatch`
- ⚠️ `Invalid transaction type`

### Alertas Recomendadas
- Spike en transacciones fallidas de un mismo wallet
- Intentos de registrar transacciones de testnet en mainnet
- Múltiples intentos con mismo tx_hash

---

## 🚀 Testing de Seguridad

### Test Case 1: Transacción Inexistente
```bash
curl -X POST /api/incentives/record-swap \
  -d '{"tx_hash": "0.0.0@1234567890.000000000", ...}'
# Esperado: 403 Forbidden
```

### Test Case 2: Wallet Incorrecto
```bash
# Enviar tx_hash real pero wallet_address diferente
# Esperado: 403 Forbidden - Wallet mismatch
```

### Test Case 3: Transacción Duplicada
```bash
# Enviar mismo tx_hash dos veces
# Esperado: 200 OK con mensaje "Swap already recorded"
```

---

## 📝 Notas de Implementación

- La verificación en Mirror Node añade ~200-500ms de latencia
- Los Mirror Nodes tienen rate limits (60 req/min en mainnet público)
- Considerar implementar caché de transacciones verificadas
- El proceso es "fire and forget" desde el frontend para no bloquear UX
