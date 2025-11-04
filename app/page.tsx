'use client';

import React from 'react';
import { useReownConnect } from '@/hooks/useReownConnect';
import { TransferTransaction, Hbar, AccountId } from '@hashgraph/sdk';

export default function Home() {
  const { connect, callNativeMethod, isConnected, account, loading } = useReownConnect();

  const handleAssociateToken = async () => {
    if (!isConnected || !account) {
      alert('Por favor, conéctate primero.');
      return;
    }

    try {
      console.log('🚀 Iniciando prueba de transacción HTS...');
      console.log('📝 Cuenta conectada:', account);

      // Crear una transacción de transferencia simple como prueba
      // Enviamos 1 tinybar (0.00000001 HBAR) a la cuenta de prueba de Hedera
      const transaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(account), new Hbar(-0.00000001)) // De tu cuenta
        .addHbarTransfer(AccountId.fromString('0.0.98'), new Hbar(0.00000001)) // A cuenta de prueba
        .setTransactionMemo('Test desde DeraSwap dApp');

      console.log('✅ Transacción construida');

      // Serializar la transacción a bytes y luego a base64
      const transactionBytes = transaction.toBytes();
      
      // Convertir Uint8Array a base64 sin usar Buffer
      const base64String = btoa(
        String.fromCharCode(...Array.from(transactionBytes))
      );
      
      console.log('📤 Enviando transacción para firma...');
      console.log('📝 Transacción base64 (primeros 100 chars):', base64String.substring(0, 100));

      const response = await callNativeMethod('hedera_signAndExecuteTransaction', {
        transaction: base64String,
      });
      
      console.log('✅ Respuesta recibida:', response);
      alert(`✅ Transacción exitosa!\n\nID: ${(response as any)?.transactionId || JSON.stringify(response)}`);
    } catch (error: any) {
      console.error('❌ Error en transacción:', error);
      alert(`❌ Error al ejecutar transacción: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4 text-center">
            DeraSwap
          </h1>
          <p className="text-xl text-gray-300 mb-12 text-center">
            Conexión Nativa a Hedera con Reown AppKit
          </p>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <button 
              onClick={connect} 
              disabled={loading || isConnected}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                isConnected 
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500 cursor-not-allowed' 
                  : loading
                  ? 'bg-purple-500/50 text-white cursor-wait'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/50'
              }`}
            >
              {loading ? 'Conectando...' : isConnected ? `Conectado a ${account}` : 'Conectar con Reown AppKit'}
            </button>

            {isConnected && (
              <div className="mt-8 space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                  <p className="text-green-400 font-semibold mb-2">✓ Conexión Establecida</p>
                  <p className="text-white text-sm">
                    <span className="text-gray-400">Tu Account ID:</span> <span className="font-mono font-bold">{account}</span>
                  </p>
                  <p className="text-gray-300 text-sm mt-4">
                    Ahora puedes usar funciones nativas de Hedera (HTS, HCS, etc.).
                  </p>
                </div>

                <button 
                  onClick={handleAssociateToken} 
                  className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/50"
                >
                  🚀 Ejecutar HTS Nativo (Ejemplo)
                </button>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-300 text-xs">
                    <strong>Nota:</strong> Para ejecutar transacciones reales, necesitas construir y serializar 
                    la transacción usando el SDK de Hedera (@hashgraph/sdk) antes de enviarla.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              Construido con Next.js, Reown AppKit y Hedera
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
