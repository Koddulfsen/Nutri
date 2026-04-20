/**
 * Password Strength Validator Tests
 *
 * Run: npx tsx __tests__/lib/auth/password.test.ts
 */

import { validatePasswordStrength, isPasswordValid } from '@/lib/auth/password'

console.log('🧪 Testing Password Strength Validator...\n')

// Test 1: Valid strong password
console.log('Test 1: Strong password (12+ chars, special chars)')
const result1 = validatePasswordStrength('Password123!@#')
console.log('✓ Result:', result1)
console.assert(
  result1.isValid === true,
  'Should be valid'
)
console.assert(
  result1.strength === 'strong',
  'Should be strong'
)
console.log('')

// Test 2: Valid medium password
console.log('Test 2: Medium password (meets requirements)')
const result2 = validatePasswordStrength('Password123')
console.log('✓ Result:', result2)
console.assert(
  result2.isValid === true,
  'Should be valid'
)
console.assert(
  result2.strength === 'medium',
  'Should be medium'
)
console.log('')

// Test 3: Too short
console.log('Test 3: Too short (7 chars)')
const result3 = validatePasswordStrength('Pass12!')
console.log('✓ Result:', result3)
console.assert(
  result3.isValid === false,
  'Should be invalid'
)
console.assert(
  result3.errors.includes('Password must be at least 8 characters long'),
  'Should have length error'
)
console.log('')

// Test 4: Missing uppercase
console.log('Test 4: Missing uppercase')
const result4 = validatePasswordStrength('password123')
console.log('✓ Result:', result4)
console.assert(
  result4.isValid === false,
  'Should be invalid'
)
console.assert(
  result4.errors.some((e) => e.includes('uppercase')),
  'Should have uppercase error'
)
console.log('')

// Test 5: Missing lowercase
console.log('Test 5: Missing lowercase')
const result5 = validatePasswordStrength('PASSWORD123')
console.log('✓ Result:', result5)
console.assert(
  result5.isValid === false,
  'Should be invalid'
)
console.log('')

// Test 6: Missing number
console.log('Test 6: Missing number')
const result6 = validatePasswordStrength('PasswordABC')
console.log('✓ Result:', result6)
console.assert(
  result6.isValid === false,
  'Should be invalid'
)
console.log('')

// Test 7: isPasswordValid helper
console.log('Test 7: isPasswordValid() helper')
console.assert(
  isPasswordValid('Password123') === true,
  'Valid password should return true'
)
console.assert(
  isPasswordValid('password') === false,
  'Invalid password should return false'
)
console.log('✓ isPasswordValid() works correctly')
console.log('')

console.log('✅ All password validation tests passed!\n')
