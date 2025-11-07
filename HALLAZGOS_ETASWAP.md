# 🔍 HALLAZGOS DEL ANÁLISIS DE ETASWAP

## 📋 Análisis Completo del Repositorio

He analizado el repositorio oficial de ETASwap: https://github.com/EtaSwap/etaswap-smart-contracts-v2

---

## ✅ DIFERENCIAS CRÍTICAS ENCONTRADAS

### 1. **Constructor Parameters**

**ETASwap (5 parámetros):**
```solidity
constructor(
    address payable _feeWallet,
    IUniswapV3Router _router,
    uint8 _feePromille,        // ← uint8 (5 = 0.5%)
    IERC20 _whbarToken,
    IWHBAR _whbarContract      // ← Parámetro EXTRA
)
```

**Nuestro Adapter (4 parámetros):**
```solidity
constructor(
    address payable _feeWallet,
    IUniswapV3Router _router,
    uint16 _feeBasisPoints,     // ← uint16 (25 = 0.25%)
    IERC20 _whbarToken
)
```

### 2. **Tipo de Fee**

| Contrato | Tipo | Valor | Cálculo | Resultado |
|----------|------|-------|---------|-----------|
| **ETASwap** | `uint8 feePromille` | 5 | `amount * 5 / 1000` | 0.5% |
| **Nuestro** | `uint16 feeBasisPoints` | 25 | `amount * 25 / 10000` | 0.25% |

### 3. **Interface IWHBAR**

ETASwap tiene un contrato separado **whbarContract** de tipo `IWHBAR` que probablemente contiene funciones de wrapping/unwrapping.

Nuestro adapter NO tiene este parámetro.

---

## 📦 Script de Deployment de ETASwap

**Archivo:** `scripts/deployExchange.js`

```javascript
const adapterTx = new ContractCreateFlow()
    .setGas(240000)
    .setConstructorParameters(
        new ContractFunctionParameters()
            .addAddress(`0x${feeAccount.id.toSolidityAddress()}`)
            .addAddress(adapterInfo.router)
            .addUint256(5)  // ⚠️ Usan addUint256 pero constructor espera uint8
            .addAddress(adapterInfo.whbarToken)
            .addAddress(adapterInfo.whbarContract)
    )
    .setBytecode(Adapter.bytecode);
```

**IMPORTANTE:** Usan `.addUint256(5)` pero el constructor espera `uint8`. Esto podría causar problemas de encoding.

---

## 🔧 Configuración de wHBAR (Testnet)

**Archivo:** `test/constants.js`

```javascript
// SaucerSwapV2Oracle configuración:
whbarToken: '0x0000000000000000000000000000000000003ad2',    // 0.0.15058
whbarContract: '0x0000000000000000000000000000000000003ad1', // 0.0.15057
router: '0x0000000000000000000000000000000000159398',        // 0.0.1414040 (Testnet)
```

**NOTA:** Solo encontré configuración de **testnet** en el repo público. NO hay configuración de mainnet visible.

---

## 🎯 PROBLEMA CONFIRMADO EN NUESTRO DEPLOYMENT

### Nuestro Script (`02-deploy-adapter.js`):

```javascript
// MAINNET - INCORRECTO ❌
WHBAR_TOKEN = "0x0000000000000000000000000000000000163a3a"; // 0.0.1456698 ← NO EXISTE

// DEBERÍA SER: ✅
WHBAR_TOKEN = "0x0000000000000000000000000000000000163b5a"; // 0.0.1456986
```

### Y además pasaba 5 parámetros cuando el constructor solo acepta 4:

```javascript
const adapter = await SaucerSwapV2Adapter.deploy(
    YOUR_FEE_WALLET,
    SAUCERSWAP_V2_ROUTER,
    FEE_PROMILLE,
    WHBAR_TOKEN,
    WHBAR_CONTRACT  // ← Este parámetro EXTRA no existe en nuestro constructor
);
```

---

## 💡 SOLUCIÓN PROPUESTA

### Opción A: Modificar Contrato para Coincidir con ETASwap

