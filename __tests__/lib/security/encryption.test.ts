// Test Suite: Encryption Utilities
// Tests for lib/security/encryption.ts
// Generated: 2025-11-10

import {
  generateDEK,
  encryptPHI,
  decryptPHI,
  rotateDEK,
  encryptForExport
} from '@/lib/security/encryption';

describe('Encryption - generateDEK', () => {
  test('should generate 256-bit DEK as base64 string', async () => {
    // Act
    const dek = await generateDEK();

    // Assert
    expect(typeof dek).toBe('string');
    expect(dek.length).toBeGreaterThan(0);

    // Verify it's valid base64
    const decoded = Buffer.from(dek, 'base64');
    expect(decoded.length).toBe(32); // 256 bits = 32 bytes
  });

  test('should generate unique DEKs each time', async () => {
    // Act
    const dek1 = await generateDEK();
    const dek2 = await generateDEK();
    const dek3 = await generateDEK();

    // Assert
    expect(dek1).not.toBe(dek2);
    expect(dek2).not.toBe(dek3);
    expect(dek1).not.toBe(dek3);
  });
});

describe('Encryption - encryptPHI', () => {
  test('should encrypt plaintext successfully', async () => {
    // Arrange
    const dek = await generateDEK();
    const plaintext = 'Type 2 Diabetes';

    // Act
    const encrypted = await encryptPHI(plaintext, dek);

    // Assert
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);
    expect(encrypted).not.toBe(plaintext);

    // Verify it's base64url encoded
    expect(() => Buffer.from(encrypted, 'base64url')).not.toThrow();
  });

  test('should produce different ciphertext each time (unique IV)', async () => {
    // Arrange
    const dek = await generateDEK();
    const plaintext = 'Sensitive Health Data';

    // Act
    const encrypted1 = await encryptPHI(plaintext, dek);
    const encrypted2 = await encryptPHI(plaintext, dek);

    // Assert
    expect(encrypted1).not.toBe(encrypted2); // Different IVs
  });

  test('should encrypt empty string', async () => {
    // Arrange
    const dek = await generateDEK();

    // Act
    const encrypted = await encryptPHI('', dek);

    // Assert
    expect(encrypted.length).toBeGreaterThan(0); // IV + tag still present
  });

  test('should encrypt long text', async () => {
    // Arrange
    const dek = await generateDEK();
    const longText = 'A'.repeat(10000); // 10KB text

    // Act
    const encrypted = await encryptPHI(longText, dek);

    // Assert
    expect(encrypted.length).toBeGreaterThan(0);
  });

  test('should throw error with invalid DEK format', async () => {
    // Arrange
    const invalidDEK = 'not-a-valid-base64-key';
    const plaintext = 'Test Data';

    // Act & Assert
    await expect(encryptPHI(plaintext, invalidDEK)).rejects.toThrow('Failed to encrypt sensitive data');
  });

  test('should throw error with wrong DEK length', async () => {
    // Arrange: 128-bit key instead of 256-bit
    const shortDEK = Buffer.from(crypto.randomBytes(16)).toString('base64');
    const plaintext = 'Test Data';

    // Act & Assert
    await expect(encryptPHI(plaintext, shortDEK)).rejects.toThrow();
  });
});

describe('Encryption - decryptPHI', () => {
  test('should decrypt ciphertext successfully', async () => {
    // Arrange
    const dek = await generateDEK();
    const plaintext = 'Type 2 Diabetes';
    const encrypted = await encryptPHI(plaintext, dek);

    // Act
    const decrypted = await decryptPHI(encrypted, dek);

    // Assert
    expect(decrypted).toBe(plaintext);
  });

  test('should decrypt empty string', async () => {
    // Arrange
    const dek = await generateDEK();
    const encrypted = await encryptPHI('', dek);

    // Act
    const decrypted = await decryptPHI(encrypted, dek);

    // Assert
    expect(decrypted).toBe('');
  });

  test('should decrypt long text', async () => {
    // Arrange
    const dek = await generateDEK();
    const longText = 'B'.repeat(10000);
    const encrypted = await encryptPHI(longText, dek);

    // Act
    const decrypted = await decryptPHI(encrypted, dek);

    // Assert
    expect(decrypted).toBe(longText);
  });

  test('should throw error with wrong DEK', async () => {
    // Arrange
    const dek1 = await generateDEK();
    const dek2 = await generateDEK();
    const plaintext = 'Secret Data';
    const encrypted = await encryptPHI(plaintext, dek1);

    // Act & Assert
    await expect(decryptPHI(encrypted, dek2)).rejects.toThrow('Failed to decrypt sensitive data');
  });

  test('should throw error with tampered ciphertext', async () => {
    // Arrange
    const dek = await generateDEK();
    const plaintext = 'Original Data';
    const encrypted = await encryptPHI(plaintext, dek);

    // Tamper with ciphertext (flip a bit)
    const tamperedBuffer = Buffer.from(encrypted, 'base64url');
    tamperedBuffer[20] ^= 0xFF; // Flip bits
    const tampered = tamperedBuffer.toString('base64url');

    // Act & Assert
    await expect(decryptPHI(tampered, dek)).rejects.toThrow();
  });

  test('should throw error with invalid base64url format', async () => {
    // Arrange
    const dek = await generateDEK();
    const invalid = 'not-valid-base64url!!!';

    // Act & Assert
    await expect(decryptPHI(invalid, dek)).rejects.toThrow();
  });
});

