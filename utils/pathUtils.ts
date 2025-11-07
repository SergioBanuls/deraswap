/**
 * Extract all token addresses from a SaucerSwap V2 path
 * Path format: [token0 (20 bytes), fee (3 bytes), token1 (20 bytes), fee (3 bytes), ...]
 */
export function extractTokensFromPath(pathHex: string): string[] {
  // Remove 0x prefix if present
  const cleanPath = pathHex.startsWith('0x') ? pathHex.slice(2) : pathHex;
  
  const tokens: string[] = [];
  let offset = 0;
  
  // Each token is 20 bytes (40 hex chars), followed by 3 bytes (6 hex chars) of fee
  while (offset < cleanPath.length) {
    // Extract token address (20 bytes = 40 hex chars)
    const tokenHex = cleanPath.slice(offset, offset + 40);
    tokens.push('0x' + tokenHex);
    offset += 40;
    
    // Skip fee (3 bytes = 6 hex chars) if present
    if (offset + 6 <= cleanPath.length) {
      offset += 6;
    }
  }
  
  return tokens;
}

/**
 * Convert EVM address to Hedera token ID
 * Hedera EVM addresses are padded with zeros, only the last 8 hex chars matter
 * Example: 0x0000000000000000000000000000000000163b5a -> 0.0.1456986
 */
export function evmAddressToTokenId(address: string): string {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  // Take only the last 8 hex characters (4 bytes = 32 bits)
  // Hedera token IDs fit in 32 bits (max ~4 billion)
  const lastEightChars = cleanAddress.slice(-8);
  const num = parseInt(lastEightChars, 16);
  
  return `0.0.${num}`;
}
