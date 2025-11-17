/**
 * Test script to verify extractAllTokensFromRoute works correctly
 * for both V1 and V2 routes
 */

import { extractAllTokensFromRoute } from '../utils/pathUtils'

console.log('🧪 Testing extractAllTokensFromRoute function\n')

// Test 1: V1 Route (SaucerSwap V1 with array of addresses)
console.log('=' .repeat(60))
console.log('Test 1: V1 Route (SaucerSwapV1)')
console.log('=' .repeat(60))

const v1Route = {
  route: [
    '0x0000000000000000000000000000000000431f5c', // USDC (0.0.4398940)
    '0x0000000000000000000000000000000000163b5a', // WHBAR (0.0.1456986)
    '0x000000000000000000000000000000000092b587', // SAUCE (0.0.9614727)
  ],
  aggregatorId: 'SaucerSwapV1',
}

const v1Tokens = extractAllTokensFromRoute(v1Route, 'SaucerSwapV1')
console.log('Input route:', v1Route.route)
console.log('Extracted tokens:', v1Tokens)
console.log('Expected: ["0.0.4398940", "0.0.1456986", "0.0.9614727"]')
console.log('✅ Pass:', JSON.stringify(v1Tokens) === JSON.stringify(['0.0.4398940', '0.0.1456986', '0.0.9614727']))
console.log()

// Test 2: V1 Route with address(0) (should be replaced with WHBAR)
console.log('=' .repeat(60))
console.log('Test 2: V1 Route with address(0) (should become WHBAR)')
console.log('=' .repeat(60))

const v1RouteWithZero = {
  route: [
    '0x0000000000000000000000000000000000431f5c', // USDC
    '0x0000000000000000000000000000000000000000', // address(0) -> should become WHBAR
    '0x000000000000000000000000000000000092b587', // SAUCE
  ],
  aggregatorId: 'SaucerSwapV1',
}

const v1TokensWithZero = extractAllTokensFromRoute(v1RouteWithZero, 'SaucerSwapV1')
console.log('Input route:', v1RouteWithZero.route)
console.log('Extracted tokens:', v1TokensWithZero)
console.log('Expected: ["0.0.4398940", "0.0.1456986", "0.0.9614727"]')
console.log('✅ Pass:', JSON.stringify(v1TokensWithZero) === JSON.stringify(['0.0.4398940', '0.0.1456986', '0.0.9614727']))
console.log()

// Test 3: V2 Route (single hop with encoded path)
console.log('=' .repeat(60))
console.log('Test 3: V2 Route (single hop)')
console.log('=' .repeat(60))

const v2RouteSingleHop = {
  path: '0x0000000000000000000000000000000000431f5c000bb80000000000000000000000000000000000163b5a',
  aggregatorId: 'SaucerSwapV2',
}

const v2SingleTokens = extractAllTokensFromRoute(v2RouteSingleHop, 'SaucerSwapV2')
console.log('Input path:', v2RouteSingleHop.path)
console.log('Extracted tokens:', v2SingleTokens)
console.log('Expected: ["0.0.4398940", "0.0.1456986"]')
console.log('✅ Pass:', JSON.stringify(v2SingleTokens) === JSON.stringify(['0.0.4398940', '0.0.1456986']))
console.log()

// Test 4: V2 Route (multi-hop with encoded path)
console.log('=' .repeat(60))
console.log('Test 4: V2 Route (multi-hop)')
console.log('=' .repeat(60))

const v2RouteMultiHop = {
  path: '0x0000000000000000000000000000000000431f5c000bb80000000000000000000000000000000000163b5a000bb8000000000000000000000000000000000092b587',
  aggregatorId: 'SaucerSwapV2',
}

const v2MultiTokens = extractAllTokensFromRoute(v2RouteMultiHop, 'SaucerSwapV2')
console.log('Input path:', v2RouteMultiHop.path)
console.log('Extracted tokens:', v2MultiTokens)
console.log('Expected: ["0.0.4398940", "0.0.1456986", "0.0.9614727"]')
console.log('✅ Pass:', JSON.stringify(v2MultiTokens) === JSON.stringify(['0.0.4398940', '0.0.1456986', '0.0.9614727']))
console.log()

// Test 5: Empty route (should return empty array)
console.log('=' .repeat(60))
console.log('Test 5: Empty route (no path)')
console.log('=' .repeat(60))

const emptyRoute = {
  aggregatorId: 'SaucerSwapV2',
}

const emptyTokens = extractAllTokensFromRoute(emptyRoute, 'SaucerSwapV2')
console.log('Input route:', emptyRoute)
console.log('Extracted tokens:', emptyTokens)
console.log('Expected: []')
console.log('✅ Pass:', JSON.stringify(emptyTokens) === JSON.stringify([]))
console.log()

console.log('=' .repeat(60))
console.log('✨ All tests completed!')
console.log('=' .repeat(60))
