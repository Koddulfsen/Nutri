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
 * Truncates an IP address to reduce its identifying power before storage.
 *
 * IMPORTANT — this is PSEUDONYMISATION, not anonymisation. Under GDPR, truncated
 * IPs remain personal data: the subject may still be identifiable by reasonable
 * means (e.g. correlating with other records we hold). Truncated IPs therefore
 * still need a lawful basis, a retention limit, and inclusion in data exports and
 * erasure. The name `anonymizeIP` is kept for compatibility, but do not read it
 * as "this data is now outside GDPR" — it isn't.
 *
 *   IPv4: 192.168.1.100  → 192.168.1.0        (drops the host octet, keeps /24)
 *   IPv6: 2001:db8::1    → 2001:0db8:0000::   (keeps /48, zeroes the rest)
 *   IPv6: ::1            → 0000:0000:0000::
 *
 * The previous implementation split on ':' without expanding compressed notation,
 * so '::1' produced '::1::' — malformed, AND it retained the very value it was
 * meant to remove. See docs/AUDIT-2026-08-11.md (P9).
 *
 * @param ipAddress - Full IP address
 * @returns Truncated IP, or '0.0.0.0' when the input cannot be parsed
 */
export function anonymizeIP(ipAddress: string): string {
  if (!ipAddress) return '0.0.0.0';

  const ip = ipAddress.trim();

  // IPv4-mapped IPv6 (::ffff:192.168.1.100) — treat as the IPv4 address it carries
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  const candidate = mapped ? mapped[1] : ip;

  // IPv4 — keep the /24, zero the host octet
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(candidate)) {
    const parts = candidate.split('.');
    if (parts.every((p) => Number(p) >= 0 && Number(p) <= 255)) {
      parts[3] = '0';
      return parts.join('.');
    }
    return '0.0.0.0';
  }

  // IPv6 — expand '::' to its full 8 groups before truncating, otherwise the
  // group positions are meaningless.
  if (candidate.includes(':')) {
    const halves = candidate.split('::');
    if (halves.length > 2) return '0.0.0.0'; // '::' may appear at most once

    const head = halves[0] ? halves[0].split(':').filter(Boolean) : [];
    const tail = halves.length === 2 && halves[1] ? halves[1].split(':').filter(Boolean) : [];

    let groups: string[];
    if (halves.length === 2) {
      const missing = 8 - head.length - tail.length;
      if (missing < 0) return '0.0.0.0';
      groups = [...head, ...Array(missing).fill('0'), ...tail];
    } else {
      groups = head;
    }
    if (groups.length !== 8) return '0.0.0.0';
    if (!groups.every((g) => /^[0-9a-f]{1,4}$/i.test(g))) return '0.0.0.0';

    // Keep the first 3 groups (/48) — the common network-level truncation — and
    // drop the remaining 80 bits entirely.
    const kept = groups.slice(0, 3).map((g) => g.padStart(4, '0'));
    return `${kept.join(':')}::`;
  }

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
