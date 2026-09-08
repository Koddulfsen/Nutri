// Encryption Utilities - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: AES-256-GCM encryption for PHI fields (Phase 3+)

import { webcrypto } from 'node:crypto';

const crypto = webcrypto as Crypto;

/**
 * Encryption Algorithm Configuration
 *
 * AES-256-GCM with 12-byte (96-bit) IV
 * - Algorithm: AES-GCM (Galois/Counter Mode) for authenticated encryption
 * - Key length: 256 bits (32 bytes)
 * - IV length: 12 bytes (96 bits) - optimal for GCM
 * - Tag length: 128 bits (16 bytes) - default, provides strong authentication
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256,
  ivLength: 12,
  tagLength: 128
};

/**
 * Import Data Encryption Key (DEK)
 *
 * Converts base64-encoded DEK string into CryptoKey for use with Web Crypto API.
 *
 * @param dek - Base64-encoded 256-bit key from user_profiles.data_encryption_key
 * @returns CryptoKey for encryption/decryption
 *
 * @throws Error if DEK format is invalid
 */
async function importDEK(dek: string): Promise<CryptoKey> {
  try {
    // Decode base64 DEK to raw bytes
    const keyData = Buffer.from(dek, 'base64');

    if (keyData.length !== 32) {
      throw new Error('Invalid DEK: must be 256 bits (32 bytes)');
    }

    // Import raw key bytes into CryptoKey
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: ENCRYPTION_CONFIG.algorithm, length: ENCRYPTION_CONFIG.keyLength },
      false, // Not extractable (security best practice)
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('❌ DEK import failed:', error);
    throw new Error('Invalid encryption key format');
  }
}

/**
 * Generate New Data Encryption Key
 *
 * Generates a random 256-bit DEK for a new user.
 * Store in user_profiles.data_encryption_key as base64 string.
 *
 * @returns Base64-encoded 256-bit key
 *
 * @example
 * const dek = await generateDEK();
 * await db.insert(userProfiles).values({
 *   userId,
 *   dataEncryptionKey: dek,
 *   ...
 * });
 */
export async function generateDEK(): Promise<string> {
  const keyData = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  return Buffer.from(keyData).toString('base64');
}

/**
 * Encrypt PHI Field
 *
 * Encrypts sensitive PHI data using AES-256-GCM.
 *
 * Phase 3+ Use Cases:
 * - health_conditions (text field in user_profiles)
 * - medications (text field in user_profiles)
 * - notes (text field in meal_logs)
 *
 * @param plaintext - Sensitive data to encrypt
 * @param dek - Base64-encoded DEK from user_profiles.data_encryption_key
 * @returns Base64URL-encoded: iv + ciphertext (tag automatically appended by GCM)
 *
 * @throws Error if encryption fails
 *
 * @example
 * const encrypted = await encryptPHI('Type 2 Diabetes', user.dataEncryptionKey);
 * await db.update(userProfiles).set({ healthConditions: encrypted });
 */
export async function encryptPHI(plaintext: string, dek: string): Promise<string> {
  try {
    // Generate random 12-byte IV (unique per encryption)
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));

    // Import DEK
    const key = await importDEK(dek);

    // Encode plaintext to bytes
    const plaintextBytes = new TextEncoder().encode(plaintext);

    // Encrypt with AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv,
        tagLength: ENCRYPTION_CONFIG.tagLength
      },
      key,
      plaintextBytes
    );

    // Combine iv + ciphertext (tag is automatically appended to ciphertext by GCM)
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64url (URL-safe)
    return Buffer.from(combined).toString('base64url');
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt PHI Field
 *
 * Decrypts AES-256-GCM encrypted PHI data.
 *
 * @param encrypted - Base64URL-encoded: iv + ciphertext (from encryptPHI)
 * @param dek - Base64-encoded DEK from user_profiles.data_encryption_key
 * @returns Decrypted plaintext
 *
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @example
 * const decrypted = await decryptPHI(user.healthConditions, user.dataEncryptionKey);
 * console.log(decrypted); // "Type 2 Diabetes"
 */
export async function decryptPHI(encrypted: string, dek: string): Promise<string> {
  try {
    // Decode base64url to bytes
    const data = Buffer.from(encrypted, 'base64url');

    // Extract IV (first 12 bytes)
    const iv = data.subarray(0, ENCRYPTION_CONFIG.ivLength);

    // Extract ciphertext (remaining bytes, includes tag)
    const ciphertext = data.subarray(ENCRYPTION_CONFIG.ivLength);

    // Import DEK
    const key = await importDEK(dek);

    // Decrypt with AES-GCM (tag verification automatic)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv,
        tagLength: ENCRYPTION_CONFIG.tagLength
      },
      key,
      ciphertext
    );

    // Decode bytes to string
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data - key may be incorrect or data tampered');
  }
}

/**
 * Rotate Data Encryption Key
 *
 * WARNING: this does NOT rotate anything. It generates a new key and returns it.
 * Nothing is decrypted, re-encrypted, stored, or cleaned up, and the function does
 * not even read `oldDEK`. The docstring here previously described a five-step
 * rotation process that no code performs.
 *
 * Calling this on password change would DESTROY access to any encrypted data, since
 * the old key would be replaced without re-encrypting under the new one.
 *
 * (Currently harmless only because encryptPHI/decryptPHI have no callers at all —
 * no data is encrypted yet. See docs/AUDIT-2026-08-11.md P4/P5, CLAUDE.md task 2.5.)
 *
 * @param userId - User ID for key rotation
 * @param oldDEK - Current DEK (for decryption)
 * @returns New DEK (base64-encoded)
 *
 * @example
 * const newDEK = await rotateDEK(userId, user.dataEncryptionKey);
 * // Background job re-encrypts all PHI fields
 */
export async function rotateDEK(userId: string, oldDEK: string): Promise<string> {
  // Generate new DEK
  const newDEK = await generateDEK();

  // Return new DEK - caller must re-encrypt PHI fields
  // (Implementation in background job for Phase 3+)
  return newDEK;
}

/**
 * Encrypt for Export
 *
 * Encrypts entire data export file with one-time key for download.
 * User receives key separately (email) for maximum security.
 *
 * @param data - JSON string of user data export
 * @returns Object with encrypted data and one-time key
 *
 * @example
 * const { encrypted, key } = await encryptForExport(JSON.stringify(userData));
 * await uploadToStorage(encrypted);
 * await sendEmail({ downloadUrl, decryptionKey: key });
 */
export async function encryptForExport(data: string): Promise<{ encrypted: string; key: string }> {
  // Generate one-time key
  const oneTimeKey = await generateDEK();

  // Encrypt data
  const encrypted = await encryptPHI(data, oneTimeKey);

  return {
    encrypted,
    key: oneTimeKey
  };
}
