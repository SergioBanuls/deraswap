# ⚡ Quick Start - Hedera Swap

## 🎯 Estado Actual

```bash
✅ Proyecto configurado
✅ Dependencias instaladas
✅ Build exitoso
✅ Reown Project ID configurado
✅ Direcciones de contratos SaucerSwap V2 configuradas (Testnet)
```

**¡Todo listo para usar!** 🎉

## 🚀 Para Empezar Ahora

### 1️⃣ Verifica tu configuración
```bash
npm run check
```

### 2️⃣ Ejecuta la app
```bash
npm run dev
```
Abre: http://localhost:3000

### 3️⃣ Obtén HBAR de testnet (gratis)
- Ve al faucet: https://portal.hedera.com/faucet
- Ingresa tu Account ID (lo verás en HashPack)
- Recibe HBAR para pruebas

### 4️⃣ Conecta tu wallet
- Instala HashPack: https://www.hashpack.app/
- Configura en **Testnet** (importante!)
- Click en "Connect Wallet" en la app
- Selecciona HashPack y aprueba

**¡Listo! Ya puedes hacer swaps** 🎉

---

## ℹ️ Direcciones de Contratos Ya Configuradas

Las direcciones de SaucerSwap V2 están **pre-configuradas** en `.env.local`:

**TESTNET** (activo):
- SwapRouter: `0.0.1414040`
- QuoterV2: `0.0.1390002`
- Factory: `0.0.1197038`

**MAINNET** (disponible):
- SwapRouter: `0.0.3949434`
- QuoterV2: `0.0.3949424`
- Factory: `0.0.3946833`

**Fuente oficial**: https://docs.saucerswap.finance/developerx/contract-deployments

### 🔄 Cambiar a Mainnet

Para usar mainnet en lugar de testnet:

1. Edita `.env.local`
2. Cambia: `NEXT_PUBLIC_HEDERA_NETWORK=mainnet`
3. Descomenta las líneas de MAINNET
4. Comenta las de TESTNET
5. Reinicia: `npm run dev`
6. **IMPORTANTE**: Cambia tu HashPack a Mainnet también

---

## 📚 Documentación Completa

- **`SETUP_GUIDE.md`** → Guía paso a paso completa
- **`CONTRACT_ADDRESSES.md`** → Detalles sobre cómo obtener direcciones
- **`README.md`** → Documentación técnica del proyecto

---

## 🧪 Testing Rápido

Todo ya está configurado, solo prueba:

```bash
# 1. Ejecuta la app
npm run dev

# 2. En el navegador (http://localhost:3000):
#    - Conecta HashPack (en Testnet)
#    - Selecciona HBAR → USDC
#    - Ingresa cantidad: 1
#    - Deberías ver un PRECIO → ✅ Funciona!
#
# 3. Haz un swap de prueba (necesitas HBAR del faucet)
```

**Si no ves precios**:
```bash
# Verifica configuración
npm run check

# Debería mostrar todo ✅
```

---

## ⚡ Comandos Útiles

```bash
npm run dev         # Desarrollo
npm run build       # Build de producción
npm run start       # Servidor de producción
npm run lint        # Linting
npm run check       # Verificar configuración
```

---

## 🆘 Problemas Comunes

### La UI se ve pero no carga precios
**→ Verifica tu HashPack esté en Testnet**
```
1. Abre HashPack
2. Settings → Network
3. Selecciona "Testnet"
4. Recarga la app
```

### "Network mismatch" o "Unsupported chain"
**→ Wallet en red diferente a la app**
```bash
# La app está en Testnet por defecto
# Tu HashPack debe estar en Testnet también

# HashPack: Settings → Network → Testnet
```

### No puedo hacer swap (botón deshabilitado)
**→ Necesitas HBAR del faucet**
```
1. Ve a: https://portal.hedera.com/faucet
2. Ingresa tu Account ID (ej: 0.0.123456)
3. Recibirás 1000 HBAR gratis para pruebas
```

### "Insufficient balance"
**→ No tienes suficiente HBAR**
- Usa el faucet (testnet)
- O reduce la cantidad del swap

---

## ✅ Checklist Final

- [x] `npm run check` pasa sin errores ← Ya configurado
- [x] Direcciones de contratos configuradas ← Ya configurado
- [ ] HashPack instalada y configurada en Testnet
- [ ] HBAR obtenido del faucet
- [ ] `npm run dev` ejecutándose
- [ ] Wallet conectada en la app
- [ ] Al seleccionar tokens (HBAR→USDC), se muestra un precio
- [ ] Swap de prueba exitoso

**Todo ✅?** ¡Felicidades! Tu Hedera Swap está funcionando completamente 🎉

---

## 🚀 Siguiente Nivel

1. **Personalizar tokens** → Edita `src/lib/utils/constants.ts`
2. **Cambiar estilos** → Edita `tailwind.config.ts` y componentes
3. **Añadir features** → Ver guía en `README.md`
4. **Deploy** → Vercel, Netlify, o tu servidor

---

**¿Necesitas ayuda?** Lee `SETUP_GUIDE.md` para instrucciones detalladas.
