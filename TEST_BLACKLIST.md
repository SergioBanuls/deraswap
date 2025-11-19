# Test de Blacklist de Tokens

## 🧪 Pruebas para Validar que BSL está Bloqueado

### 1. **Prueba con BSL en fromToken**
- **Acción**: Intentar swap de BSL → USDC
- **Resultado Esperado**: ❌ No debería aparecer ninguna ruta
- **Mensaje**: "Route contains blacklisted token(s): 0.0.4431990"

### 2. **Prueba con BSL en toToken**
- **Acción**: Intentar swap de USDC → BSL
- **Resultado Esperado**: ❌ No debería aparecer ninguna ruta
- **Mensaje**: "Route contains blacklisted token(s): 0.0.4431990"

### 3. **Prueba con BSL como intermediario**
- **Acción**: Si ETASwap devuelve ruta Token A → BSL → Token B
- **Resultado Esperado**: ❌ Ruta rechazada automáticamente
- **Mensaje**: "Route contains blacklisted token(s): 0.0.4431990"

### 4. **Prueba en Modo AUTO**
- **Acción**: Activar modo AUTO con BSL en ruta
- **Resultado Esperado**: ❌ NO debería mostrar rutas con BSL
- **Mensaje en consola**: "❌ Auto mode: All routes contain blacklisted tokens - cannot show any route"

### 5. **Prueba con token válido**
- **Acción**: Swap normal USDC → HBAR
- **Resultado Esperado**: ✅ Rutas aparecen normalmente
- **Validación**: Ningún mensaje de blacklist

## 📋 Cómo Probar

1. Abrir DevTools (F12) → Console
2. Intentar swap con BSL
3. Verificar mensajes en consola:
   - `⚠️ Route #X rejected:` con razón de blacklist
   - `❌ Auto mode: All routes contain blacklisted tokens`

## ✅ Validaciones Implementadas

- ✅ Blacklist en formato Hedera ID: `0.0.4431990`
- ✅ Blacklist en formato EVM corto: `0x43a076`
- ✅ Blacklist en formato EVM completo: `0x000000000000000000000000000000000043a076`
- ✅ Validación ANTES de otras validaciones (prioridad alta)
- ✅ Funciona incluso en modo AUTO
- ✅ Compara en minúsculas (case-insensitive)

## 🔒 Seguridad

La validación de blacklist:
1. Se ejecuta PRIMERO (Paso 0), antes que cualquier otra
2. Es SÍNCRONA (no requiere API calls)
3. Funciona SIEMPRE, incluso en modo AUTO
4. NO permite bypass - token bloqueado = ruta bloqueada

## 📝 Agregar Más Tokens a la Blacklist

Editar: `utils/routeValidation.ts`

```typescript
blacklistedTokens: new Set([
  '0.0.4431990', // BSL (BankSocial)
  '0x43a076', // BSL (EVM)
  // Agregar aquí nuevos tokens problemáticos
  '0.0.XXXXXX', // Nuevo token - Razón
]),
```
