# 🔗 Guía de Conexión de Wallets

## ✅ Cambios Implementados

Hemos creado un **modal personalizado** que muestra las wallets específicas de Hedera directamente, en lugar del modal genérico de WalletConnect.

### Antes
❌ Solo mostraba opciones genéricas de WalletConnect

### Ahora ✅
✅ Muestra HashPack, Kabila y Blade directamente
✅ Detecta si la wallet está instalada
✅ Ofrece descargar si no está instalada
✅ Opción de "Other Wallets" para más opciones

---

## 🎨 Nuevo Modal de Conexión

### Wallets Destacadas

Al hacer clic en "Connect Wallet", verás:

```
┌─────────────────────────────────┐
│  Connect Wallet              ✕  │
├─────────────────────────────────┤
│  Choose your Hedera wallet:     │
│                                  │
│  🔷 HashPack                  >  │
│     The most popular Hedera...   │
│                                  │
│  🟣 Kabila                    >  │
│     Mobile-first Hedera...       │
│                                  │
│  ⚔️ Blade                     >  │
│     Secure Hedera wallet         │
│                                  │
│  ──────────── or ────────────    │
│                                  │
│  🔗 Other Wallets (WalletConnect)│
│                                  │
│  Don't have a wallet? Get HashPack│
└─────────────────────────────────┘
```

---

## 📁 Archivos Creados

### 1. `HederaWalletModal.tsx`
Modal personalizado que muestra wallets de Hedera

**Ubicación**: `src/components/wallet/HederaWalletModal.tsx`

**Características**:
- ✅ Lista de wallets específicas de Hedera
- ✅ Detección automática de instalación
- ✅ Links de descarga si no está instalada
- ✅ Diseño moderno y responsive
- ✅ Soporte para dark mode

### 2. `window.d.ts`
Tipos de TypeScript para extensiones de wallets

**Ubicación**: `src/types/window.d.ts`

**Incluye tipos para**:
- `window.hashpack`
- `window.kabila`
- `window.blade`
- `window.ethereum`

### 3. `ConnectButton.tsx` (Actualizado)
Botón de conexión mejorado que usa el nuevo modal

**Cambios**:
- Usa `HederaWalletModal` en lugar del modal genérico
- Mejor manejo de estados
- UI mejorada con sombras y transiciones

### 4. `providers.tsx` (Actualizado)
Configuración mejorada de Reown AppKit

**Nuevas opciones**:
- `featuredWalletIds`: Wallets destacadas
- `allWallets: true`: Muestra todos los wallets disponibles
- `themeMode` y `themeVariables`: Personalización de tema

### 5. `useHederaWallet.ts` (Nuevo Hook)
Hook personalizado para trabajar con wallets de Hedera

**Ubicación**: `src/hooks/useHederaWallet.ts`

**Características**:
- ✅ Detección automática del tipo de wallet (HashPack, Kabila, Blade)
- ✅ Conversión entre formatos de dirección (EVM ↔ Hedera)
- ✅ Verificación de instalación de wallets
- ✅ Detección de red (Testnet/Mainnet)
- ✅ Funciones para cambiar de red
- ✅ Formateo inteligente de direcciones

**Ejemplo de uso**:
```typescript
const {
  walletInfo,
  isHederaWallet,
  isTestnet,
  formatAddress,
  switchToTestnet
} = useHederaWallet();

// Información de la wallet
console.log(walletInfo?.walletType); // "HashPack" | "Kabila" | "Blade" | "Other"
console.log(walletInfo?.evmAddress); // "0x..."
console.log(walletInfo?.hederaAddress); // "0.0.xxxxx"

// Formatear dirección según el tipo de wallet
const formattedAddr = formatAddress(address, 'auto');
// Wallets Hedera: "0.0...12345"
// Otras wallets: "0x1234...5678"

// Cambiar a Testnet
if (!isTestnet) {
  await switchToTestnet();
}
```

---

## 🔌 Cómo Funciona

### Flujo de Conexión

1. **Usuario hace clic en "Connect Wallet"**
   ```typescript
   setIsModalOpen(true)
   ```

2. **Se muestra el modal personalizado**
   - Lista de wallets de Hedera
   - Opción de otros wallets

3. **Usuario selecciona una wallet**
   ```typescript
   handleWalletClick(wallet)
   ```

4. **Se verifica si está instalada**
   ```typescript
   const isInstalled = checkWalletInstalled(wallet.name)
   ```

5. **Si está instalada**:
   - Abre WalletConnect que detecta la wallet automáticamente
   - Procede con la conexión

6. **Si NO está instalada**:
   - Pregunta si desea descargarla
   - Abre la URL de descarga en nueva pestaña

---

## 🎯 Instalación de Wallets

### HashPack (Recomendado)

