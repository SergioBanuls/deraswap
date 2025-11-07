# 🔍 PROBLEMA: HBAR no llega al contrato

## ❌ Error Actual

**Síntoma:** `CONTRACT_REVERT_EXECUTED` con error "SafeERC20: low-level call failed"
**Causa raíz:** El Exchange recibe `amount: 0` en lugar de `amount: 50000000` (0.5 HBAR)

## 📋 Evidencia

### Transaction: 0.0.10081592@1762537383.244152016
```json
{
  "amount": 0,  // ❌ Debería ser 50000000
  "contract_id": "0.0.10086948",
  "error_message": "SafeERC20: low-level call failed"
}
```

### Código Actual (transactionBuilder.ts):
```typescript
// If swapping from HBAR, attach HBAR value
if (fromToken.id === 'HBAR') {
  const hbarAmount = Number(inputAmount) / 100000000; // = 0.5
  transaction.setPayableAmount(new Hbar(hbarAmount)); // ✅ Parece correcto
}

const frozenTx = transaction.freeze(); // ❌ PROBLEMA: freeze() sin client
return frozenTx.toBytes();
```

## 🤔 Análisis

### Problema con `freeze()` sin client

Según la documentación de Hedera SDK:
- `freezeWith(client)` → Serializa TODOS los campos correctamente
- `freeze()` → Puede NO serializar `payableAmount` correctamente

**En WalletConnect/Reown:**
- NO tenemos acceso a un Hedera client en el frontend
- Solo podemos construir bytes de la transacción
- El `payableAmount` se pierde en la serialización

## 🎯 Soluciones Posibles

### Opción 1: No usar `setPayableAmount()` con freeze()

Problema: No hay alternativa documentada para enviar HBAR nativo con ContractExecuteTransaction sin client.

### Opción 2: Enviar HBAR como transfer separado

Problema: Requiere dos transacciones, más complejo para el usuario.

### Opción 3: Modificar el flujo para usar wHBAR en lugar de HBAR nativo

**Esta podría ser la solución correcta:**
- Usuario aprueba wHBAR al Exchange
- Frontend envía wHBAR (token) en lugar de HBAR nativo
- Exchange transfiere wHBAR al adapter
- Adapter trabaja con wHBAR (ya está asociado)
- No necesitamos `payableAmount`

## 💡 Investigación Adicional Requerida

1. ¿Cómo maneja ETASwap los swaps de HBAR en su frontend?
2. ¿Usan HBAR nativo o convierten a wHBAR primero?
3. ¿Hay una forma de incluir `payableAmount` en los bytes sin client?

## 📝 Pregunta para el Usuario

¿Prefieres que investigue más cómo ETASwap maneja HBAR swaps en su UI, o cambiar el flujo para usar wHBAR directamente?

Usar wHBAR sería más simple y confiable, pero requiere un paso extra de conversión HBAR → wHBAR.
