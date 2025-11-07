# Cómo Encontrar la Dirección del SaucerSwap V1 Router

## Lo que sabemos:

### Testnet:
- V1 Router: `0x0000000000000000000000000000000000004b40` (`0.0.19264`)
- V2 Router: `0x0000000000000000000000000000000000159398` (`0.0.1414040`)

### Mainnet:
- V2 Router: `0x00000000000000000000000000000000003c437a` (`0.0.3949434`)
- V1 Router: **???** ← NECESITAMOS ESTO

---

## OPCIÓN 1: Buscar en HashScan (Más Confiable)

### Paso 1: Ir a HashScan
https://hashscan.io/mainnet

### Paso 2: Buscar contratos de SaucerSwap
- Buscar "SaucerSwap"
- O buscar por rango de IDs (el V1 es anterior al V2)
- Buscar contratos creados ANTES de `0.0.3949434`

### Paso 3: Identificar el Router V1
Buscar un contrato que:
- Tenga nombre relacionado con "Router" o "UniswapV2Router"
- Tenga funciones típicas de V2: `swapExactTokensForTokens`, `swapTokensForExactTokens`, etc.
- Sea de SaucerSwap
- Tenga un ID mucho menor que `0.0.3949434`

**Posibles rangos a revisar:**
- `0.0.50000` - `0.0.100000` (basado en estimación)
- Contratos más antiguos de SaucerSwap

---

## OPCIÓN 2: Usar la Interfaz de SaucerSwap

### Paso 1: Ve a la app
https://www.saucerswap.finance/swap

### Paso 2: Inspeccionar red
1. Abre DevTools (F12)
2. Ve a Network
3. Haz un swap pequeño de prueba
4. Busca llamadas al contrato del router
5. Anota la dirección

**Nota**: Esto te dará probablemente el V2, pero puedes:
- Buscar en transacciones históricas viejas (antes de que V2 existiera)
- O preguntar en el Discord de SaucerSwap

---

## OPCIÓN 3: Buscar en Transacciones Viejas

### En HashScan:
1. Busca transacciones de swap antiguas (de hace 1-2 años)
2. Identifica qué contrato router se usaba
3. Ese debería ser el V1 router

---

## OPCIÓN 4: Preguntar Directamente

### Comunidad de SaucerSwap:
- Discord: https://discord.gg/saucerswap
- Telegram
- Twitter: @SaucerSwapLabs

**Pregunta exacta:**
> "Hi! What's the SaucerSwap V1 Router contract address on Hedera mainnet? I need it for my DEX aggregator integration. I already have the V2 router (0.0.3949434), just need the V1."

---

## OPCIÓN 5: Buscar en el SDK de SaucerSwap

Si SaucerSwap tiene un SDK publicado (npm, GitHub), revisa:
- Archivos de configuración
- Constants
- README con direcciones de contratos

---

## VERIFICACIÓN FINAL

Una vez que tengas una dirección candidata (ejemplo: `0.0.XXXXXX`):

### Paso 1: Convertir a EVM
```bash
node -e "
const num = XXXXXX;  // <- el número que encuentres
const hex = '0x' + num.toString(16).padStart(40, '0');
console.log('Hedera ID: 0.0.' + num);
console.log('EVM Address:', hex);
"
```

### Paso 2: Verificar en HashScan
1. Ve a `https://hashscan.io/mainnet/contract/0.0.XXXXXX`
2. Verifica que sea un contrato router
3. Revisa las funciones (deben ser Uniswap V2-style)
4. Verifica que sea de SaucerSwap

### Paso 3: Comparar con Testnet
```bash
# Si el patrón es similar:
# Testnet: V1 (19264) es ~1.36% del V2 (1414040)
# Mainnet: V1 debería ser ~1.36% del V2 (3949434)
# Estimado: ~53,800

# Si encuentras 0.0.XXXXXX, verifica si está en ese rango
```

---

## Cuando la Encuentres:

```bash
# 1. Añadir a .env.local
SAUCERSWAP_V1_ROUTER=0x...  # EVM address

# 2. Verificar con dry-run
node scripts/deploy-v1-adapter-mainnet.js --network mainnet --dry-run

# 3. Si todo se ve bien, desplegar
node scripts/deploy-v1-adapter-mainnet.js --network mainnet
```

---

## Backup: Si NO la Encuentras

Puedes:
1. **Usar solo V2** por ahora (ya funciona)
2. **Preguntar a ETASwap** si pueden compartir la dirección
3. **Esperar** y probar swaps solo con rutas que tengan V2

**PERO** para HBAR → SAUCE necesitas V1, así que es importante encontrarla.

---

## Mi Recomendación:

1. **PRIMERO**: Busca en HashScan contratos de SaucerSwap en el rango `0.0.40000` - `0.0.100000`
2. **SI NO**: Pregunta en Discord de SaucerSwap (respuesta rápida)
3. **ÚLTIMO RECURSO**: Revisa transacciones viejas en HashScan

**Tiempo estimado**: 10-15 minutos

Una vez la tengas, el deployment es ~5 minutos.
