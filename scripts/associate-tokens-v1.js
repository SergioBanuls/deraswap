/**
 * Associate essential tokens to V1 Adapter
 */

const {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TokenId,
} = require("@hashgraph/sdk");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('🔗 Asociando tokens esenciales al V1 Adapter...\n');

  // Setup client
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringDer(
    "3030020100300706052b8104000a04220420" +
    process.env.MAINNET_PRIVATE_KEY.replace("0x", "")
  );

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  const V1_ADAPTER_ID = process.env.SAUCERSWAP_V1_ADAPTER_ID;

  if (!V1_ADAPTER_ID) {
    console.error('❌ SAUCERSWAP_V1_ADAPTER_ID no encontrado en .env.local');
    process.exit(1);
  }

  console.log(`📋 V1 Adapter: ${V1_ADAPTER_ID}\n`);

  // Tokens esenciales para mainnet
  const tokensToAssociate = [
    '0.0.1456986', // WHBAR [new]
    '0.0.456858',  // USDC
    '0.0.731861',  // SAUCE
  ];

  console.log('📝 Tokens a asociar:');
  tokensToAssociate.forEach(t => console.log(`   - ${t}`));
  console.log('');

  try {
    const adapterAccountId = AccountId.fromString(V1_ADAPTER_ID);

    for (const tokenId of tokensToAssociate) {
      try {
        console.log(`⏳ Asociando ${tokenId}...`);

        const tokenIdObj = TokenId.fromString(tokenId);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(adapterAccountId)
          .setTokenIds([tokenIdObj])
          .freezeWith(client)
          .sign(operatorKey);

        const response = await associateTx.execute(client);
        await response.getReceipt(client);

        console.log(`✅ ${tokenId} asociado exitosamente\n`);
      } catch (err) {
        if (err.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
          console.log(`ℹ️  ${tokenId} ya estaba asociado\n`);
        } else {
          console.error(`❌ Error asociando ${tokenId}:`, err.message, '\n');
        }
      }
    }

    console.log('✅ Asociación de tokens completada!\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }

  client.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
