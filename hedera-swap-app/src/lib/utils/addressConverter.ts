/**
 * Utilities para convertir entre formatos de direcciones Hedera y EVM
 */

/**
 * Convierte una dirección de formato Hedera (0.0.xxxxx) a formato EVM (0x...)
 *
 * @param hederaAddress - Dirección en formato Hedera (ej: "0.0.3949434")
 * @returns Dirección en formato EVM (ej: "0x00000000000000000000000000000000003c3f7a")
 *
 * @example
 * hederaToEvm("0.0.3949434") // "0x00000000000000000000000000000000003c3f7a"
 */
export function hederaToEvm(hederaAddress: string): string {
  // Validar formato
  const match = hederaAddress.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Formato de dirección Hedera inválido: ${hederaAddress}`);
  }

  const [, shard, realm, account] = match;

  // Convertir el account number a hexadecimal
  const accountNum = parseInt(account, 10);
  const hex = accountNum.toString(16);

  // Rellenar con ceros a la izquierda hasta 40 caracteres (20 bytes)
  const paddedHex = hex.padStart(40, '0');

  return `0x${paddedHex}`;
}

/**
 * Convierte una dirección de formato EVM (0x...) a formato Hedera (0.0.xxxxx)
 *
 * @param evmAddress - Dirección en formato EVM (ej: "0x00000000000000000000000000000000003c3f7a")
 * @param shard - Shard (por defecto 0)
 * @param realm - Realm (por defecto 0)
 * @returns Dirección en formato Hedera (ej: "0.0.3949434")
 *
 * @example
 * evmToHedera("0x00000000000000000000000000000000003c3f7a") // "0.0.3949434"
 */
export function evmToHedera(evmAddress: string, shard = 0, realm = 0): string {
  // Remover 0x si existe
  const cleanAddress = evmAddress.replace(/^0x/i, '');

  // Validar longitud
  if (cleanAddress.length !== 40) {
    throw new Error(`Formato de dirección EVM inválido: ${evmAddress}`);
  }

  // Convertir de hex a decimal
  const accountNum = parseInt(cleanAddress, 16);

  return `${shard}.${realm}.${accountNum}`;
}

/**
 * Detecta el formato de una dirección y la devuelve en el formato opuesto
 *
 * @param address - Dirección en cualquier formato
 * @returns Objeto con ambos formatos
 *
 * @example
 * convertAddress("0.0.3949434")
 * // { hedera: "0.0.3949434", evm: "0x00000000000000000000000000000000003c3f7a" }
 */
export function convertAddress(address: string): { hedera: string; evm: string } {
  // Detectar formato
  if (address.match(/^\d+\.\d+\.\d+$/)) {
    // Es formato Hedera
    return {
      hedera: address,
      evm: hederaToEvm(address),
    };
  } else if (address.match(/^0x[0-9a-fA-F]{40}$/)) {
    // Es formato EVM
    return {
      hedera: evmToHedera(address),
      evm: address.toLowerCase(),
    };
  } else {
    throw new Error(`Formato de dirección desconocido: ${address}`);
  }
}

/**
 * Tabla de conversión de direcciones de SaucerSwap V2
 * Útil para referencia rápida
 */
export const SAUCERSWAP_V2_ADDRESSES = {
  testnet: {
    router: {
      hedera: '0.0.1414040',
      evm: '0x0000000000000000000000000000000000159198',
    },
    quoter: {
      hedera: '0.0.1390002',
      evm: '0x0000000000000000000000000000000000153532',
    },
    factory: {
      hedera: '0.0.1197038',
      evm: '0x000000000000000000000000000000000012446e',
    },
  },
  mainnet: {
    router: {
      hedera: '0.0.3949434',
      evm: '0x00000000000000000000000000000000003c3f7a',
    },
    quoter: {
      hedera: '0.0.3949424',
      evm: '0x00000000000000000000000000000000003c3f70',
    },
    factory: {
      hedera: '0.0.3946833',
      evm: '0x00000000000000000000000000000000003c39d1',
    },
  },
} as const;