**Cambiar nuestro adapter para tener la misma firma que ETASwap:**

1. Agregar parámetro `IWHBAR _whbarContract` al constructor
2. Cambiar `uint16 feeBasisPoints` a `uint8 feePromille`
3. Ajustar cálculo de fees de basis points a promille

**Ventajas:**
- ✅ Compatibilidad total con ETASwap
- ✅ Código probado en producción

**Desventajas:**
- ❌ Requiere cambiar interfaz del contrato
- ❌ Requiere re-deployment

### Opción B: Arreglar Solo el wHBAR Address (MÁS SIMPLE)

**Mantener nuestro contrato con 4 parámetros y solo corregir:**

1. Usar wHBAR address correcto: `0x163b5a`
2. Mantener fee en basis points (0.25%)
3. Deployment con Hedera SDK usando parámetros correctos

**Ventajas:**
- ✅ Cambio mínimo
- ✅ Mantenemos nuestro fee de 0.25%
- ✅ Menos complejidad

**Desventajas:**
- ❌ No 100% compatible con ETASwap
- ❌ Requiere re-deployment de todos modos

### Opción C: Usar Constructor Parameters Correctamente

El error `ERROR_DECODING_BYTESTRING` que tuvimos podría ser porque:

1. ETASwap usa `.addUint256(5)` para un parámetro `uint8`
2. Nosotros usamos `.addUint16(25)` para un parámetro `uint16`

**Solución:** Cambiar a `.addUint256()` para todos los uint parameters:

```javascript
const constructorParams = new ContractFunctionParameters()
    .addAddress(FEE_WALLET)
    .addAddress(SAUCERSWAP_V2_ROUTER)
    .addUint256(25)  // ← Cambiar de addUint16 a addUint256
    .addAddress(WHBAR_TOKEN);
```

---

## 🚀 RECOMENDACIÓN FINAL

### Plan de Acción:

1. **Mantener nuestro contrato de 4 parámetros** (más simple)
2. **Corregir wHBAR address** a `0x163b5a`
3. **Usar `.addUint256()` en lugar de `.addUint16()`** para fee
4. **Probar en TESTNET primero** antes de gastar más HBAR en mainnet

### Script de Deployment Corregido:

```javascript
const constructorParams = new ContractFunctionParameters()
    .addAddress("0x0000000000000000000000000000000000099f88") // feeWallet
    .addAddress("0x00000000000000000000000000000000007b925f") // router
    .addUint256(25)  // ✅ feeBasisPoints como uint256
    .addAddress("0x0000000000000000000000000000000000163b5a"); // ✅ wHBAR correcto

const contractCreateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(2000000)
    .setConstructorParameters(constructorParams)
    .setMaxTransactionFee(new Hbar(20));
```

---

## 📊 Comparación de Opciones

| Aspecto | Opción A (Igual a ETASwap) | Opción B (Arreglar solo wHBAR) | Opción C (Usar uint256) |
|---------|---------------------------|--------------------------------|-------------------------|
| **Complejidad** | Alta | Baja | Muy Baja |
| **Requiere cambiar contrato** | ✅ Sí | ❌ No | ❌ No |
| **Costo deployment** | ~3-5 HBAR | ~3-5 HBAR | ~3-5 HBAR |
| **Tiempo** | 2-3 días | 1 día | 1 día |
| **Riesgo** | Medio | Bajo | Muy Bajo |
| **Recomendado** | ❌ | ⚠️ | ✅ **SÍ** |

---

## ✅ SIGUIENTE PASO RECOMENDADO

**Probar Opción C en Testnet:**

```bash
# 1. Asegurar que wHBAR testnet es correcto
WHBAR_TESTNET=0x0000000000000000000000000000000000068e26  # 0.0.429606

# 2. Deploy en testnet con addUint256
node scripts/deploy-adapter-hedera-sdk.js --network testnet

# 3. Hacer swap de prueba en testnet

# 4. Solo si funciona → Deploy en mainnet
```

¿Quieres que proceda con esta opción?
