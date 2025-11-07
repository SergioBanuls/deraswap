require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '.env.local' });

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: false,  // ⚠️ Desactivado para testing
      },
    },
  },
  networks: {
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296,
    },
    mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 295,
    },
  },
  paths: {
    sources: "./contracts/solidity",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
