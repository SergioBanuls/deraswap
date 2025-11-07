# ETASwap Custom Contracts

Este directorio contiene los contratos inteligentes de ETASwap modificados para usar una wallet personalizada para recibir las fees.

## 📁 Estructura

```
contracts/solidity/
├── Exchange.sol              # Contrato principal de intercambio
├── adapters/
│   └── SaucerSwapV2Adapter.sol  # Adapter para SaucerSwap V2
├── interfaces/
│   ├── IAdapter.sol
│   ├── IExchange.sol
│   ├── IUniswapV3Router.sol
│   └── IWHBAR.sol
└── libraries/
    └── Path.sol              # Librería para parsear rutas
```

## 🔥 Modificación Principal: Wallet de Fees

### ¿Dónde están las fees?

Las fees se definen en cada **Adapter** (no en el contrato Exchange). En el archivo:

**`adapters/SaucerSwapV2Adapter.sol`**

```solidity
constructor(
    address payable _feeWallet,  // 🔥 TU WALLET AQUÍ
    IUniswapV3Router _router,
    uint8 _feePromille,
    IERC20 _whbarToken,
    IWHBAR _whbarContract
) {
    feeWallet = _feeWallet;  // ← Aquí se establece la wallet
    // ...
}
```

Cuando se ejecuta un swap, la fee se envía aquí:

```solidity
uint256 fee = amountFrom * feePromille / 1000;
_transfer(tokenFrom, fee, feeWallet);  // ← Transferencia a tu wallet
```

## 🚀 Cómo Desplegar

### 1. Instalar Dependencias

```bash
npm install --save-dev @openzeppelin/contracts@4.9.3
npm install --save-dev @hashgraph/sdk
npm install --save-dev hardhat
```

### 2. Configurar Hardhat

Crear `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 3. Desplegar los Adapters

Primero debes desplegar cada adapter con **TU WALLET**:

```javascript
// scripts/deploy-adapter.js
const hre = require("hardhat");

async function main() {
  // 🔥 CONFIGURA TU WALLET AQUÍ
  const YOUR_FEE_WALLET = "0x..."; // Tu wallet en formato EVM (0x...)
  
  // Direcciones de contratos en Hedera Mainnet
  const SAUCERSWAP_V2_ROUTER = "0x..."; // Router de SaucerSwap V2
  const WHBAR_TOKEN = "0x0000000000000000000000000000000000163a3a"; // WHBAR
  const WHBAR_CONTRACT = "0x0000000000000000000000000000000000163a3a";
  const FEE_PROMILLE = 3; // 0.3% fee

  const SaucerSwapV2Adapter = await hre.ethers.getContractFactory("SaucerSwapV2Adapter");
  const adapter = await SaucerSwapV2Adapter.deploy(
    YOUR_FEE_WALLET,    // 🔥 Tu wallet
    SAUCERSWAP_V2_ROUTER,
    FEE_PROMILLE,
    WHBAR_TOKEN,
    WHBAR_CONTRACT
  );

  await adapter.deployed();
  console.log("SaucerSwapV2Adapter deployed to:", adapter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 4. Desplegar el Exchange

```javascript
// scripts/deploy-exchange.js
const hre = require("hardhat");

async function main() {
  const Exchange = await hre.ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy();

  await exchange.deployed();
  console.log("Exchange deployed to:", exchange.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 5. Registrar los Adapters en el Exchange

```javascript
// scripts/register-adapters.js
const hre = require("hardhat");

async function main() {
  const EXCHANGE_ADDRESS = "0x..."; // Tu contrato Exchange
  const ADAPTER_ADDRESS = "0x...";  // Tu adapter desplegado
  
  const exchange = await hre.ethers.getContractAt("Exchange", EXCHANGE_ADDRESS);
  
  // Registrar adapter
  await exchange.setAdapter("SaucerSwapV2", ADAPTER_ADDRESS);
  console.log("Adapter registered!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## 📝 Obtener tu Wallet en Formato EVM

Tu wallet de Hedera (formato `0.0.X`) debe convertirse a formato EVM:

```javascript
// Ejemplo: 0.0.4817907 → 0x00000000000000000000000000000000004983f3

function hederaToEvmAddress(accountId) {
  const num = parseInt(accountId.split('.')[2]);
  return '0x' + num.toString(16).padStart(40, '0');
}

// Tu cuenta: 0.0.XXXXX
const myEvmAddress = hederaToEvmAddress("0.0.XXXXX");
console.log(myEvmAddress); // Usa esta dirección en el constructor
```

## 🔧 Actualizar tu Frontend

Una vez desplegado, actualiza tu `.env`:

```env
NEXT_PUBLIC_SWAP_ROUTER_TYPE=custom
NEXT_PUBLIC_CUSTOM_ROUTER_ADDRESS=0x... # Tu Exchange desplegado
NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID=0.0.XXX # ID de Hedera
```

## ⚠️ Consideraciones Importantes

1. **Costos de Gas**: Desplegar contratos en Hedera tiene un costo
2. **Testing**: Prueba primero en testnet antes de mainnet
3. **Auditoría**: Considera una auditoría si vas a manejar volúmenes grandes
4. **Mantenimiento**: Tú serás responsable de mantener tus contratos
5. **Adapters**: Necesitas crear un adapter para cada DEX que quieras soportar

## 📚 Otros Adapters

El repositorio original de ETASwap tiene adapters para:
- HeliSwap
- Pangolin
- SaucerSwap V1/V2

Puedes copiarlos del repo y modificar la wallet de fees en cada uno.

## 🔗 Referencias

- Repo original: https://github.com/EtaSwap/etaswap-smart-contracts-v2
- Hedera Docs: https://docs.hedera.com
- HashScan (Explorer): https://hashscan.io

## 💡 Alternativa Rápida

Si solo quieres cambiar las fees pero no quieres desplegar desde cero:

1. Usa el contrato de ETASwap tal como está ahora
2. Cobra una fee adicional en tu frontend antes de llamar al contrato
3. Tu backend/frontend retiene tu % antes de enviar al swap

Esta opción es más simple pero los usuarios verán una fee extra.
