# 📋 Resumen: Guías de Deployment a Mainnet

He creado una guía completa para el deployment a mainnet, considerando todos los errores que encontramos durante el deployment de testnet.

---

## 📚 Documentos Creados

### 1. **MAINNET_DEPLOYMENT_GUIDE.md** (Guía Completa)
La guía principal con todos los detalles:
- ✅ Pre-requisitos y balance necesario
- ✅ Configuración paso a paso
- ✅ Soluciones a errores conocidos (Hardhat, Ethers, Node.js)
- ✅ Deployment secuencial detallado
- ✅ Verificación post-deployment
- ✅ Testing y monitoreo
- ✅ Troubleshooting específico

### 2. **MAINNET_QUICK_CHECKLIST.md** (Checklist Rápido)
Lista de verificación rápida para deployment:
- ✅ Checklist de pre-requisitos
- ✅ Comandos exactos a ejecutar
- ✅ Verificación de versiones
- ✅ Pasos de deployment simplificados
- ✅ Troubleshooting rápido
- ✅ Costo estimado (80-90 HBAR)

### 3. **SCRIPT_MODIFICATIONS_FOR_MAINNET.md** (Modificaciones de Scripts)
Cambios exactos necesarios en los scripts:
- ✅ Modificaciones en `02-deploy-adapter.js`
- ✅ Modificaciones en `03-register-adapters.js`
- ✅ Estructura del `.env.local` completa
- ✅ Ejemplos de código antes/después

---

## ✅ Cambios Aplicados Automáticamente

He modificado los siguientes archivos para que funcionen en **AMBAS** redes (testnet y mainnet):

### 1. `scripts/02-deploy-adapter.js`
- ✅ Detecta automáticamente la red (testnet/mainnet)
- ✅ Usa `YOUR_FEE_WALLET` para testnet
- ✅ Usa `MAINNET_YOUR_FEE_WALLET` para mainnet
- ✅ Mensajes de error específicos por red

### 2. `scripts/03-register-adapters.js`
- ✅ Detecta automáticamente la red
- ✅ Usa `EXCHANGE_ADDRESS` y `SAUCERSWAP_V2_ADAPTER` para testnet
- ✅ Usa `MAINNET_EXCHANGE_ADDRESS` y `MAINNET_SAUCERSWAP_V2_ADAPTER` para mainnet
- ✅ Validación mejorada

### 3. `hardhat.config.js`
- ✅ Configuración de mainnet usa `MAINNET_PRIVATE_KEY`
- ✅ Configuración de testnet usa `PRIVATE_KEY`
- ✅ URLs y chainIds correctos para ambas redes

---

## 📝 Qué Debes Hacer Antes de Desplegar a Mainnet

### Paso 1: Añadir Variables de Mainnet a `.env.local`

Agrega estas líneas al **final** del archivo (sin borrar las de testnet):

```env
# ============================================
# MAINNET DEPLOYMENT CONFIGURATION
# ============================================

# Private key de mainnet
MAINNET_PRIVATE_KEY=tu_private_key_mainnet_aqui

# Account ID de mainnet
MAINNET_HEDERA_ACCOUNT_ID=0.0.XXXXXX

# Fee wallet en formato EVM (convertir tu account ID)
MAINNET_YOUR_FEE_WALLET=0x...

# Contratos desplegados (se llenan después del deployment)
MAINNET_EXCHANGE_ADDRESS=
MAINNET_SAUCERSWAP_V2_ADAPTER=
```

### Paso 2: Convertir tu Account ID a Formato EVM

```bash
node -e "
const accountId = '0.0.XXXXXX'; // TU ACCOUNT ID DE MAINNET
const num = accountId.split('.')[2];
const hex = '0x' + num.toString(16).padStart(40, '0');
console.log('Account ID:', accountId);
console.log('EVM Address:', hex);
"
```

Copia el resultado en `MAINNET_YOUR_FEE_WALLET`.

