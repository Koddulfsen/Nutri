// Request Metadata Helper - FS-4 Security & Compliance System
// Created: 2025-11-10
// Purpose: Extract IP address and user agent from requests for audit logging

/**
 * Request Metadata Interface
 * IP address and user agent for audit trail
 */
export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Extract Request Metadata
 *
 * Extracts IP address and user agent from Next.js Request headers
 * for audit logging and security tracking.
 *
 * IP Address Extraction Priority:
 * 1. x-forwarded-for (first IP in chain, handles proxies)
 * 2. x-real-ip (direct IP)
 * 3. null (if no headers present)
 *
 * @param request - Next.js Request object
 * @returns RequestMetadata with ipAddress and userAgent
 *
 * @example
 * // In API route
 * export async function POST(request: Request) {
 *   const metadata = extractRequestMetadata(request);
 *   await logAudit({
 *     userId: session.user.id,
 *     action: 'LOGIN',
 *     resourceType: 'user_session',
 *     ...metadata
 *   });
 * }
 */
export function extractRequestMetadata(request: Request): RequestMetadata {
  // Extract IP address
  let ipAddress: string | null = null;

  // Try x-forwarded-for (proxy/load balancer header)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list (client, proxy1, proxy2)
    // First IP is the original client
    ipAddress = forwardedFor.split(',')[0]?.trim() || null;
  }

  // Fallback to x-real-ip
  if (!ipAddress) {
    ipAddress = request.headers.get('x-real-ip') || null;
  }

  // Extract user agent
  const userAgent = request.headers.get('user-agent') || null;

  return {
    ipAddress,
    userAgent
  };
}

/**
 * Extract Client IP (Simple)
 *
 * Simplified version that only returns IP address.
 * Useful when user agent is not needed.
 *
 * @param request - Next.js Request object
 * @returns IP address string or null
 *
 * @example
 * const ip = extractClientIP(request);
 * await checkRateLimit(ip, rateLimiters.auth);
 */
export function extractClientIP(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip') || null;
}

/**
 * Extract User Agent
 *
 * Simplified version that only returns user agent.
 * Useful for analytics or device detection.
 *
 * @param request - Next.js Request object
 * @returns User agent string or null
 *
 * @example
 * const userAgent = extractUserAgent(request);
 * if (userAgent?.includes('Mobile')) {
 *   // Mobile-specific handling
 * }
 */
export function extractUserAgent(request: Request): string | null {
  return request.headers.get('user-agent') || null;
}

/**
 * Anonymize IP Address
 *
 * Anonymizes IP address for GDPR compliance by removing last octet.
 * Used when storing analytics data that doesn't require full IP.
 *
 * IPv4: 192.168.1.100 → 192.168.1.0
 * IPv6: 2001:db8::1 → 2001:db8::
 *
 * @param ipAddress - Full IP address
 * @returns Anonymized IP address
 *
 * @example
 * const anonymized = anonymizeIP('192.168.1.100');
 * // Save for analytics: 192.168.1.0
 */
export function anonymizeIP(ipAddress: string): string {
  if (!ipAddress) return '0.0.0.0';

  // IPv4
  if (ipAddress.includes('.')) {
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }

  // IPv6
  if (ipAddress.includes(':')) {
    const parts = ipAddress.split(':');
    if (parts.length > 0) {
      // Keep first 4 groups, zero out rest
      const anonymized = parts.slice(0, 4).join(':');
      return `${anonymized}::`;
    }
  }

  // Unknown format
  return '0.0.0.0';
}

/**
 * Is Localhost
 *
 * Checks if IP address is localhost (development/testing).
 * Useful for skipping rate limiting in local development.
 *
 * @param ipAddress - IP address to check
 * @returns True if localhost
 *
 * @example
 * if (!isLocalhost(ip)) {
 *   await checkRateLimit(ip, rateLimiters.auth);
 * }
 */
export function isLocalhost(ipAddress: string | null): boolean {
  if (!ipAddress) return false;

  const localhostIPs = [
    '127.0.0.1',
    '::1',
    'localhost',
    '::ffff:127.0.0.1' // IPv4-mapped IPv6
  ];

  return localhostIPs.includes(ipAddress);
}

/**
 * Parse User Agent
 *
 * Extracts browser and OS information from user agent string.
 * Useful for analytics and device-specific features.
 *
 * @param userAgent - User agent string
 * @returns Object with browser, os, device info
 *
 * @example
 * const info = parseUserAgent(request.headers.get('user-agent'));
 * // { browser: 'Chrome', os: 'macOS', device: 'desktop' }
 */
export function parseUserAgent(userAgent: string | null): {
  browser: string;
  os: string;
  device: 'mobile' | 'tablet' | 'desktop';
} {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', device: 'desktop' };
  }

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';

  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Detect device
  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (userAgent.includes('Mobile')) device = 'mobile';
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'tablet';

  return { browser, os, device };
}
