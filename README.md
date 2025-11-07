# DeraSwap - Hedera dApp con Reown AppKitThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Una aplicación Next.js que integra Hedera Hashgraph utilizando el SDK oficial de Reown AppKit y el adaptador nativo de Hedera para gestionar conexiones de wallet y transacciones HTS (Hedera Token Service).## Getting Started



## 🚀 CaracterísticasFirst, run the development server:



- ✅ Integración con **Hedera Wallet Connect** usando Reown (WalletConnect v2)```bash

- ✅ Conexión nativa a wallets de Hedera (HashPack, Blade, etc.)npm run dev

- ✅ Soporte para Hedera Testnet y Mainnet# or

- ✅ Interfaz moderna construida con Next.js 16 y Tailwind CSSyarn dev

- ✅ TypeScript para type-safety# or

- ✅ Hook personalizado para gestión de conexionespnpm dev

# or

## 📋 Requisitos Previosbun dev

```

- Node.js 18+ o superior

- pnpm (recomendado) o npmOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- Una cuenta en [Reown Cloud](https://cloud.reown.com/) para obtener un Project ID

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 🛠️ Instalación

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

1. **Instalar dependencias**

   ```bash## Learn More

   pnpm install

   ```To learn more about Next.js, take a look at the following resources:



2. **Configurar variables de entorno**- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

   - [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

   El archivo `.env.local` ya está configurado con:

   ```bashYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

   NEXT_PUBLIC_REOWN_PROJECT_ID=7ac0a646f1db44c2477b87649a45d5a7

   NEXT_PUBLIC_HEDERA_NETWORK=testnet## Deploy on Vercel

   ```

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

3. **Iniciar el servidor de desarrollo**

   ```bashCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

   pnpm dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
deraswap/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx             # Página principal con UI de conexión
│   └── globals.css          # Estilos globales
├── hooks/
│   └── useReownConnect.ts   # Hook personalizado para Hedera Wallet Connect
├── .env.local               # Variables de entorno
├── package.json
└── README.md
```

## 🔧 Uso

### Hook `useReownConnect`

El hook proporciona una interfaz simple para conectarse a wallets de Hedera:

```typescript
import { useReownConnect } from '@/hooks/useReownConnect';

function MyComponent() {
  const { connect, disconnect, callNativeMethod, isConnected, account, loading } = useReownConnect();

  const handleConnect = async () => {
    await connect();
  };

  return (
    <button onClick={handleConnect} disabled={loading}>
      {isConnected ? `Conectado: ${account}` : 'Conectar Wallet'}
    </button>
  );
}
```

### Métodos Disponibles

- **`connect()`**: Abre el modal de conexión de wallet
- **`disconnect()`**: Desconecta la wallet actual
- **`callNativeMethod(method, params)`**: Ejecuta métodos nativos de Hedera
- **`isConnected`**: Boolean que indica si hay una wallet conectada
- **`account`**: Account ID de Hedera (ej: "0.0.123456")
- **`loading`**: Boolean que indica si está en proceso de conexión

## 📦 Dependencias Principales

- `@hashgraph/hedera-wallet-connect`: SDK oficial de Hedera para WalletConnect
- `@hashgraph/sdk`: SDK de Hedera para construir transacciones
- `@reown/appkit`: SDK de Reown (WalletConnect v2)
- `next`: Framework de React
- `tailwindcss`: Framework CSS

## 🔨 Scripts Disponibles

```bash
pnpm dev      # Iniciar servidor de desarrollo
pnpm build    # Construir para producción
pnpm start    # Iniciar servidor de producción
pnpm lint     # Ejecutar linter
```

## � Deployment a Mainnet

Para desplegar tus propios contratos personalizados en Hedera Mainnet:

1. **[📖 Guía de Deployment Mainnet](./MAINNET_DEPLOYMENT.md)** - Instrucciones paso a paso
2. **[💰 Configuración de Wallet de Fees](./FEE_WALLET_CONFIG.md)** - Cómo configurar tu wallet para recibir fees
3. **[✅ Pre-deployment Checklist](./scripts/pre-deployment-check.ts)** - Script para verificar antes del deployment

### Quick Start Deployment

```bash
# 1. Verificar que todo está listo
npx tsx scripts/pre-deployment-check.ts

# 2. Deploy Exchange contract
npx tsx scripts/deploy-mainnet-exchange.ts

# 3. Deploy Adapter contract
npx tsx scripts/deploy-mainnet-adapter.ts

# 4. Configurar adapter (actualiza los IDs primero)
npx tsx scripts/configure-adapter-mainnet.ts
```

## �📚 Recursos

- [Documentación de Hedera](https://docs.hedera.com/)
- [Hedera Wallet Connect](https://github.com/hashgraph/hedera-wallet-connect)
- [Reown AppKit](https://docs.reown.com/appkit/overview)
- [Next.js](https://nextjs.org/docs)
- [SaucerSwap V2](https://www.saucerswap.finance)
- [HashScan Explorer](https://hashscan.io)
