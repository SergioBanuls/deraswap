require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '.env.local' });

/**
 * Hardhat configuration for deploying contracts to Hedera
 * 
 * IMPORTANTE: Crea un archivo .env con:
 * PRIVATE_KEY=tu_clave_privada_aqui
 * YOUR_FEE_WALLET=0x... (tu wallet en formato EVM)
 */

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296, // Hedera testnet
    },
    mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 295, // Hedera mainnet
    },
  },
  paths: {
    sources: "./contracts/solidity",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