### Paso 3: Verificar Balance

Necesitas **mínimo 100 HBAR** en tu wallet de mainnet:
- Exchange deployment: ~35 HBAR
- Adapter deployment: ~35 HBAR  
- Adapter registration: ~8 HBAR
- Testing: ~5-10 HBAR
- Buffer: ~10-20 HBAR

Verifica en: `https://hashscan.io/mainnet/account/0.0.XXXXXX`

---

## 🚀 Comandos para Deployment a Mainnet

Una vez configurado todo:

```bash
# 1. Verificar versiones correctas
npx hardhat --version    # Debe ser 2.x
pnpm list ethers         # Debe ser 5.x

# 2. Compilar
rm -rf artifacts cache
npx hardhat compile

# 3. Desplegar Exchange
npx hardhat run scripts/01-deploy-exchange.js --network mainnet
# ⚠️ COPIAR la dirección y añadirla a .env.local como MAINNET_EXCHANGE_ADDRESS

# 4. Desplegar Adapter
npx hardhat run scripts/02-deploy-adapter.js --network mainnet
# ⚠️ COPIAR la dirección y añadirla a .env.local como MAINNET_SAUCERSWAP_V2_ADAPTER

# 5. Registrar Adapter
npx hardhat run scripts/03-register-adapters.js --network mainnet

# 6. Actualizar frontend
# Editar .env.local:
# NEXT_PUBLIC_HEDERA_NETWORK=mainnet
# NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom
# NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=[MAINNET_EXCHANGE_ADDRESS]

# 7. Restaurar hook de mainnet
mv hooks/useSwapRoutes.mainnet.ts hooks/useSwapRoutes.ts

# 8. Reiniciar servidor
pnpm dev
```

---

## 🔍 Diferencias Clave: Testnet vs Mainnet

| Aspecto | Testnet | Mainnet |
|---------|---------|---------|
| **Private Key** | `PRIVATE_KEY` | `MAINNET_PRIVATE_KEY` |
| **Fee Wallet** | `YOUR_FEE_WALLET` | `MAINNET_YOUR_FEE_WALLET` |
| **Exchange Address** | `EXCHANGE_ADDRESS` | `MAINNET_EXCHANGE_ADDRESS` |
| **Adapter Address** | `SAUCERSWAP_V2_ADAPTER` | `MAINNET_SAUCERSWAP_V2_ADAPTER` |
| **Network en .env** | `testnet` | `mainnet` |
| **Hook de Swap** | Cálculo local (API no disponible) | API de ETASwap (restaurar original) |
| **Costo deployment** | Gratis (faucet) | ~80-90 HBAR |

---

## ⚠️ Errores Solucionados del Deployment de Testnet

Las guías incluyen soluciones para todos estos errores que encontramos:

### 1. ❌ Hardhat ESM Error
**Error:** "Hardhat only supports ESM projects"  
**Solución:** Downgrade a Hardhat 2.x (ya aplicado)

### 2. ❌ Ethers Version Mismatch  
**Error:** "TypeError: Class extends value undefined is not a constructor"  
**Solución:** Usar Ethers 5.x en lugar de 6.x (ya aplicado)

### 3. ❌ Config File Not Found
**Error:** "Error HHE3: No Hardhat config file found"  
**Solución:** Usar `hardhat.config.js` (no `.cjs` ni `.mjs`)

### 4. ❌ ENS Resolution Error
**Error:** "network does not support ENS"  
**Solución:** Direcciones completas en scripts (ya corregido)

### 5. ❌ Node.js Version Warning
**Warning:** Node.js 23.11.0 no soportado oficialmente  
**Solución:** Funciona pero con warnings, o usar Node 22.10.0 LTS

---

## 🎯 Flujo Completo: Testnet → Mainnet

