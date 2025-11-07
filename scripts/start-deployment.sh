#!/bin/bash

# 🚀 Script de Inicio Rápido para Deployment en Testnet
# Verifica todo antes de empezar el deployment

echo "🚀 DeraSwap - Verificación Pre-Deployment"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en la raíz del proyecto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
    exit 1
fi

echo "✅ Directorio correcto"

# Verificar .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local no existe${NC}"
    echo "Copia .env.contracts.example a .env.local"
    exit 1
fi

echo "✅ .env.local existe"

# Verificar variables críticas
source .env.local

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY no está configurada${NC}"
    exit 1
fi

if [ -z "$YOUR_FEE_WALLET" ]; then
    echo -e "${RED}❌ Error: YOUR_FEE_WALLET no está configurada${NC}"
    exit 1
fi

echo "✅ Variables de entorno configuradas"

# Verificar que Hardhat está instalado
if ! npm list hardhat > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Hardhat no está instalado${NC}"
    echo "📦 Instalando dependencias..."
    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts@4.9.3
fi

echo "✅ Hardhat instalado"

# Verificar balance
echo ""
echo "📊 Verificando balance..."
echo "Wallet: $HEDERA_ACCOUNT_ID"
echo "EVM Address: $YOUR_FEE_WALLET"
echo ""

node scripts/check-balance.js

echo ""
echo "=========================================="
echo "🎯 Todo listo para deployment!"
echo ""
echo "Próximos pasos:"
echo "1. Verifica que tienes suficiente HBAR (mínimo 50)"
echo "2. Ejecuta: npx hardhat run scripts/01-deploy-exchange.js --network testnet"
echo "3. Ejecuta: npx hardhat run scripts/02-deploy-adapter.js --network testnet"
echo "4. Ejecuta: npx hardhat run scripts/03-register-adapters.js --network testnet"
echo ""
echo "📚 Guía completa: YOUR_TESTNET_DEPLOYMENT_GUIDE.md"
echo "=========================================="
