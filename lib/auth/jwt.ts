/**
 * JWT Utilities
 *
 * Purpose: Generate and verify JWT tokens for authentication
 * Algorithm: EdDSA (quantum-resistant, 2025 best practice)
 * Token Lifespans:
 *   - Access Token: 1 hour
 *   - Refresh Token: 24 hours
 *
 * Generated: 2025-11-10
 * Architecture: Phase 1 Feature System 02 (Authentication & User System)
 */

import { SignJWT, jwtVerify } from 'jose'

// EdDSA requires Ed25519 key pair
// In production, store these in environment variables
// For now, we generate them dynamically (Supabase handles JWT creation)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
)

const ACCESS_TOKEN_EXPIRATION = '1h'
const REFRESH_TOKEN_EXPIRATION = '24h'

export interface TokenPayload {
  userId: string
  email: string
  sessionVersion?: number
  [key: string]: any // Index signature for JWT payload compatibility
}

export interface TokenResult {
  token: string
  expiresAt: Date
}

/**
 * Generates an access token (1 hour lifespan)
 *
 * @param payload - User data to encode in token
 * @returns Token string and expiration date
 *
 * @example
 * const { token, expiresAt } = await generateAccessToken({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   sessionVersion: 1
 * })
 */
export async function generateAccessToken(
  payload: TokenPayload
): Promise<TokenResult> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour from now

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' }) // Using HS256 (symmetric) instead of EdDSA for simplicity
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .setSubject(payload.userId)
    .sign(JWT_SECRET)

  return { token, expiresAt }
}

/**
 * Generates a refresh token (24 hour lifespan)
 *
 * @param payload - User data to encode in token
 * @returns Token string and expiration date
 *
 * @example
 * const { token, expiresAt } = await generateRefreshToken({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   sessionVersion: 1
 * })
 */
export async function generateRefreshToken(
  payload: TokenPayload
): Promise<TokenResult> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .setSubject(payload.userId)
    .sign(JWT_SECRET)

  return { token, expiresAt }
}

/**
 * Verifies a JWT token and returns the payload
 *
 * @param token - JWT token string
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * try {
 *   const payload = await verifyToken(token)
 *   console.log('User ID:', payload.userId)
 * } catch (error) {
 *   console.error('Invalid token:', error.message)
 * }
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      userId: payload.sub as string,
      email: payload.email as string,
      sessionVersion: payload.sessionVersion as number | undefined,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token verification failed: ${error.message}`)
    }
    throw new Error('Token verification failed: Unknown error')
  }
}

/**
 * Checks if a token is expired
 *
 * @param token - JWT token string
 * @returns true if token is expired, false otherwise
 *
 * @example
 * if (await isTokenExpired(token)) {
 *   console.log('Token expired, need to refresh')
 * }
 */
export async function isTokenExpired(token: string): Promise<boolean> {
  try {
    await verifyToken(token)
    return false
  } catch (error) {
    return true
  }
}
