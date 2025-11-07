/**
 * Check if adapter is registered in Exchange
 */

const {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
  ContractFunctionParameters,
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🔍 Verificando registro de adapters en Exchange...\n");

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringDer(
    "3030020100300706052b8104000a04220420" +
    process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
  );

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  const EXCHANGE_ID = process.env.NEXT_PUBLIC_CUSTOM_ROUTER_HEDERA_ID;

  const aggregatorIds = [
    "SaucerSwapV2_V10",
    "SaucerSwapV2_V12",
    "SaucerSwapV2_EXACT"
  ];

  for (const aggId of aggregatorIds) {
    try {
      // Call adapters[aggregatorId] getter
      const params = new ContractFunctionParameters()
        .addString(aggId);

      const query = new ContractCallQuery()
        .setContractId(EXCHANGE_ID)
        .setGas(100000)
        .setFunction("adapters", params);

      const result = await query.execute(client);
      const adapterAddress = "0x" + result.getAddress(0);

      console.log(`✅ ${aggId}:`);
      console.log(`   Adapter: ${adapterAddress}`);

      if (adapterAddress === "0x0000000000000000000000000000000000000000") {
        console.log(`   ⚠️  NOT REGISTERED\n`);
      } else {
        console.log(`   ✅ REGISTERED\n`);
      }

    } catch (error) {
      console.log(`❌ ${aggId}: Error - ${error.message}\n`);
    }
  }

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
