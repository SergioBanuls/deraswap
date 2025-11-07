# 🔍 DIAGNÓSTICO: SafeERC20 low-level call failed

## ❌ Error Actual

```
Error: "SafeERC20: low-level call failed"
Status: CONTRACT_REVERT_EXECUTED
Transaction: 0.0.10081592@1762536609.551188017
```

## ✅ Configuración Verificada

### Adapter EXACT (0.0.10087513):
- ✅ Router: 0x7b925f (0.0.8100447 - SaucerSwap V2)
- ✅ whbarToken: 0x163b5a (0.0.1456986)
- ✅ whbarContract: 0x163b5a (0.0.1456986)
- ✅ feeWallet: 0x12374efa... (0.0.10085914)
- ✅ feePromille: 3 (0.3%)
- ✅ Tokens asociados: wHBAR, USDC
- ✅ Admin key: ECDSA_SECP256K1

### Exchange (0.0.10086948):
- ✅ Tokens asociados: wHBAR, USDC
- ✅ Adapter registrado: SaucerSwapV2_EXACT

### Frontend:
- ✅ isTokenFromHBAR: true
- ✅ payableAmount: 0.5 HBAR
- ✅ Path correcto: 0x163b5a -> 0x06f89a
- ✅ Gas: 368000

## 🔎 Comparación con ETASwap

### ETASwap Adapter (0.0.4817910):
```
✅ max_automatic_token_associations: -1 (ILIMITADAS)
✅ 25 tokens asociados
❌ wHBAR NO aparece en lista (se auto-asocia en uso)
```

### Nuestro Adapter EXACT:
```
❌ max_automatic_token_associations: 0 (ninguna)
✅ 2 tokens asociados MANUALMENTE (wHBAR, USDC)
```

## 🤔 Hipótesis del Problema

El error "SafeERC20: low-level call failed" ocurre cuando `safeTransfer()` falla. En el adapter, esto puede pasar en:

1. **Línea 133:** `token.safeTransfer(recipient, amount)` en `_transfer()`
   - Se ejecuta cuando `token != whbarToken`
   - Es decir, cuando transferimos USDC de vuelta al usuario

### Flujo de Swap HBAR → USDC:

```
1. Exchange recibe 50M tinybar del usuario
2. Exchange llama adapter.swap{value: 50M}()
3. Adapter recibe HBAR (msg.value = 50M)
4. Adapter calcula fee: 50M * 3/1000 = 150K tinybar
5. Adapter envía fee a feeWallet (HBAR nativo) ✅
6. Adapter llama router.exactInput{value: 49.85M}(...)
   - recipient: address(this) (adapter)
7. Router hace swap en SaucerSwap
8. Router debe enviar USDC al adapter ❓
9. Adapter transfiere USDC al Exchange/usuario ❌ FALLA AQUÍ
```

## 🎯 Posibles Causas

### A) El router NO está enviando USDC al adapter
- Tal vez el router necesita que el adapter tenga un `receive()` o `fallback()`
- Tal vez hay un problema con cómo el router maneja recipients

### B) El adapter NO puede recibir USDC del router
- Aunque el adapter tiene USDC asociado
- Tal vez hay un problema de permisos o configuración

### C) El adapter NO puede enviar USDC al Exchange
- El Exchange tiene USDC asociado
- Pero tal vez hay un problema con la transferencia

## 🔧 Diferencia Clave con ETASwap

**ETASwap tiene auto-associations ilimitadas (-1)**
- No necesita pre-asociar tokens
- Los tokens se asocian automáticamente cuando los recibe
- Más flexible y resistente a fallos

**Nuestro adapter NO tiene auto-associations (0)**
- Requiere asociación manual de cada token
- Si falta alguna asociación, falla
- Menos flexible

## 💡 Próxima Acción Sugerida

**Re-deploy con auto-associations ilimitadas:**

```javascript
const contractTx = new ContractCreateFlow()
  .setGas(3000000)
  .setAdminKey(operatorKey.publicKey)
  .setMaxAutomaticTokenAssociations(-1)  // ← AGREGAR ESTO
  .setConstructorParameters(constructorParams)
  .setBytecode(artifact.bytecode);
```

Esto permitirá que el adapter reciba cualquier token automáticamente, igual que ETASwap.

---

**Actualización Necesaria:**
1. Re-compilar adapter (ya está correcto el código)
2. Re-deployear con `setMaxAutomaticTokenAssociations(-1)`
3. Registrar nuevo adapter en Exchange
4. Actualizar frontend

¿Quieres que proceda con esto?
