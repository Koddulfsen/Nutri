// Test Suite: Password Strength Validator
// Tests for lib/auth/password.ts
//
// Replaces a console.assert()-based script that never failed the process on
// a mismatch (console.assert only logs a warning) — every "test" here was
// silently passing regardless of actual behavior. This is a real assertion
// suite instead.

import { describe, test, expect } from 'vitest';
import { validatePasswordStrength, isPasswordValid } from '@/lib/auth/password';

describe('validatePasswordStrength', () => {
  test('strong password: 12+ chars with a special character', () => {
    const result = validatePasswordStrength('Password123!@#');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
    expect(result.errors).toEqual([]);
  });

  test('medium password: meets minimum requirements, no special char, under 12 chars', () => {
    const result = validatePasswordStrength('Password123');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('medium');
    expect(result.errors).toEqual([]);
  });

  test('rejects a password under 8 characters', () => {
    const result = validatePasswordStrength('Pass1!');
    expect(result.isValid).toBe(false);
    expect(result.strength).toBe('weak');
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  test('rejects a password missing an uppercase letter', () => {
    const result = validatePasswordStrength('password123');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.suggestions).toContain('Add an uppercase letter (A-Z)');
  });

  test('rejects a password missing a lowercase letter', () => {
    const result = validatePasswordStrength('PASSWORD123');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
    expect(result.suggestions).toContain('Add a lowercase letter (a-z)');
  });

  test('rejects a password missing a number', () => {
    const result = validatePasswordStrength('PasswordOnly');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
    expect(result.suggestions).toContain('Add a number (0-9)');
  });

  test('reports every missing requirement at once, not just the first', () => {
    const result = validatePasswordStrength('short');
    expect(result.errors).toHaveLength(3); // too short, no uppercase, no number
  });

  test('medium strength gets an upgrade suggestion when only one of special-char/length is met', () => {
    const result = validatePasswordStrength('Password12345'); // 13 chars, no special char
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('medium');
    expect(result.suggestions).toContain('For strong password: use 12+ characters and special characters');
  });

  test('strong requires BOTH a special character AND 12+ length, not either alone', () => {
    const shortWithSpecial = validatePasswordStrength('Pass123!'); // 8 chars, has special char
    expect(shortWithSpecial.strength).toBe('medium');

    const longWithoutSpecial = validatePasswordStrength('Passwordddddd123'); // 17 chars, no special char
    expect(longWithoutSpecial.strength).toBe('medium');
  });
});

describe('isPasswordValid', () => {
  test('returns true for a password meeting all requirements', () => {
    expect(isPasswordValid('Password123')).toBe(true);
  });

  test('returns false for a password missing requirements', () => {
    expect(isPasswordValid('password')).toBe(false);
  });
});
