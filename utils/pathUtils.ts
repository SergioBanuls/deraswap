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

/**
 * Extract all token IDs from a swap route, including intermediate tokens
 * Handles both V1 (array of addresses) and V2 (encoded path) formats
 *
 * @param route - SwapRoute object containing path information
 * @param aggregatorId - Aggregator ID to determine route type (V1 or V2)
 * @returns Array of unique Hedera token IDs (0.0.X format)
 */
export function extractAllTokensFromRoute(route: any, aggregatorId: string | string[]): string[] {
  const WHBAR_ADDRESS = '0x0000000000000000000000000000000000163B5A';
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

  // Determine if this is a V1 or V2 route
  const aggId = Array.isArray(aggregatorId) ? aggregatorId.join(',') : aggregatorId;
  const isV1Route = aggId.startsWith('SaucerSwapV1');

  let evmAddresses: string[] = [];

  if (isV1Route && Array.isArray(route.route) && route.route.length > 0) {
    // V1 routes: route.route is an array of EVM addresses
    console.log('📍 Extracting tokens from V1 route:', route.route);

    evmAddresses = route.route.map((addr: string) => {
      // Replace address(0) with WHBAR address
      if (addr.toLowerCase() === ADDRESS_ZERO.toLowerCase()) {
        console.log('🔄 Replacing address(0) with WHBAR in V1 route');
        return WHBAR_ADDRESS;
      }
      return addr;
    });
  } else if (route.path && typeof route.path === 'string') {
    // V2 routes: route.path is an encoded hex string (token+fee+token+fee...)
    console.log('📍 Extracting tokens from V2 path:', route.path);
    evmAddresses = extractTokensFromPath(route.path);
  } else {
    console.warn('⚠️ No path information found in route');
    return [];
  }

  // Convert EVM addresses to Hedera token IDs
  const tokenIds = evmAddresses.map(addr => {
    // Skip address(0) - shouldn't happen but be safe
    if (addr.toLowerCase() === ADDRESS_ZERO.toLowerCase()) {
      console.warn('⚠️ Found address(0) in path - skipping');
      return null;
    }

    // WHBAR is 0.0.1456986
    if (addr.toLowerCase() === WHBAR_ADDRESS.toLowerCase()) {
      return '0.0.1456986';
    }

    // Convert other addresses
    return evmAddressToTokenId(addr);
  }).filter((id): id is string => id !== null);

  // Remove duplicates
  const uniqueTokenIds = Array.from(new Set(tokenIds));

  console.log('📍 Extracted token IDs from route:', uniqueTokenIds);

  return uniqueTokenIds;
}
