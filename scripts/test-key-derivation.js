const { PrivateKey } = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

// Derive key the same way as in deployment script
const operatorKey = PrivateKey.fromStringDer(
  "3030020100300706052b8104000a04220420" +
  process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
);

console.log("Derived public key:", operatorKey.publicKey.toStringRaw());
console.log("Expected from Mirror Node: 02480a75a6d1135bcbec54de7dea2d4c1c6aec49a4419b8d9f0e1503ebe173377e");
