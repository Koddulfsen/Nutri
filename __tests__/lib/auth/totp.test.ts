// Test Suite: TOTP Utilities (Multi-Factor Authentication)
// Tests for lib/auth/totp.ts
//
// Replaces a console.assert()-based script that never failed the process on
// a mismatch — every "test" here was silently passing regardless of actual
// behavior. This is a real assertion suite instead.

import { describe, test, expect } from 'vitest';
import * as OTPAuth from 'otpauth';
import {
  generateSecret,
  generateQRCode,
  verifyCode,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  generateMFASetup,
} from '@/lib/auth/totp';

describe('generateSecret', () => {
  test('returns a non-empty base32 secret', () => {
    const secret = generateSecret();
    expect(secret.length).toBeGreaterThan(0);
    expect(secret).toMatch(/^[A-Z2-7]+=*$/); // base32 alphabet
  });

  test('generates a different secret each call', () => {
    expect(generateSecret()).not.toBe(generateSecret());
  });
});

describe('generateQRCode', () => {
  test('returns a PNG data URL', async () => {
    const secret = generateSecret();
    const qrCode = await generateQRCode(secret, 'test@example.com');
    expect(qrCode.startsWith('data:image/png;base64,')).toBe(true);
  });
});

describe('verifyCode', () => {
  test('accepts a code freshly generated from the same secret', () => {
    const secret = generateSecret();
    const totp = new OTPAuth.TOTP({
      issuer: 'Nutri',
      label: 'test@example.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const code = totp.generate();

    expect(verifyCode(code, secret)).toBe(true);
  });

  test('rejects an arbitrary wrong code', () => {
    const secret = generateSecret();
    expect(verifyCode('000000', secret)).toBe(false);
  });

  test('rejects a code generated from a different secret', () => {
    const secretA = generateSecret();
    const secretB = generateSecret();
    const totpB = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretB),
    });
    expect(verifyCode(totpB.generate(), secretA)).toBe(false);
  });

  test('returns false rather than throwing on a malformed secret', () => {
    expect(verifyCode('123456', 'not-valid-base32!!!')).toBe(false);
  });
});

describe('generateBackupCodes', () => {
  test('generates 10 codes of 8 hex characters each', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    for (const code of codes) {
      expect(code).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  test('generates distinct codes', () => {
    const codes = generateBackupCodes();
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('hashBackupCodes / verifyBackupCode', () => {
  test('round-trips: a hashed code verifies against its own plaintext', async () => {
    const codes = generateBackupCodes();
    const hashed = await hashBackupCodes(codes);

    expect(hashed).toHaveLength(10);
    // bcrypt hashes never equal their plaintext input
    hashed.forEach((h, i) => expect(h).not.toBe(codes[i]));

    const index = await verifyBackupCode(codes[0], hashed);
    expect(index).toBe(0);
  });

  test('returns -1 for a code that matches none of the hashes', async () => {
    const codes = generateBackupCodes();
    const hashed = await hashBackupCodes(codes);

    const index = await verifyBackupCode('deadbeef', hashed);
    expect(index).toBe(-1);
  });
});

describe('generateMFASetup', () => {
  test('produces a complete, internally consistent setup', async () => {
    const setup = await generateMFASetup('user@example.com');

    expect(setup.secret.length).toBeGreaterThan(0);
    expect(setup.qrCode.startsWith('data:image/png;base64,')).toBe(true);
    expect(setup.backupCodes).toHaveLength(10);
    expect(setup.hashedBackupCodes).toHaveLength(10);

    // The setup's own backup codes verify against its own hashes.
    const index = await verifyBackupCode(setup.backupCodes[3], setup.hashedBackupCodes);
    expect(index).toBe(3);
  });
});
