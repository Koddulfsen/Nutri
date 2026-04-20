/**
 * Password Strength Validator
 *
 * Purpose: Validate password strength and enforce security requirements
 * Requirements:
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 number
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

export type PasswordStrength = 'weak' | 'medium' | 'strong'

export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  errors: string[]
  suggestions: string[]
}

/**
 * Validates password strength and returns detailed feedback
 *
 * @param password - Password string to validate
 * @returns Validation result with strength score and feedback
 *
 * @example
 * const result = validatePasswordStrength('Password123')
 * if (!result.isValid) {
 *   console.error('Password errors:', result.errors)
 * }
 * console.log('Password strength:', result.strength) // 'medium' or 'strong'
 */
export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  const errors: string[] = []
  const suggestions: string[] = []

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
    suggestions.push('Add an uppercase letter (A-Z)')
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
    suggestions.push('Add a lowercase letter (a-z)')
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
    suggestions.push('Add a number (0-9)')
  }

  // Calculate strength score
  let strength: PasswordStrength = 'weak'
  const isValid = errors.length === 0

  if (isValid) {
    // Base strength is medium if all requirements met
    strength = 'medium'

    // Upgrade to strong if password has additional complexity
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    )
    const isLongEnough = password.length >= 12

    if (hasSpecialChar && isLongEnough) {
      strength = 'strong'
    } else if (hasSpecialChar || isLongEnough) {
      // Keep medium strength but add suggestions
      suggestions.push(
        'For strong password: use 12+ characters and special characters'
      )
    }
  }

  return {
    isValid,
    strength,
    errors,
    suggestions,
  }
}

/**
 * Quick validation check (returns boolean only)
 *
 * @param password - Password string to validate
 * @returns true if password meets all requirements
 *
 * @example
 * if (!isPasswordValid('password')) {
 *   throw new Error('Invalid password')
 * }
 */
export function isPasswordValid(password: string): boolean {
  const result = validatePasswordStrength(password)
  return result.isValid
}
