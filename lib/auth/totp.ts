/**
 * TOTP Utilities (Multi-Factor Authentication)
 *
 * Purpose: Generate and verify Time-based One-Time Passwords (TOTP)
 * Standard: RFC 6238
 * Code Format: 6 digits, 30-second time step
 * Time Tolerance: ±1 step (prevents clock skew issues)
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const TOTP_ISSUER = 'Nutri'
const TOTP_DIGITS = 6
const TOTP_PERIOD = 30 // 30 seconds
const TOTP_ALGORITHM = 'SHA1'

/**
 * Generates a new TOTP secret for MFA setup
 *
 * @returns Base32-encoded secret string
 *
 * @example
 * const secret = generateSecret()
 * // Store secret in user_profiles.mfa_secret
 * // WARNING: currently stored in PLAINTEXT. This comment previously claimed it
 * // was encrypted at rest. Anyone with database read access can defeat the
 * // second factor. See docs/AUDIT-2026-08-11.md (P4) and CLAUDE.md task 2.5.
 */
export function generateSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 })
  return secret.base32
}

/**
 * Generates a QR code data URL for TOTP setup
 *
 * @param secret - TOTP secret (base32)
 * @param email - User email (displayed in authenticator app)
 * @returns QR code as data URL (image/png base64)
 *
 * @example
 * const qrCode = await generateQRCode(secret, 'user@example.com')
 * // Display QR code in frontend: <img src={qrCode} alt="MFA QR Code" />
 */
export async function generateQRCode(
  secret: string,
  email: string
): Promise<string> {
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: email,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  const otpauthUrl = totp.toString()

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
  return qrCodeDataUrl
}

/**
 * Verifies a TOTP code against a secret
 *
 * @param code - 6-digit code from authenticator app
 * @param secret - TOTP secret (base32)
 * @param tolerance - Time step tolerance (default: 1 = ±30 seconds)
 * @returns true if code is valid, false otherwise
 *
 * @example
 * const isValid = verifyCode('123456', userProfile.mfa_secret)
 * if (!isValid) {
 *   throw new Error('Invalid MFA code')
 * }
 */
export function verifyCode(
  code: string,
  secret: string,
  tolerance: number = 1
): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: TOTP_ISSUER,
      algorithm: TOTP_ALGORITHM,
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
      secret: OTPAuth.Secret.fromBase32(secret),
    })

    // Verify with time tolerance (±1 step by default)
    const delta = totp.validate({
      token: code,
      window: tolerance,
    })

    // delta is the time step difference (0 = exact match, ±1 = within tolerance)
    return delta !== null
  } catch (error) {
    console.error('[TOTP] Verification error:', error)
    return false
  }
}

/**
 * Generates 10 single-use backup codes for MFA recovery
 *
 * @returns Array of 10 random backup codes (8 characters each)
 *
 * @example
 * const backupCodes = generateBackupCodes()
 * // Display to user ONCE: ['abc12345', 'def67890', ...]
 * // Store hashed versions in user_profiles.mfa_backup_codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []

  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex')
    codes.push(code)
  }

  return codes
}

/**
 * Hashes backup codes for secure storage
 *
 * @param codes - Plain backup codes
 * @returns Array of bcrypt-hashed codes
 *
 * @example
 * const plainCodes = generateBackupCodes()
 * const hashedCodes = await hashBackupCodes(plainCodes)
 * // Store hashedCodes in user_profiles.mfa_backup_codes
 * // Display plainCodes to user (one-time only)
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(
    codes.map((code) => bcrypt.hash(code, 10))
  )
  return hashedCodes
}

/**
 * Verifies a backup code against stored hashes
 *
 * @param code - Plain backup code from user
 * @param hashedCodes - Array of bcrypt-hashed backup codes
 * @returns Index of matching code, or -1 if no match
 *
 * @example
 * const index = await verifyBackupCode(userInput, userProfile.mfa_backup_codes)
 * if (index !== -1) {
 *   // Remove used backup code from array
 *   userProfile.mfa_backup_codes.splice(index, 1)
 *   await db.update(userProfiles).set({ mfa_backup_codes: userProfile.mfa_backup_codes })
 * }
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(code, hashedCodes[i])
    if (isMatch) {
      return i // Return index of matching code
    }
  }
  return -1 // No match found
}

/**
 * Generates a complete MFA setup (secret + QR code + backup codes)
 *
 * @param email - User email
 * @returns MFA setup data
 *
 * @example
 * const mfaSetup = await generateMFASetup('user@example.com')
 * // Display to user:
 * // - QR code: mfaSetup.qrCode
 * // - Backup codes: mfaSetup.backupCodes (plain, one-time only)
 * // Store in database:
 * // - mfaSetup.secret (encrypted)
 * // - mfaSetup.hashedBackupCodes
 */
export async function generateMFASetup(email: string): Promise<{
  secret: string
  qrCode: string
  backupCodes: string[]
  hashedBackupCodes: string[]
}> {
  const secret = generateSecret()
  const qrCode = await generateQRCode(secret, email)
  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = await hashBackupCodes(backupCodes)

  return {
    secret,
    qrCode,
    backupCodes,
    hashedBackupCodes,
  }
}