describe('Encryption - rotateDEK', () => {
  test('should generate new DEK for rotation', async () => {
    // Arrange
    const oldDEK = await generateDEK();
    const userId = 'user-123';

    // Act
    const newDEK = await rotateDEK(userId, oldDEK);

    // Assert
    expect(typeof newDEK).toBe('string');
    expect(newDEK).not.toBe(oldDEK);

    // Verify new DEK is 256-bit
    const decoded = Buffer.from(newDEK, 'base64');
    expect(decoded.length).toBe(32);
  });

  test('should generate unique new DEKs each rotation', async () => {
    // Arrange
    const oldDEK = await generateDEK();
    const userId = 'user-123';

    // Act
    const newDEK1 = await rotateDEK(userId, oldDEK);
    const newDEK2 = await rotateDEK(userId, oldDEK);

    // Assert
    expect(newDEK1).not.toBe(newDEK2);
  });
});

describe('Encryption - encryptForExport', () => {
  test('should encrypt data export with one-time key', async () => {
    // Arrange
    const userData = JSON.stringify({
      profile: { name: 'Jane Doe' },
      meals: [{ name: 'Breakfast', calories: 500 }]
    });

    // Act
    const { encrypted, key } = await encryptForExport(userData);

    // Assert
    expect(typeof encrypted).toBe('string');
    expect(typeof key).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);

    // Verify key is valid DEK (256-bit base64)
    const decoded = Buffer.from(key, 'base64');
    expect(decoded.length).toBe(32);
  });

  test('should decrypt export with provided key', async () => {
    // Arrange
    const userData = JSON.stringify({ test: 'data' });
    const { encrypted, key } = await encryptForExport(userData);

    // Act
    const decrypted = await decryptPHI(encrypted, key);

    // Assert
    expect(decrypted).toBe(userData);
  });

  test('should generate unique keys for each export', async () => {
    // Arrange
    const userData = JSON.stringify({ test: 'data' });

    // Act
    const export1 = await encryptForExport(userData);
    const export2 = await encryptForExport(userData);

    // Assert
    expect(export1.key).not.toBe(export2.key);
    expect(export1.encrypted).not.toBe(export2.encrypted);
  });

  test('should encrypt large exports', async () => {
    // Arrange: 1MB of user data
    const largeData = JSON.stringify({
      meals: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Meal ${i}`,
        calories: 500
      }))
    });

    // Act
    const { encrypted, key } = await encryptForExport(largeData);

    // Assert
    expect(encrypted.length).toBeGreaterThan(0);

    // Verify can be decrypted
    const decrypted = await decryptPHI(encrypted, key);
    expect(decrypted).toBe(largeData);
  });
});

describe('Encryption - End-to-End Integration', () => {
  test('should encrypt and decrypt multiple times with same DEK', async () => {
    // Arrange
    const dek = await generateDEK();
    const data1 = 'Health Condition 1';
    const data2 = 'Health Condition 2';
    const data3 = 'Medication Info';

    // Act
    const enc1 = await encryptPHI(data1, dek);
    const enc2 = await encryptPHI(data2, dek);
    const enc3 = await encryptPHI(data3, dek);

    const dec1 = await decryptPHI(enc1, dek);
    const dec2 = await decryptPHI(enc2, dek);
    const dec3 = await decryptPHI(enc3, dek);

    // Assert
    expect(dec1).toBe(data1);
    expect(dec2).toBe(data2);
    expect(dec3).toBe(data3);
  });

  test('should handle special characters and unicode', async () => {
    // Arrange
    const dek = await generateDEK();
    const specialText = 'Special: !@#$%^&*() 中文 Émojis 😀🎉';

    // Act
    const encrypted = await encryptPHI(specialText, dek);
    const decrypted = await decryptPHI(encrypted, dek);

    // Assert
    expect(decrypted).toBe(specialText);
  });
});
