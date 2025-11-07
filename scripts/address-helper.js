/**
 * Helper utilities para trabajar con direcciones de Hedera
 */

/**
 * Convierte una cuenta de Hedera (0.0.X) a formato EVM (0x...)
 * 
 * @param {string} hederaId - ID de Hedera en formato "0.0.123456"
 * @returns {string} Dirección EVM en formato "0x..."
 * 
 * @example
 * hederaToEvmAddress("0.0.4817907")
 * // Returns: "0x00000000000000000000000000000000004983f3"
 */
function hederaToEvmAddress(hederaId) {
  // Extraer el número de la cuenta (la parte después del segundo punto)
  const accountNum = parseInt(hederaId.split('.')[2]);
  
  // Convertir a hexadecimal y rellenar con ceros a la izquierda (40 caracteres)
  const evmAddress = '0x' + accountNum.toString(16).padStart(40, '0');
  
  return evmAddress;
}

/**
 * Convierte una dirección EVM (0x...) a formato Hedera (0.0.X)
 * 
 * @param {string} evmAddress - Dirección EVM en formato "0x..."
 * @returns {string} ID de Hedera en formato "0.0.X"
 * 
 * @example
 * evmToHederaAddress("0x00000000000000000000000000000000004983f3")
 * // Returns: "0.0.4817907"
 */
function evmToHederaAddress(evmAddress) {
  // Remover el prefijo 0x y convertir de hexadecimal a decimal
  const accountNum = parseInt(evmAddress.replace('0x', ''), 16);
  
  // Formato Hedera
  return `0.0.${accountNum}`;
}

/**
 * Valida si una dirección es un formato válido de Hedera
 * 
 * @param {string} address - Dirección a validar
 * @returns {boolean} true si es válida
 */
function isValidHederaId(address) {
  const hederaPattern = /^0\.0\.\d+$/;
  return hederaPattern.test(address);
}

/**
 * Valida si una dirección es un formato válido de EVM
 * 
 * @param {string} address - Dirección a validar
 * @returns {boolean} true si es válida
 */
function isValidEvmAddress(address) {
  const evmPattern = /^0x[0-9a-fA-F]{40}$/;
  return evmPattern.test(address);
}

// Ejemplos de uso
if (require.main === module) {
  console.log("🧪 Testing address conversion utilities\n");
  
  // Test 1: Hedera to EVM
  const hederaId = "0.0.4817907";
  const evmAddr = hederaToEvmAddress(hederaId);
  console.log(`Hedera → EVM:`);
  console.log(`  Input:  ${hederaId}`);
  console.log(`  Output: ${evmAddr}`);
  console.log(`  Valid:  ${isValidEvmAddress(evmAddr)}\n`);
  
  // Test 2: EVM to Hedera
  const backToHedera = evmToHederaAddress(evmAddr);
  console.log(`EVM → Hedera:`);
  console.log(`  Input:  ${evmAddr}`);
  console.log(`  Output: ${backToHedera}`);
  console.log(`  Valid:  ${isValidHederaId(backToHedera)}\n`);
  
  // Test 3: Verification
  console.log(`✓ Conversion test: ${hederaId === backToHedera ? "PASSED" : "FAILED"}`);
  
  // Test 4: Tu cuenta (example)
  console.log("\n💡 Para convertir tu propia cuenta:");
  console.log("   node scripts/address-helper.js");
  console.log("   // Y modifica el hederaId en el código");
}

module.exports = {
  hederaToEvmAddress,
  evmToHederaAddress,
  isValidHederaId,
  isValidEvmAddress,
};