```
1. TESTNET (Completado ✅)
   ├─ Contratos desplegados
   ├─ Adapter con tu fee wallet testnet
   ├─ Hook simplificado (cálculo local)
   └─ Testing exitoso

2. PREPARACIÓN MAINNET (Siguiente paso)
   ├─ Añadir variables a .env.local
   ├─ Verificar balance > 100 HBAR
   └─ Verificar versiones de herramientas

3. DEPLOYMENT MAINNET
   ├─ Compilar contratos
   ├─ Deploy Exchange
   ├─ Deploy Adapter con fee wallet mainnet
   └─ Registrar adapter

4. FRONTEND MAINNET
   ├─ Actualizar .env.local (network=mainnet)
   ├─ Restaurar hook original (usa API ETASwap)
   └─ Reiniciar servidor

5. VERIFICACIÓN
   ├─ Revisar contratos en HashScan
   ├─ Hacer swap de prueba
   └─ Verificar fees en tu wallet
```

---

## 📊 Estado Actual del Proyecto

### ✅ Completado

- [x] Deployment en **testnet** exitoso
- [x] Exchange desplegado: `0xCE8E6103859CF600Ee42b1B52Cbf07bADBC42D33`
- [x] Adapter desplegado: `0x45C3eefbff223D21d87252D348e37f3826b1f3bA`
- [x] Fee wallet configurado: `0.0.7192078`
- [x] Scripts modificados para soportar mainnet
- [x] Guías completas de deployment creadas
- [x] Soluciones a errores documentadas

### 🔜 Pendiente

- [ ] Añadir variables de mainnet a `.env.local`
- [ ] Obtener 100+ HBAR en wallet de mainnet
- [ ] Deployment a mainnet
- [ ] Testing en mainnet
- [ ] Monitoreo de fees en producción

---

## 📖 Documentación de Referencia

| Documento | Uso |
|-----------|-----|
| **MAINNET_DEPLOYMENT_GUIDE.md** | Guía completa con todos los detalles |
| **MAINNET_QUICK_CHECKLIST.md** | Lista rápida para deployment |
| **SCRIPT_MODIFICATIONS_FOR_MAINNET.md** | Cambios en scripts explicados |
| **DEPLOYMENT_COMPLETE.md** | Resumen del deployment de testnet |
| **CONTRACTS_SUMMARY.md** | Explicación técnica de contratos |

---

## 💡 Próximos Pasos Recomendados

1. **Ahora:** Revisa las guías para familiarizarte con el proceso
2. **Preparación:** Consigue HBAR de mainnet (compra en exchange)
3. **Configuración:** Añade variables de mainnet a `.env.local`
4. **Testing:** Verifica que todo compile correctamente
5. **Deployment:** Sigue la guía paso a paso
6. **Verificación:** Prueba con swap pequeño en mainnet
7. **Producción:** Monitorea fees y volumen

---

## 🎉 Resultado Final

Después del deployment a mainnet:

- ✅ Tendrás tu **propio protocolo de swaps** en Hedera mainnet
- ✅ **Las fees (0.3%) irán directamente a tu wallet** en lugar de a ETASwap
- ✅ Tendrás **control total** sobre el contrato (puedes modificarlo)
- ✅ Podrás **escalar y mejorar** el protocolo según necesites
- ✅ **Código open-source** que puedes auditar y personalizar

---

## 📞 Recordatorios Importantes

- ⚠️ **NUNCA** commitees el archivo `.env.local` (está en `.gitignore`)
- ⚠️ Guarda tu **private key de mainnet** de forma segura
- ⚠️ Verifica las **direcciones de contratos** antes de usar en producción
- ⚠️ Haz **backup** de todas las direcciones desplegadas
- ⚠️ **Testea** en testnet antes de deployar cambios a mainnet

---

**¡Todo está listo para cuando decidas desplegar a mainnet!** 🚀

Las guías están completas, los scripts están modificados y preparados, y tienes soluciones documentadas para todos los errores conocidos.
