# 🎯 Sistema de Incentivos con NFTs - Guía de Implementación

## 📋 Checklist de Implementación

---

## FASE 1: Configuración de Infraestructura

### 1.1 Configuración de Supabase
- [x] Crear cuenta en [Supabase](https://supabase.com) (si no existe)
- [x] Crear nuevo proyecto en Supabase
- [x] Copiar URL y API Keys del proyecto

#### Crear Tabla `swap_history`
- [x] Ir a SQL Editor en Supabase
- [x] Ejecutar el siguiente SQL:
```sql
CREATE TABLE swap_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  from_token_address TEXT NOT NULL,
  to_token_address TEXT NOT NULL,
  from_amount TEXT NOT NULL,
  to_amount TEXT NOT NULL,
  usd_value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_swap_history_wallet ON swap_history(wallet_address);
CREATE INDEX idx_swap_history_timestamp ON swap_history(timestamp);
CREATE INDEX idx_swap_history_tx_hash ON swap_history(tx_hash);
```

#### Crear Tabla `user_incentives`
- [x] Ejecutar el siguiente SQL:
```sql
CREATE TABLE user_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  total_swapped_usd NUMERIC DEFAULT 0,
  nft_minted BOOLEAN DEFAULT false,
  nft_token_id TEXT,
  nft_serial_number TEXT,
  nft_minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por wallet
CREATE INDEX idx_user_incentives_wallet ON user_incentives(wallet_address);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_incentives_updated_at
  BEFORE UPDATE ON user_incentives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Configurar Row Level Security (RLS)
- [x] Ejecutar el siguiente SQL:
```sql
-- Habilitar RLS
ALTER TABLE swap_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_incentives ENABLE ROW LEVEL SECURITY;

-- Políticas para swap_history (solo lectura para usuarios)
CREATE POLICY "Allow read access to own swaps" ON swap_history
  FOR SELECT USING (true);

-- Políticas para user_incentives (solo lectura para usuarios)
CREATE POLICY "Allow read access to own incentives" ON user_incentives
  FOR SELECT USING (true);

-- Las escrituras solo se harán desde el backend con service role key
```

### 1.2 Variables de Entorno
- [x] Añadir a `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# NFT Incentive Token
NFT_TOKEN_ID=0.0.XXXXXX
NFT_TREASURY_ID=0.0.XXXXXX
NFT_TREASURY_PRIVATE_KEY=tu_private_key_segura
```

### 1.3 Instalación de Dependencias
- [x] Ejecutar: `pnpm add @supabase/supabase-js`
- [x] Verificar instalación en `package.json`

---

## FASE 2: Configuración del Cliente Supabase

### 2.1 Crear Cliente Supabase
- [x] Crear archivo `/lib/supabase.ts`
- [x] Configurar cliente para frontend
- [x] Configurar cliente para backend (service role)

### 2.2 Crear Tipos TypeScript
- [x] Crear archivo `/types/incentive.ts`
- [x] Definir interfaces:
  - `SwapHistoryRecord`
  - `UserIncentive`
  - `IncentiveProgress`
  - `NFTMetadata`

---

## FASE 3: Backend - API Endpoints

### 3.1 API: Record Swap
- [x] Crear `/app/api/incentives/record-swap/route.ts`
- [x] Implementar validación de datos
- [x] Insertar registro en `swap_history`
- [x] Actualizar o crear registro en `user_incentives`
- [x] Calcular y actualizar `total_swapped_usd`
- [x] Retornar progreso actualizado

### 3.2 API: Get Progress
- [x] Crear `/app/api/incentives/progress/route.ts`
- [x] Obtener datos de `user_incentives` por wallet_address
- [x] Calcular porcentaje de progreso (max 100%)
- [x] Retornar: `{ totalSwappedUsd, progress, nftEligible, nftMinted, nftInfo }`

### 3.3 API: Mint NFT
- [x] Crear `/app/api/incentives/mint-nft/route.ts`
- [x] Verificar elegibilidad (>= $10 USD)
- [x] Verificar que no haya minteado ya
- [ ] Llamar a función de minteo en Hedera (TODO: Fase 4)
- [x] Actualizar registro en `user_incentives`
- [x] Retornar información del NFT minteado

---

## FASE 4: Smart Contract NFT en Hedera

### 4.1 Crear Script de Deployment
- [ ] Crear `/scripts/deploy-incentive-nft.ts`
- [ ] Configurar parámetros del NFT:
  - Name: "DeraSwap Pioneer"
  - Symbol: "DSWP"
  - Type: NON_FUNGIBLE_UNIQUE
  - Max Supply: 10,000 (ajustar según necesidad)
  - Treasury: Tu cuenta admin
  - Supply Key: Para mintear NFTs
  - Custom Fees: Opcional

### 4.2 Crear Metadata del NFT
- [ ] Diseñar imagen/arte del NFT
- [ ] Crear metadata JSON:
```json
{
  "name": "DeraSwap Pioneer #{{SERIAL}}",
  "description": "Awarded to pioneers who swapped $10+ on DeraSwap",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Tier", "value": "Pioneer" },
    { "trait_type": "Threshold", "value": "$10 USD" },
    { "trait_type": "Network", "value": "Hedera" }
  ]
}
```
- [ ] Subir imagen a IPFS (Pinata, NFT.storage, etc.)
- [ ] Subir metadata a IPFS

### 4.3 Deploy NFT en Testnet
- [ ] Ejecutar script de deployment en testnet
- [ ] Verificar token creado en HashScan Testnet
- [ ] Guardar Token ID en variables de entorno

### 4.4 Crear Utilidad de Minteo
- [ ] Crear `/utils/nftMinter.ts`
- [ ] Implementar función `mintIncentiveNFT(walletAddress, metadata)`
- [ ] Manejar errores de minteo
- [ ] Retornar serial number y token ID

---

## FASE 5: Frontend - Componentes UI

### 5.1 Hook de Incentivos
- [x] Crear `/hooks/useIncentives.ts`
- [x] Implementar función `fetchProgress(walletAddress)`
- [x] Implementar función `claimNFT(walletAddress)`
- [x] Manejar estados: loading, error, data

### 5.2 Componente de Progreso
- [x] Crear `/components/IncentiveProgress.tsx`
- [x] Mostrar barra de progreso visual
- [x] Mostrar total swappeado ($X / $10)
- [x] Botón "Claim NFT" (solo si elegible y no minteado)
- [x] Mostrar información del NFT si ya fue minteado

### 5.3 Integrar en Interfaz
- [x] Modificar `/components/AccountDialog.tsx`
- [x] Añadir `<IncentiveProgress />` en la parte superior
- [x] Pasar `accountId` como prop

### 5.4 Registrar Swaps Automáticamente
- [x] Modificar `/hooks/useSwapExecution.ts`
- [x] Después de swap exitoso, llamar a `/api/incentives/record-swap`
- [x] Datos necesarios:
  - wallet_address (desde contexto)
  - tx_hash (del resultado del swap)
  - from_token_address, to_token_address
  - from_amount, to_amount
  - usd_value (calcular usando precios actuales)

---

## FASE 6: Frontend - Componentes UI

### 6.1 Componente IncentiveProgress
- [ ] Crear `/components/IncentiveProgress.tsx`
- [ ] Barra de progreso circular (reutilizar o adaptar `CountdownRing`)
- [ ] Mostrar monto total swapeado
- [ ] Mostrar porcentaje de progreso
- [ ] Botón "Claim NFT" (deshabilitado si no elegible)
- [ ] Estado de NFT minteado con link a HashScan

### 6.2 Modificar AccountDialog
- [ ] Abrir `/components/AccountDialog.tsx`
- [ ] Añadir sección "Incentivos" o "Rewards"
- [ ] Integrar componente `IncentiveProgress`
- [ ] Mostrar modal de confirmación para mintear NFT
- [ ] Toast de éxito con confetti effect (opcional)

### 6.3 Modificar useSwapExecution
- [ ] Abrir `/hooks/useSwapExecution.ts`
- [ ] En el paso `success`, añadir llamada a API:
  - Calcular USD value del swap
  - POST a `/api/incentives/record-swap`
  - Actualizar estado de incentivos
- [ ] Manejar errores silenciosamente (no bloquear UX del swap)

---

## FASE 7: Testing en Testnet

### 7.1 Testing Backend
- [ ] Probar endpoint `record-swap` con datos de prueba
- [ ] Verificar inserción en Supabase
- [ ] Probar endpoint `progress` con diferentes wallets
- [ ] Probar endpoint `mint-nft` con wallet elegible

### 7.2 Testing Frontend
- [ ] Realizar swap de prueba en testnet
- [ ] Verificar registro en DB
- [ ] Verificar actualización de progreso en UI
- [ ] Realizar múltiples swaps hasta alcanzar $10
- [ ] Reclamar NFT de prueba
- [ ] Verificar NFT en HashScan
- [ ] Verificar UI después de mintear

### 7.3 Testing Edge Cases
- [ ] Intentar reclamar NFT sin ser elegible
- [ ] Intentar reclamar NFT dos veces
- [ ] Probar con wallet sin swaps previos
- [ ] Probar con tx_hash duplicado
- [ ] Probar desconexión de wallet durante el proceso

---

## FASE 8: Mejoras y Seguridad

### 8.1 Seguridad
- [ ] Implementar rate limiting en API routes
- [ ] Validar signatures de wallet (opcional)
- [ ] Verificar tx_hash contra Hedera network
- [ ] Proteger supply key del NFT (env vars seguras)
- [ ] Sanitizar inputs de usuarios

### 8.2 Optimizaciones
- [ ] Implementar caché de progreso en localStorage
- [ ] Debounce de llamadas a API
- [ ] Lazy loading de componente de incentivos
- [ ] Optimistic updates en UI

### 8.3 UX Enhancements
- [ ] Animaciones al completar swaps
- [ ] Confetti effect al alcanzar $10
- [ ] Preview del NFT antes de mintear
- [ ] Share button para redes sociales
- [ ] Notificaciones push (opcional)

---

## FASE 9: Deployment a Mainnet

### 9.1 Preparación
- [ ] Deploy NFT contract en Hedera Mainnet
- [ ] Actualizar variables de entorno de producción
- [ ] Verificar configuración de Supabase en producción
- [ ] Backup de base de datos

### 9.2 Deploy
- [ ] Deploy de la aplicación (Vercel, etc.)
- [ ] Verificar endpoints API en producción
- [ ] Smoke testing en mainnet con wallet de prueba
- [ ] Monitorear logs y errores

### 9.3 Monitoreo
- [ ] Configurar alertas en Supabase
- [ ] Monitorear rate de minteo de NFTs
- [ ] Analítica de uso del sistema de incentivos
- [ ] Dashboard de métricas (opcional)

---

## 📊 MÉTRICAS DE ÉXITO

- [ ] X% de usuarios completan su primer swap
- [ ] X% de usuarios alcanzan $10 swapeados
- [ ] X% de usuarios elegibles reclaman su NFT
- [ ] Tiempo promedio para alcanzar $10
- [ ] Tasa de retención de usuarios con NFT

---

## 🔗 RECURSOS ÚTILES

- [Supabase Docs](https://supabase.com/docs)
- [Hedera SDK Docs](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [Hedera NFT Tutorial](https://docs.hedera.com/hedera/tutorials/token-service/nfts)
- [IPFS Pinata](https://www.pinata.cloud/)
- [HashScan Explorer](https://hashscan.io/)

---

## 💡 NOTAS IMPORTANTES

- Siempre testear en testnet primero
- Mantener claves privadas seguras (nunca en el repositorio)
- Documentar cambios importantes
- Hacer commits frecuentes durante el desarrollo
- Considerar límites de rate en APIs externas

---

## 📝 CHANGELOG

### [Sin versión] - 2025-11-18
- ✅ Creada guía de implementación inicial
- ⏳ Pendiente: Fase 1 - Configuración de Supabase

---

**Última actualización**: 18 de Noviembre, 2025
**Versión**: 1.0.0
**Autor**: DeraSwap Team
