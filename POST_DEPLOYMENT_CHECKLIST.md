# Post-Deployment Checklist

Después de desplegar tus contratos en mainnet, sigue esta checklist para asegurarte de que todo funciona correctamente.

## ✅ Verificaciones Inmediatas

### 1. Verificar Contratos en HashScan

- [ ] Exchange contract visible: `https://hashscan.io/mainnet/contract/[EXCHANGE_ID]`
- [ ] Adapter contract visible: `https://hashscan.io/mainnet/contract/[ADAPTER_ID]`
- [ ] Transactions de deployment son SUCCESS
- [ ] Transaction de configuración (setAdapter) es SUCCESS

### 2. Verificar Configuración

- [ ] Adapter registrado en Exchange:
  ```typescript
  // Llamar a: adapters("SaucerSwapV2")
  // Debe retornar: dirección del adapter
  ```

- [ ] Fee wallet configurada correctamente:
  ```typescript
  // Llamar a: feeWallet() en el Adapter
  // Debe retornar: tu dirección EVM
  ```

- [ ] Fee promille correcto:
  ```typescript
  // Llamar a: feePromille() en el Adapter
  // Debe retornar: 3 (para 0.3%)
  ```

### 3. Actualizar Configuración UI

- [ ] `.env.local` actualizado con contract IDs de mainnet
- [ ] NetworkSwitcher cambiado a mainnet
- [ ] Servidor reiniciado (`pnpm dev`)

## 🧪 Testing

### 4. Test de Swap Pequeño

- [ ] Conectar wallet a mainnet
- [ ] Balance se muestra correctamente
- [ ] Seleccionar tokens (ej: HBAR → USDC)
- [ ] Ingresar monto pequeño (ej: 5 HBAR)
- [ ] Verificar ruta de swap visible
- [ ] Ejecutar swap
- [ ] Transaction SUCCESS en HashScan

### 5. Verificar Fees

- [ ] Ver transaction del swap en HashScan
- [ ] Confirmar que fee (0.3%) se transfirió a tu wallet
- [ ] Balance de fee wallet incrementado

**Ejemplo:**
- Swap: 100 HBAR
- Fee esperada: 0.3 HBAR
- Monto real swapeado: 99.7 HBAR

### 6. Test de Diferentes Pares

- [ ] HBAR → Token funciona
- [ ] Token → HBAR funciona
- [ ] Token → Token funciona
- [ ] Diferentes montos funcionan

## 📊 Monitoreo

### 7. Setup de Monitoreo

- [ ] Guardar contract IDs en lugar seguro
- [ ] Documentar transaction IDs importantes
- [ ] Agregar fee wallet a bookmarks de HashScan
- [ ] Configurar alertas (opcional)

### 8. Documentación

- [ ] Registrar:
  - Exchange Contract ID: `0.0.______`
  - Adapter Contract ID: `0.0.______`
  - Fee Wallet: `0.0.______`
  - Deployment Date: `______`
  - Total Cost: `______ HBAR`
  - First Swap TX: `______`

## 🔒 Seguridad

### 9. Backup y Seguridad

- [ ] Private key guardada en lugar seguro (NO en repositorio)
- [ ] Contract IDs documentados
- [ ] Transaction IDs guardados
- [ ] `.env.local` en `.gitignore`

### 10. Ownership

- [ ] Verificar owner del Exchange:
  ```typescript
  // Llamar a: owner()
  // Debe retornar: tu dirección
  ```

- [ ] Verificar owner del Adapter:
  ```typescript
  // Llamar a: owner()
  // Debe retornar: tu dirección
  ```

## 💰 Fees y Costos

### 11. Tracking de Fees

Crea una hoja de cálculo para trackear:

| Date | Swap TX | From Token | To Token | Amount | Fee (0.3%) | Fee USD |
|------|---------|------------|----------|--------|------------|---------|
| ...  | ...     | ...        | ...      | ...    | ...        | ...     |

### 12. Calcular ROI

```
Deployment cost: ~40-50 HBAR
Break-even: Cuando fees acumuladas >= deployment cost

Ejemplo:
- 10,000 HBAR en volumen → 30 HBAR en fees
- 50,000 HBAR en volumen → 150 HBAR en fees (ya recuperaste inversión)
```

## 🚨 Troubleshooting

### Si algo falla:

**Swap falla con error:**
- Verificar gas limit (debe ser 2M)
- Verificar allowances de tokens
- Verificar que hay liquidez en SaucerSwap
- Revisar logs en transactionMonitor

**Fees no llegan:**
- Verificar feeWallet en el adapter
- Revisar transaction en HashScan
- Confirmar que fee se calculó (0.3% del monto)

**Balance no se muestra:**
- Verificar Mirror Node API
- Check network (testnet vs mainnet)
- Verificar token IDs correctos

## 📈 Optimizaciones Futuras

### Consideraciones

- [ ] Agregar más adapters (otros DEXs)
- [ ] Implementar multi-hop swaps
- [ ] Agregar analytics dashboard
- [ ] Implementar price impact warnings
- [ ] Agregar historical swap data

### Marketing

- [ ] Compartir en redes sociales
- [ ] Agregar a listados de dApps Hedera
- [ ] Documentar ventajas vs otros DEXs
- [ ] Crear tutorial en video

## ✨ Celebrar

¡Felicitaciones! 🎉 Tu DEX personalizado está ahora en producción en Hedera Mainnet.

Próximos milestones:
- 🎯 Primer swap: _______
- 💰 10 HBAR en fees: _______
- 🚀 100 swaps totales: _______
- 💎 100 HBAR en fees: _______

---

**Última actualización:** [Fecha de deployment]  
**Versión:** 1.0.0  
**Status:** ✅ En producción
