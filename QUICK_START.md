# ⚡ Quick Start - Deployment Checklist

Checklist ultra rápido para desplegar en mainnet en 15 minutos.

## 📝 Pre-requisitos (2 min)

- [ ] 50+ HBAR en tu cuenta de mainnet
- [ ] `.env.local` configurado con HEDERA_ACCOUNT_ID y PRIVATE_KEY
- [ ] Contratos compilados: `npx hardhat compile`

## 🚀 Deployment (10 min)

### Opción A: Interactive (Recomendado)

```bash
npx tsx scripts/deploy-interactive.ts
```

Sigue las instrucciones en pantalla. El script te guiará paso a paso.

### Opción B: Manual

```bash
# 1. Pre-check
npx tsx scripts/pre-deployment-check.ts

# 2. Deploy Exchange (~2 min)
npx tsx scripts/deploy-mainnet-exchange.ts
# → Guarda el Contract ID: 0.0.______

# 3. Deploy Adapter (~2 min)
npx tsx scripts/deploy-mainnet-adapter.ts
# → Guarda el Contract ID: 0.0.______

# 4. Actualiza scripts/configure-adapter-mainnet.ts
# - EXCHANGE_CONTRACT_ID = '0.0.______'
# - ADAPTER_CONTRACT_ID = '0.0.______'

# 5. Configura Adapter (~1 min)
npx tsx scripts/configure-adapter-mainnet.ts

# 6. Actualiza .env.local
# NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.______
# NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x...
```

## ✅ Verificación (3 min)

```bash
# Verifica Exchange
npx tsx scripts/get-contract-info.ts mainnet 0.0.EXCHANGE_ID

# Verifica Adapter
npx tsx scripts/get-contract-info.ts mainnet 0.0.ADAPTER_ID
```

Debe mostrar:
- ✅ Owner: tu address
- ✅ Adapter registrado (en Exchange)
- ✅ Fee wallet: tu address (en Adapter)
- ✅ Fee: 0.3%

## 🧪 Test Swap (5 min)

```bash
# 1. Start dev server
pnpm dev

# 2. Abre http://localhost:3000
# 3. Click NetworkSwitcher → Mainnet
# 4. Connect wallet (HashPack/Blade)
# 5. Swap pequeño: 5 HBAR → USDC
# 6. Verifica SUCCESS en HashScan
```

## 🎉 ¡Listo!

Tu DEX está en producción. Cada swap genera 0.3% de fees a tu wallet.

### Monitorea tus ingresos:

`https://hashscan.io/mainnet/account/0.0.TU_CUENTA`

### Documentación completa:

- 📖 `MAINNET_DEPLOYMENT.md` - Guía completa
- 💰 `FEE_WALLET_CONFIG.md` - Configurar fees
- ✅ `POST_DEPLOYMENT_CHECKLIST.md` - Checklist detallado
- 📦 `DEPLOYMENT_PACKAGE.md` - Resumen del paquete

---

**Tiempo total:** ~15-20 minutos  
**Costo total:** ~40-50 HBAR  
**ROI:** Cuando acumules 40-50 HBAR en fees 💰
