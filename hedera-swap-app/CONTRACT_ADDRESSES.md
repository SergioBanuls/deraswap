# SaucerSwap V2 Contract Addresses

## 🔍 Cómo Encontrar las Direcciones

### Método 1: HashScan (Recomendado)
1. Ve a https://hashscan.io/mainnet/contracts
2. Busca "SaucerSwap V2" o "Router V2"
3. Verifica que los contratos estén verificados (checkmark verde)

### Método 2: Desde la App de SaucerSwap
1. Abre https://app.saucerswap.finance
2. Abre DevTools (F12) → Network
3. Realiza una transacción de swap
4. Observa las direcciones de contratos en las llamadas

### Método 3: Documentación Oficial
- Docs: https://docs.saucerswap.finance/
- GitHub: https://github.com/saucerswaplabs

---

## ✅ Direcciones OFICIALES de Contratos

**Fuente**: https://docs.saucerswap.finance/developerx/contract-deployments

### TESTNET (Ya configuradas en tu .env.local ✅)

| Contrato | Formato Hedera | Formato EVM |
|----------|----------------|-------------|
| **SwapRouter V2** | 0.0.1414040 | 0x0000000000000000000000000000000000159198 |
| **QuoterV2** | 0.0.1390002 | 0x0000000000000000000000000000000000153532 |
| **Factory V2** | 0.0.1197038 | 0x000000000000000000000000000000000012446e |

```env
# Ya está en tu .env.local
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x0000000000000000000000000000000000159198
NEXT_PUBLIC_QUOTER_ADDRESS=0x0000000000000000000000000000000000153532
NEXT_PUBLIC_FACTORY_ADDRESS=0x000000000000000000000000000000000012446e
```

### MAINNET

| Contrato | Formato Hedera | Formato EVM |
|----------|----------------|-------------|
| **SwapRouter V2** | 0.0.3949434 | 0x00000000000000000000000000000000003c3f7a |
| **QuoterV2** | 0.0.3949424 | 0x00000000000000000000000000000000003c3f70 |
| **Factory V2** | 0.0.3946833 | 0x00000000000000000000000000000000003c39d1 |

```env
# Para usar mainnet, cambia en .env.local:
NEXT_PUBLIC_HEDERA_NETWORK=mainnet

# Y descomenta estas líneas (ya están en tu .env.local):
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x00000000000000000000000000000000003c3f7a
NEXT_PUBLIC_QUOTER_ADDRESS=0x00000000000000000000000000000000003c3f70
NEXT_PUBLIC_FACTORY_ADDRESS=0x00000000000000000000000000000000003c39d1
```

### ℹ️ Contratos Adicionales (Opcionales)

Estos contratos están disponibles pero no son necesarios para swaps básicos:

**Testnet:**
- NonfungiblePositionManager: 0.0.1308184

**Mainnet:**
- NonfungiblePositionManagerV2: 0.0.4053945
- TickLens: 0.0.3948950
- Oracle: 0.0.3946808

---

## 🔗 Referencias Útiles

- **HashScan Mainnet**: https://hashscan.io/mainnet
- **HashScan Testnet**: https://hashscan.io/testnet
- **SaucerSwap App**: https://app.saucerswap.finance
- **SaucerSwap Docs**: https://docs.saucerswap.finance
- **GitHub**: https://github.com/saucerswaplabs

---

## 📋 Ejemplo de Formato

Cuando encuentres las direcciones, actualiza tu `.env.local`:

```env
# Formato EVM (preferido)
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x0000000000000000000000000000000000a1b2c3
NEXT_PUBLIC_QUOTER_ADDRESS=0x0000000000000000000000000000000000d4e5f6
NEXT_PUBLIC_FACTORY_ADDRESS=0x0000000000000000000000000000000000789012

# O formato Hedera (se convertirá a EVM automáticamente)
# NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0.0.123456
```

---

## ⚠️ Notas Importantes

1. **Verifica siempre** las direcciones en HashScan antes de usar
2. **Mainnet vs Testnet**: Asegúrate de usar las direcciones correctas según tu red
3. **Contratos Verificados**: Solo usa contratos que estén verificados en HashScan
4. **Formato**: Las direcciones pueden estar en formato EVM (0x...) o Hedera (0.0.xxx)

---

## 🆘 Si No Encuentras las Direcciones

Si tienes dificultades para encontrar las direcciones:

1. **Contacta a SaucerSwap**:
   - Discord: https://discord.gg/saucerswap
   - Twitter: @SaucerSwapLabs
   - Telegram: Comunidad oficial

2. **Busca en la comunidad**:
   - Hedera Discord
   - Reddit r/Hedera
   - Telegram de Hedera en español

3. **Revisa transacciones recientes**:
   - Ve a HashScan
   - Busca transacciones de swap recientes
   - Identifica los contratos utilizados
