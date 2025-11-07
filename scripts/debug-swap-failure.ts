import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EXCHANGE_CONTRACT_ID = '0.0.10086840';
const ADAPTER_CONTRACT_ID = '0.0.10086852';

async function debugSwapFailure() {
  console.log('🔍 Debugging Swap Failure\n');

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!);

  const client = Client.forMainnet();
  client.setOperator(operatorId, operatorKey);

  try {
    // 1. Check if Exchange is paused
    console.log('1️⃣ Checking Exchange pause status...');
    const pausedResult = await new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(50000)
      .setFunction('paused')
      .execute(client);
    const isPaused = pausedResult.getBool(0);
    console.log(`   Paused: ${isPaused ? '❌ YES' : '✅ NO'}\n`);

    // 2. Check if adapter is registered
    console.log('2️⃣ Checking adapter registration...');
    const adapterParams = new ContractFunctionParameters().addString('SaucerSwapV2');
    const adapterResult = await new ContractCallQuery()
      .setContractId(EXCHANGE_CONTRACT_ID)
      .setGas(100000)
      .setFunction('adapters', adapterParams)
      .execute(client);
    
    const adapterBytes = adapterResult.getAddress(0);
    const adapterAddress = '0x' + Buffer.from(adapterBytes).toString('hex');
    console.log(`   Adapter Address: ${adapterAddress}`);
    console.log(`   Expected: 0x000000000000000000000000000000000099e9c4`);
    console.log(`   Match: ${adapterAddress.toLowerCase() === '0x000000000000000000000000000000000099e9c4' ? '✅' : '❌'}\n`);

    // 3. Check adapter owner
    console.log('3️⃣ Checking Adapter owner...');
    const ownerResult = await new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(50000)
      .setFunction('owner')
      .execute(client);
    const ownerBytes = ownerResult.getAddress(0);
    const ownerAddress = '0x' + Buffer.from(ownerBytes).toString('hex');
    console.log(`   Owner: ${ownerAddress}`);
    console.log(`   Expected: 0x000000000000000000000000000000000099d538 (0.0.10081592)`);
    console.log(`   Match: ${ownerAddress.toLowerCase() === '0x000000000000000000000000000000000099d538' ? '✅' : '❌'}\n`);

    // 4. Check fee settings
    console.log('4️⃣ Checking fee configuration...');
    const feeResult = await new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(50000)
      .setFunction('feeBasisPoints')
      .execute(client);
    const feeBasisPoints = feeResult.getUint16(0);
    console.log(`   Fee Basis Points: ${feeBasisPoints} (${feeBasisPoints / 100}%)`);
    console.log(`   Expected: 25 (0.25%)`);
    console.log(`   Match: ${feeBasisPoints === 25 ? '✅' : '❌'}\n`);

    // 5. Check fee wallet
    console.log('5️⃣ Checking fee wallet...');
    const feeWalletResult = await new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(50000)
      .setFunction('feeWallet')
      .execute(client);
    const feeWalletBytes = feeWalletResult.getAddress(0);
    const feeWallet = '0x' + Buffer.from(feeWalletBytes).toString('hex');
    console.log(`   Fee Wallet: ${feeWallet}`);
    console.log(`   Expected: 0x000000000000000000000000000000000099e61a (0.0.10085914)`);
    console.log(`   Match: ${feeWallet.toLowerCase() === '0x000000000000000000000000000000000099e61a' ? '✅' : '❌'}\n`);

    // 6. Check router address
    console.log('6️⃣ Checking SaucerSwap router...');
    const routerResult = await new ContractCallQuery()
      .setContractId(ADAPTER_CONTRACT_ID)
      .setGas(50000)
      .setFunction('router')
      .execute(client);
    const routerBytes = routerResult.getAddress(0);
    const router = '0x' + Buffer.from(routerBytes).toString('hex');
    console.log(`   Router: ${router}`);
    console.log(`   Expected: 0x00000000000000000000000000000000004979b5 (SaucerSwap V2)`);
    console.log(`   Match: ${router.toLowerCase() === '0x00000000000000000000000000000000004979b5' ? '✅' : '❌'}\n`);

    console.log('=' .repeat(60));
    console.log('💡 DIAGNÓSTICO:');
    console.log('   Si todo está ✅, el problema puede ser:');
    console.log('   - Falta de liquidez en el pool de SaucerSwap');
    console.log('   - Slippage demasiado bajo');
    console.log('   - Allowance insuficiente del token');
    console.log('   - Path incorrecto en la ruta del swap');
    console.log('=' .repeat(60));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    client.close();
  }
}

debugSwapFailure();
