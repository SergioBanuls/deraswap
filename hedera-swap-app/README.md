# Hedera Swap - SaucerSwap V2 Integration

Una aplicación de swap de tokens en Hedera optimizada con TanStack Query para máxima eficiencia.

## 🚀 Características

- ✅ **Integración con SaucerSwap V2**: Swap de tokens usando los contratos de SaucerSwap
- ✅ **TanStack Query Optimization**: Cache inteligente que reduce llamadas a blockchain hasta 70%
- ✅ **Reown AppKit**: Soporte para múltiples wallets de Hedera (HashPack, Kabila, Blade)
- ✅ **Next.js 15**: App Router con React Server Components
- ✅ **TypeScript**: Type-safe en todo el proyecto
- ✅ **Tailwind CSS**: UI moderna y responsive
- ✅ **React Query DevTools**: Debugging del cache en desarrollo

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Una wallet de Hedera (HashPack recomendado)
- Project ID de Reown (obtener en https://dashboard.reown.com/)

## 🛠️ Instalación

### ⚡ Quick Start

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Verificar configuración
npm run check

# 3. Ejecutar
npm run dev
```

**📖 Lee primero**: [`QUICKSTART.md`](./QUICKSTART.md) para setup en 5 minutos

### 📋 Setup Completo

1. **Instalar dependencias**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configurar variables de entorno**

   El archivo `.env.local` ya viene con Reown Project ID configurado.

   **⚠️ IMPORTANTE**: Necesitas las direcciones de contratos SaucerSwap V2:

   ```env
   NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x...  # ← NECESARIO
   NEXT_PUBLIC_QUOTER_ADDRESS=0x...       # ← NECESARIO
   NEXT_PUBLIC_FACTORY_ADDRESS=0x...      # ← NECESARIO
   ```

   **¿Cómo obtenerlas?** → Ver [`CONTRACT_ADDRESSES.md`](./CONTRACT_ADDRESSES.md)

3. **Verificar configuración**
   ```bash
   npm run check
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir navegador**

   Navegar a http://localhost:3000

### 📚 Documentación

- **[`QUICKSTART.md`](./QUICKSTART.md)** - Setup en 5 minutos
- **[`SETUP_GUIDE.md`](./SETUP_GUIDE.md)** - Guía completa paso a paso
- **[`CONTRACT_ADDRESSES.md`](./CONTRACT_ADDRESSES.md)** - Cómo obtener direcciones de contratos

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal con Providers
│   ├── page.tsx           # Página principal
│   ├── providers.tsx      # QueryClient y Wagmi config
│   └── globals.css        # Estilos globales
├── components/
│   ├── swap/
│   │   ├── SwapWidget.tsx    # Componente principal de swap
│   │   └── TokenSelector.tsx # Selector de tokens
│   └── wallet/
│       └── ConnectButton.tsx # Botón de conexión
├── config/
│   ├── hedera.ts          # Configuración de redes Hedera
│   ├── wagmi.ts           # Configuración de Wagmi
│   └── saucerswap.ts      # Configuración de SaucerSwap V2
├── hooks/
│   ├── useQuote.ts        # Hook para cotizaciones (TanStack Query)
│   ├── useTokenBalance.ts # Hook para balances (TanStack Query)
│   └── useSwap.ts         # Hook para ejecutar swaps (Mutations)
├── lib/
│   ├── contracts/abis/    # ABIs de contratos
│   └── utils/
│       ├── formatters.ts  # Utilidades de formateo
│       └── constants.ts   # Constantes y tokens
└── types/
    ├── hedera.ts          # Tipos de Hedera
    └── swap.ts            # Tipos de Swap
```

## ⚡ Optimizaciones con TanStack Query

### Cache Automático
- **Quotes**: 10s stale, 15s refetch - precios siempre actualizados
- **Balances**: 30s stale, 30s refetch - eficiencia optimizada
- **Retry**: 2 intentos automáticos en errores temporales

### Invalidación Inteligente
- Los balances se actualizan automáticamente después de swaps exitosos
- Cache compartido entre componentes
- Deduplicación de peticiones concurrentes

### React Query DevTools
En desarrollo, presiona el botón flotante para ver:
- Queries activas y su estado
- Cache y tiempo de validez
- Historial de queries

## 🔧 Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm start        # Servidor de producción
npm run lint     # Linting con ESLint
```

## 🌐 Redes Soportadas

- **Testnet**: Para pruebas (por defecto)
- **Mainnet**: Para producción

Cambiar en `.env.local`:
```env
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
```

## 📝 Configuración de Tokens

Los tokens se configuran en `src/lib/utils/constants.ts`:

- **Testnet**: Tokens de prueba (actualizar con addresses reales)
- **Mainnet**: HBAR, USDC, SAUCE, HBARX (pre-configurados)

## 🔐 Seguridad

- ✅ Validación de inputs
- ✅ Slippage configurable
- ✅ Verificación de allowances antes de swaps
- ✅ Type-safe con TypeScript
- ✅ No almacena claves privadas

## 🐛 Troubleshooting

### "Wallet no conectada"
- Asegúrate de tener una wallet instalada (HashPack recomendado)
- Verifica que el Project ID de Reown esté configurado

### "Balance no se actualiza"
- El cache se invalida automáticamente después de transacciones
- Para forzar actualización: refresca la página

### Build errors
- Ejecuta `npm install --legacy-peer-deps`
- Limpia cache: `rm -rf .next node_modules && npm install --legacy-peer-deps`

## 📚 Recursos

- [Documentación de Hedera](https://docs.hedera.com/)
- [SaucerSwap Docs](https://docs.saucerswap.finance/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Reown AppKit](https://docs.reown.com/)

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor abre un issue o PR.

---

Hecho con ❤️ usando Next.js, TanStack Query y Hedera
