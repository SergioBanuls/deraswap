# 🔍 Debug: Detectar Wallets Instaladas

Si las wallets no se detectan correctamente, sigue estos pasos:

## Paso 1: Verificar Extensiones Instaladas

1. Abre tu navegador (Chrome, Firefox, Brave, etc.)
2. Ve a la página de extensiones:
   - **Chrome**: `chrome://extensions/`
   - **Firefox**: `about:addons`
   - **Brave**: `brave://extensions/`

3. Verifica que estén instaladas y **ACTIVADAS**:
   - ✅ HashPack
   - ✅ Kabila (si aplica)
   - ✅ Blade (si aplica)

## Paso 2: Verificar Inyección en Window

1. Abre la aplicación: `http://localhost:3000`
2. Abre la consola del navegador:
   - **Mac**: `Cmd + Option + J`
   - **Windows/Linux**: `Ctrl + Shift + J`

3. Pega y ejecuta este script en la consola:

```javascript
console.log('=== VERIFICACIÓN DE WALLETS ===');

// HashPack
console.log('window.hashpack:', window.hashpack ? '✅ DETECTADO' : '❌ NO DETECTADO');
console.log('window.hashconnect:', window.hashconnect ? '✅ DETECTADO' : '❌ NO DETECTADO');

// Blade
console.log('window.blade:', window.blade ? '✅ DETECTADO' : '❌ NO DETECTADO');
console.log('window.bladewallet:', window.bladewallet ? '✅ DETECTADO' : '❌ NO DETECTADO');

// Kabila
console.log('window.kabila:', window.kabila ? '✅ DETECTADO' : '❌ NO DETECTADO');

// Ethereum providers
console.log('window.ethereum:', window.ethereum ? '✅ DETECTADO' : '❌ NO DETECTADO');

if (window.ethereum) {
  console.log('window.ethereum.isHashPack:', window.ethereum.isHashPack);
  console.log('window.ethereum.isBlade:', window.ethereum.isBlade);
  console.log('window.ethereum.providers:', window.ethereum.providers);

  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    console.log('Providers detectados:');
    window.ethereum.providers.forEach((provider, index) => {
      console.log(`  Provider ${index}:`, {
        isHashPack: provider.isHashPack,
        isBlade: provider.isBlade,
        isMetaMask: provider.isMetaMask,
      });
    });
  }
}

// Listar todas las propiedades de window que podrían ser wallets
console.log('\n=== POSIBLES OBJETOS DE WALLET EN WINDOW ===');
const walletKeywords = ['hashpack', 'blade', 'kabila', 'hedera', 'wallet', 'ethereum'];
Object.keys(window).forEach(key => {
  if (walletKeywords.some(keyword => key.toLowerCase().includes(keyword))) {
    console.log(key + ':', typeof window[key]);
  }
});
```

4. **Copia el resultado completo** y compártelo para diagnosticar el problema.

## Paso 3: Soluciones Temporales

### Opción A: Usar "Other Wallets"
1. En el modal personalizado, haz clic en **"Other Wallets (WalletConnect)"**
2. Busca tu wallet en la lista completa
3. Conéctate normalmente

### Opción B: Recargar la Página
1. Asegúrate de que la extensión esté activada
2. **Recarga completamente la página** (Cmd+Shift+R / Ctrl+Shift+R)
3. Intenta conectar nuevamente

### Opción C: Reiniciar el Navegador
1. Cierra completamente el navegador
2. Ábrelo nuevamente
3. Ve a `http://localhost:3000`
4. Intenta conectar

## Paso 4: Problemas Conocidos

### HashPack no se detecta
**Causa**: HashPack puede tardar en inyectar el objeto en `window`

**Solución**:
```javascript
// En la consola, espera un momento y verifica:
setTimeout(() => {
  console.log('HashPack después de 2s:', !!window.hashpack);
}, 2000);
```

### Múltiples Wallets Conflicto
**Causa**: Varias extensiones de wallet pueden causar conflictos

**Solución**:
1. Desactiva temporalmente otras wallets (como MetaMask)
2. Recarga la página
3. Conecta con HashPack/Blade
4. Reactiva las otras wallets

### Wallet en Modo Privado/Incógnito
**Causa**: Algunas extensiones no funcionan en modo incógnito

**Solución**:
1. Abre una ventana normal (no incógnita)
2. Ve a la aplicación
3. Conéctate normalmente

## Paso 5: Información Adicional

Si después de estos pasos sigue sin funcionar, proporciona:

1. ✅ Resultado del script de verificación (Paso 2)
2. ✅ Versión del navegador
3. ✅ Versión de la extensión de HashPack/Blade
4. ✅ Sistema operativo
5. ✅ Capturas de pantalla de errores en consola

---

## 🔧 Posibles Causas Técnicas

### 1. Nombre de Inyección Incorrecto
HashPack podría usar un nombre diferente:
- `window.hashpack` ❓
- `window.hashconnect` ❓
- `window.ethereum.isHashPack` ❓

### 2. Timing de Inyección
La extensión puede inyectar después de que React se monte.

### 3. Incompatibilidad con WalletConnect
HashPack y Kabila usan **HashConnect**, no WalletConnect estándar.

---

**Última actualización**: 2025-11-04
