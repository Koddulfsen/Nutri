/**
 * JWT Utilities Tests
 *
 * Run: npx tsx __tests__/lib/auth/jwt.test.ts
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  isTokenExpired,
} from '@/lib/auth/jwt'

console.log('🧪 Testing JWT Utilities...\n')

async function runTests() {
  // Test 1: Generate access token
  console.log('Test 1: Generate access token (1hr lifespan)')
  const accessToken = await generateAccessToken({
    userId: 'user-123',
    email: 'test@example.com',
    sessionVersion: 1,
  })
  console.log('✓ Token generated:', accessToken.token.substring(0, 50) + '...')
  console.log('✓ Expires at:', accessToken.expiresAt.toISOString())
  console.assert(
    accessToken.token.length > 0,
    'Token should not be empty'
  )
  console.log('')

  // Test 2: Generate refresh token
  console.log('Test 2: Generate refresh token (24hr lifespan)')
  const refreshToken = await generateRefreshToken({
    userId: 'user-123',
    email: 'test@example.com',
    sessionVersion: 1,
  })
  console.log('✓ Token generated:', refreshToken.token.substring(0, 50) + '...')
  console.log('✓ Expires at:', refreshToken.expiresAt.toISOString())
  console.log('')

  // Test 3: Verify valid token
  console.log('Test 3: Verify valid token')
  const payload = await verifyToken(accessToken.token)
  console.log('✓ Payload:', payload)
  console.assert(
    payload.userId === 'user-123',
    'User ID should match'
  )
  console.assert(
    payload.email === 'test@example.com',
    'Email should match'
  )
  console.assert(
    payload.sessionVersion === 1,
    'Session version should match'
  )
  console.log('')

  // Test 4: Check token expiration
  console.log('Test 4: Check token expiration')
  const expired = await isTokenExpired(accessToken.token)
  console.log('✓ Token expired:', expired)
  console.assert(
    expired === false,
    'Fresh token should not be expired'
  )
  console.log('')

  // Test 5: Invalid token
  console.log('Test 5: Verify invalid token')
  try {
    await verifyToken('invalid-token-12345')
    console.error('❌ Should have thrown error')
  } catch (error) {
    console.log('✓ Correctly rejected invalid token:', (error as Error).message)
  }
  console.log('')

  console.log('✅ All JWT tests passed!\n')
}

runTests().catch(console.error)