**Desktop (Extensión)**:
1. Ve a: https://www.hashpack.app/
2. Click en "Download"
3. Selecciona tu navegador (Chrome, Firefox, Brave)
4. Instala la extensión
5. Crea o importa una wallet
6. **Importante**: Cambia a Testnet en configuración

**Mobile**:
1. Descarga desde App Store o Google Play
2. Crea o importa wallet
3. Usa WalletConnect para conectar

### Kabila

**Mobile-First**:
1. Descarga la app: https://www.kabila.app/
2. Disponible en iOS y Android
3. Crea wallet
4. Usa WalletConnect en la app web

### Blade

**Extensión**:
1. Ve a: https://bladewallet.io/
2. Descarga extensión
3. Crea wallet
4. Conecta desde la app

---

## 🧪 Testing del Modal

### Prueba 1: Modal Se Abre
```bash
npm run dev
# Abre http://localhost:3000
# Click en "Connect Wallet"
# ✅ Debe mostrar el modal con las 3 wallets
```

### Prueba 2: HashPack Instalada
```bash
# Si tienes HashPack instalada:
# 1. Click en HashPack en el modal
# 2. Debe abrir automáticamente la extensión
# 3. Aprueba la conexión
# ✅ Wallet conectada
```

### Prueba 3: Wallet NO Instalada
```bash
# Si NO tienes una wallet:
# 1. Click en cualquier wallet
# 2. Debe preguntar si deseas descargarla
# 3. Click "Aceptar"
# ✅ Se abre la página de descarga
```

### Prueba 4: Other Wallets
```bash
# 1. Click en "Other Wallets (WalletConnect)"
# 2. Debe abrir el modal estándar de WalletConnect
# ✅ Muestra más opciones de wallets
```

---

## 🎨 Personalización

### Cambiar Wallets Mostradas

Edita `src/components/wallet/HederaWalletModal.tsx`:

```typescript
const HEDERA_WALLETS: WalletOption[] = [
  {
    name: 'HashPack',
    icon: '🔷',
    description: 'The most popular Hedera wallet',
    deepLink: 'hashpack://',
    downloadUrl: 'https://www.hashpack.app/',
  },
  // Añade más wallets aquí...
];
```

### Cambiar Colores del Modal

Edita los estilos en `HederaWalletModal.tsx`:

```typescript
className="... hover:border-blue-500 ..." // Cambiar blue-500 por tu color
```

O modifica el theme en `providers.tsx`:

```typescript
themeVariables: {
  '--w3m-accent': '#0066FF', // Tu color principal
},
```

---

## 🔧 Troubleshooting

### El modal no se abre
**Solución**:
```typescript
// Verifica que HederaWalletModal esté importado correctamente
import { HederaWalletModal } from './HederaWalletModal';
```

### Las wallets no se detectan
**Causa**: La wallet no está instalada o no es soportada

**Solución**:
1. Instala la wallet (ver sección arriba)
2. Recarga la página
3. Intenta nuevamente

### Click en wallet no hace nada
**Causa**: Puede que la detección de instalación falle

**Solución temporal**:
Click en "Other Wallets (WalletConnect)" y busca tu wallet allí

### "Wallet already connected"
**Solución**:
```bash
# Desconecta primero
# Click en "Disconnect"
# Luego vuelve a conectar
```

---

## 📊 Comparación

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **UI** | Modal genérico | Modal personalizado |
| **Wallets visibles** | Solo WalletConnect | HashPack, Kabila, Blade + otros |
| **Detección** | No | Sí, detecta si está instalada |
| **Descarga** | Manual | Link directo |
| **UX** | Confuso para nuevos | Claro y directo |

---

## 🚀 Mejoras Implementadas

- [x] Hook `useHederaWallet` para funcionalidad avanzada
- [x] Detección automática de tipo de wallet
- [x] Conversión de formatos de dirección (EVM ↔ Hedera)
- [x] Indicador visual de wallet instalada
- [x] Mostrar dirección en formato Hedera nativo
- [x] Advertencia de red incorrecta con botón de cambio
- [x] Formateo inteligente según tipo de wallet

## 🔮 Próximas Mejoras

Posibles mejoras futuras:

- [ ] Añadir iconos reales de las wallets (SVG)
- [ ] Recordar última wallet usada (localStorage)
- [ ] Modo QR para mobile wallets
- [ ] Soporte para más wallets de Hedera
- [ ] Animaciones de transición suaves
- [ ] Testing automatizado (Vitest/Jest)

---

## 📚 Referencias

- **WalletConnect**: https://docs.walletconnect.com/
- **HashPack Docs**: https://docs.hashpack.app/
- **Kabila**: https://www.kabila.app/
- **Blade**: https://bladewallet.io/
- **Reown AppKit**: https://docs.reown.com/appkit/overview

---

**Actualizado**: 2025-11-04
**Versión**: 1.0
**Estado**: ✅ Funcionando

¡Disfruta del nuevo modal de conexión de wallets! 🎉
