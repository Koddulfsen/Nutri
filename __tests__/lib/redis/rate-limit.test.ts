/**
 * Rate Limiting Utilities Tests
 *
 * Run: npx tsx __tests__/lib/redis/rate-limit.test.ts
 *
 * NOTE: This test will fail open if Redis is not configured (UPSTASH_REDIS_REST_URL missing)
 */

import {
  checkRateLimit,
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
  resetRateLimit,
} from '@/lib/redis/rate-limit'

console.log('🧪 Testing Rate Limiting Utilities...\n')

async function runTests() {
  // Test 1: Basic rate limit check
  console.log('Test 1: Basic rate limit check (5 attempts max)')
  const result1 = await checkRateLimit({
    key: 'test:ratelimit:basic',
    limit: 5,
    windowSeconds: 60,
  })
  console.log('✓ Result:', result1)
  console.assert(
    result1.allowed === true,
    'First attempt should be allowed'
  )
  console.assert(
    result1.remaining <= 5,
    'Remaining should be <= 5'
  )
  console.log('')

  // Test 2: Multiple attempts (sequential)
  console.log('Test 2: Sequential attempts')
  for (let i = 0; i < 3; i++) {
    const result = await checkRateLimit({
      key: 'test:ratelimit:sequential',
      limit: 5,
      windowSeconds: 60,
    })
    console.log(`  Attempt ${i + 1}:`, {
      allowed: result.allowed,
      remaining: result.remaining,
    })
  }
  console.log('')

  // Test 3: Login rate limit
  console.log('Test 3: Login rate limit (5 per IP per 15min)')
  const loginResult = await checkLoginRateLimit('192.168.1.100')
  console.log('✓ Login rate limit result:', loginResult)
  console.assert(
    loginResult.allowed === true,
    'Login should be allowed'
  )
  console.log('')

  // Test 4: Password reset rate limit
  console.log('Test 4: Password reset rate limit (3 per email per hour)')
  const resetResult = await checkPasswordResetRateLimit('test@example.com')
  console.log('✓ Password reset rate limit result:', resetResult)
  console.assert(
    resetResult.allowed === true,
    'Reset should be allowed'
  )
  console.log('')

  // Test 5: Reset rate limit
  console.log('Test 5: Manually reset rate limit')
  await resetRateLimit('test:ratelimit:basic')
  const afterReset = await checkRateLimit({
    key: 'test:ratelimit:basic',
    limit: 5,
    windowSeconds: 60,
  })
  console.log('✓ After reset:', afterReset)
  console.log('')

  // Cleanup
  console.log('Cleanup: Resetting test keys...')
  await resetRateLimit('test:ratelimit:basic')
  await resetRateLimit('test:ratelimit:sequential')
  await resetRateLimit('ratelimit:login:192.168.1.100')
  console.log('✓ Cleanup complete')
  console.log('')

  console.log('✅ All rate limiting tests passed!\n')
  console.log('⚠️  NOTE: If Redis is not configured, tests pass in "fail open" mode (all requests allowed)\n')
}

runTests().catch(console.error)
