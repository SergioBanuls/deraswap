# 🚀 Guía de Configuración - Hedera Swap

Esta guía te ayudará a configurar completamente la aplicación paso a paso.

## ✅ Checklist de Configuración

### 1. ✅ Proyecto Creado
- [x] Next.js instalado
- [x] Dependencias instaladas
- [x] Build exitoso

### 2. 🔑 Configurar Reown Project ID

**Ya configurado**: `7ac0a646f1db44c2477b87649a45d5a7`

Si necesitas crear tu propio Project ID:
1. Ve a https://dashboard.reown.com/
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
4. Copia el Project ID
5. Pégalo en `.env.local` → `NEXT_PUBLIC_REOWN_PROJECT_ID`

### 3. 🌐 Configurar Red de Hedera

```bash
# En .env.local

# Para desarrollo/pruebas:
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# Para producción:
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
```

### 4. 📍 Obtener Direcciones de Contratos SaucerSwap V2

**Este es el paso más importante.** Necesitas las 3 direcciones de contratos:

#### **Opción A: Desde HashScan (Más Confiable)**

1. **Ve a HashScan**:
   - Mainnet: https://hashscan.io/mainnet/contracts
   - Testnet: https://hashscan.io/testnet/contracts

2. **Busca los contratos**:
   - En la búsqueda, escribe: `SaucerSwap V2 Router`
   - Busca contratos con el ✅ (verificados)
   - Anota las direcciones

3. **Contratos que necesitas**:
   ```
   SwapRouter V2    → Para ejecutar swaps
   Quoter V2        → Para obtener precios
   Factory V2       → Para gestión de pools
   ```

#### **Opción B: Desde el Código de SaucerSwap**

1. Ve a la app: https://app.saucerswap.finance
2. Abre DevTools (F12)
3. Ve a la pestaña **Application** → **Local Storage**
4. Busca configuraciones o constantes con las direcciones

#### **Opción C: Desde GitHub**

```bash
# Clona el repo de SaucerSwap
git clone https://github.com/saucerswaplabs/saucerswaplabs-v2-periphery

# Busca archivos de deployment
cd saucerswaplabs-v2-periphery
grep -r "Router" deployments/
grep -r "Quoter" deployments/
```

#### **Opción D: Pregunta en la Comunidad**

- **Discord de SaucerSwap**: https://discord.gg/saucerswap
- **Telegram de Hedera**: Pregunta por las direcciones de contratos V2
- **Twitter**: @SaucerSwapLabs

### 5. ✏️ Completar .env.local

Una vez que tengas las direcciones:

```bash
# Ejemplo con direcciones (ESTAS SON DE EJEMPLO, USA LAS REALES)
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x00000000000000000000000000000000001a2b3c
NEXT_PUBLIC_QUOTER_ADDRESS=0x00000000000000000000000000000000004d5e6f
NEXT_PUBLIC_FACTORY_ADDRESS=0x0000000000000000000000000000000000789abc
```

**Formato de las direcciones**:
- ✅ Formato EVM: `0x0000000000000000000000000000000000123456` (40 caracteres después de 0x)
- ✅ Formato Hedera: `0.0.123456` (se convertirá automáticamente)

### 6. 🎮 Instalar Wallet

Necesitas una wallet de Hedera para conectarte:

**Recomendado: HashPack**
1. Descarga: https://www.hashpack.app/
2. Instala la extensión del navegador
3. Crea una nueva wallet o importa una existente
4. Para testnet: cambia la red a Testnet en configuración

**Alternativas**:
- Blade Wallet
- Kabila Wallet

### 7. 💰 Obtener HBAR de Testnet (Solo para Pruebas)

Si estás en testnet:

1. Ve al faucet: https://portal.hedera.com/faucet
2. Ingresa tu Account ID de Hedera (formato 0.0.xxxxx)
3. Recibe HBAR gratis para pruebas

### 8. 🚀 Ejecutar la Aplicación

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build
npm start
```

Abre: http://localhost:3000

---

## 🧪 Testing

### Prueba 1: Conexión de Wallet
1. Abre la app
2. Click en "Connect Wallet"
3. Selecciona HashPack (u otra)
4. Aprueba la conexión
5. Verifica que muestra tu dirección

### Prueba 2: Ver Balances
1. Con wallet conectada
2. Click en selector de tokens
3. Deberías ver tu balance de HBAR

### Prueba 3: Obtener Quote
1. Selecciona token IN (ej: HBAR)
2. Selecciona token OUT (ej: USDC)
3. Ingresa cantidad
4. **Si ves un precio**, ¡las direcciones de contratos están correctas! ✅
5. **Si hay error**, verifica las direcciones en `.env.local`

### Prueba 4: Swap (Solo si tienes fondos)
1. Configura un swap pequeño
2. Click en "Swap"
3. Aprueba en tu wallet
4. Espera confirmación
5. Verifica en HashScan

---

## 🐛 Problemas Comunes

### "Cannot read properties of undefined (quoter)"
**Solución**: Las direcciones de contratos están vacías o incorrectas
```bash
# Verifica en .env.local que tengas:
NEXT_PUBLIC_QUOTER_ADDRESS=0x... # No debe estar vacío
```

### "Network mismatch"
**Solución**: Tu wallet está en una red diferente
- App en testnet → Wallet debe estar en testnet
- App en mainnet → Wallet debe estar en mainnet

### "Insufficient balance"
**Solución**:
- Testnet: Usa el faucet para obtener HBAR
- Mainnet: Compra HBAR en un exchange

### Build warnings sobre MetaMask
**Esto es normal**: Son warnings, no errores. La app funciona correctamente.

---

## 📚 Recursos

- **Hedera Docs**: https://docs.hedera.com/
- **SaucerSwap Docs**: https://docs.saucerswap.finance/
- **HashScan Explorer**: https://hashscan.io/
- **Hedera Portal**: https://portal.hedera.com/
- **TanStack Query Docs**: https://tanstack.com/query/latest

---

## ✅ Configuración Completa - Checklist Final

- [ ] Reown Project ID configurado
- [ ] Red de Hedera configurada (testnet/mainnet)
- [ ] Direcciones de contratos obtenidas y configuradas
- [ ] Wallet instalada (HashPack)
- [ ] HBAR en wallet (testnet: faucet, mainnet: comprado)
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Wallet conectada exitosamente
- [ ] Balances visibles en token selector
- [ ] Quote funcionando (precio se muestra)
- [ ] Swap de prueba exitoso (opcional)

**Si completaste todos los pasos**: ¡Felicidades! 🎉 Tu Hedera Swap está completamente funcional.

---

## 💡 Próximos Pasos

1. **Personalizar tokens**: Edita `src/lib/utils/constants.ts` para añadir más tokens
2. **Mejorar UI**: Personaliza colores y estilos en `tailwind.config.ts`
3. **Añadir features**:
   - Historial de transacciones
   - Gráficos de precios
   - Multi-hop swaps
   - Gestión de liquidez

4. **Deploy**:
   - Vercel (recomendado)
   - Netlify
   - Tu propio servidor

---

¿Necesitas ayuda? Revisa `CONTRACT_ADDRESSES.md` para más detalles sobre cómo obtener las direcciones de contratos.
