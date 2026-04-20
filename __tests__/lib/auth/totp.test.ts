/**
 * TOTP Utilities Tests
 *
 * Run: npx tsx __tests__/lib/auth/totp.test.ts
 */

import {
  generateSecret,
  generateQRCode,
  verifyCode,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  generateMFASetup,
} from '@/lib/auth/totp'
import * as OTPAuth from 'otpauth'

console.log('🧪 Testing TOTP Utilities...\n')

async function runTests() {
  // Test 1: Generate secret
  console.log('Test 1: Generate TOTP secret')
  const secret = generateSecret()
  console.log('✓ Secret generated:', secret)
  console.assert(
    secret.length > 0,
    'Secret should not be empty'
  )
  console.log('')

  // Test 2: Generate QR code
  console.log('Test 2: Generate QR code')
  const qrCode = await generateQRCode(secret, 'test@example.com')
  console.log('✓ QR code generated:', qrCode.substring(0, 100) + '...')
  console.assert(
    qrCode.startsWith('data:image/png;base64,'),
    'QR code should be data URL'
  )
  console.log('')

  // Test 3: Generate and verify TOTP code
  console.log('Test 3: Generate and verify TOTP code')
  const totp = new OTPAuth.TOTP({
    issuer: 'Nutri',
    label: 'test@example.com',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  const code = totp.generate()
  console.log('✓ Generated code:', code)

  const isValid = verifyCode(code, secret)
  console.log('✓ Verification result:', isValid)
  console.assert(
    isValid === true,
    'Code should be valid'
  )
  console.log('')

  // Test 4: Verify invalid code
  console.log('Test 4: Verify invalid code')
  const invalidResult = verifyCode('000000', secret)
  console.log('✓ Invalid code rejected:', !invalidResult)
  console.assert(
    invalidResult === false,
    'Invalid code should fail'
  )
  console.log('')

  // Test 5: Generate backup codes
  console.log('Test 5: Generate backup codes')
  const backupCodes = generateBackupCodes()
  console.log('✓ Backup codes generated:', backupCodes)
  console.assert(
    backupCodes.length === 10,
    'Should generate 10 backup codes'
  )
  console.assert(
    backupCodes[0].length === 8,
    'Each code should be 8 characters'
  )
  console.log('')

  // Test 6: Hash backup codes
  console.log('Test 6: Hash backup codes')
  const hashedCodes = await hashBackupCodes(backupCodes)
  console.log('✓ Hashed codes:', hashedCodes.map(h => h.substring(0, 20) + '...'))
  console.assert(
    hashedCodes.length === 10,
    'Should hash 10 codes'
  )
  console.log('')

  // Test 7: Verify backup code
  console.log('Test 7: Verify backup code')
  const codeIndex = await verifyBackupCode(backupCodes[0], hashedCodes)
  console.log('✓ Found code at index:', codeIndex)
  console.assert(
    codeIndex === 0,
    'Should find code at index 0'
  )
  console.log('')

  // Test 8: Verify invalid backup code
  console.log('Test 8: Verify invalid backup code')
  const invalidIndex = await verifyBackupCode('invalid123', hashedCodes)
  console.log('✓ Invalid code index:', invalidIndex)
  console.assert(
    invalidIndex === -1,
    'Invalid code should return -1'
  )
  console.log('')

  // Test 9: Complete MFA setup
  console.log('Test 9: Complete MFA setup')
  const mfaSetup = await generateMFASetup('user@example.com')
  console.log('✓ MFA setup generated:')
  console.log('  - Secret:', mfaSetup.secret)
  console.log('  - QR code length:', mfaSetup.qrCode.length)
  console.log('  - Backup codes:', mfaSetup.backupCodes.length)
  console.log('  - Hashed backup codes:', mfaSetup.hashedBackupCodes.length)
  console.assert(
    mfaSetup.secret.length > 0,
    'Should have secret'
  )
  console.assert(
    mfaSetup.backupCodes.length === 10,
    'Should have 10 backup codes'
  )
  console.log('')

  console.log('✅ All TOTP tests passed!\n')
}

runTests().catch(console.error)
