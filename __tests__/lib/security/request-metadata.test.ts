// Test Suite: Request Metadata Extraction
// Tests for lib/security/request-metadata.ts
// Generated: 2025-11-10

import {
  extractRequestMetadata,
  extractClientIP,
  extractUserAgent,
  anonymizeIP,
  isLocalhost,
  parseUserAgent,
  RequestMetadata
} from '@/lib/security/request-metadata';

describe('Request Metadata - extractRequestMetadata', () => {
  test('should extract IP from x-forwarded-for (first IP)', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.100');
    expect(metadata.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  });

  test('should fallback to x-real-ip if x-forwarded-for missing', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-real-ip': '192.168.1.200',
        'user-agent': 'Mozilla/5.0 Safari/537.36'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.200');
    expect(metadata.userAgent).toBe('Mozilla/5.0 Safari/537.36');
  });

  test('should return null for missing headers', () => {
    // Arrange
    const mockRequest = new Request('http://localhost');

    // Act
    const metadata = extractRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBeNull();
    expect(metadata.userAgent).toBeNull();
  });

  test('should trim whitespace from x-forwarded-for IP', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '  192.168.1.100  , 10.0.0.1',
        'user-agent': 'Test-Agent'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.100');
  });

  test('should handle x-forwarded-for with single IP', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.45',
        'user-agent': 'Test-Agent'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('203.0.113.45');
  });

  test('should prioritize x-forwarded-for over x-real-ip', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '192.168.1.200',
        'user-agent': 'Test-Agent'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);

    // Assert
    expect(metadata.ipAddress).toBe('192.168.1.100'); // x-forwarded-for wins
  });
});

describe('Request Metadata - extractClientIP', () => {
  test('should extract IP from x-forwarded-for', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.100, 10.0.0.1'
      }
    });

    // Act
    const ip = extractClientIP(mockRequest);

    // Assert
    expect(ip).toBe('192.168.1.100');
  });

  test('should fallback to x-real-ip', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'x-real-ip': '192.168.1.200'
      }
    });

    // Act
    const ip = extractClientIP(mockRequest);

    // Assert
    expect(ip).toBe('192.168.1.200');
  });

  test('should return null if no IP headers present', () => {
    // Arrange
    const mockRequest = new Request('http://localhost');

    // Act
    const ip = extractClientIP(mockRequest);

    // Assert
    expect(ip).toBeNull();
  });
});

describe('Request Metadata - extractUserAgent', () => {
  test('should extract user agent from headers', () => {
    // Arrange
    const mockRequest = new Request('http://localhost', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    });

    // Act
    const userAgent = extractUserAgent(mockRequest);

    // Assert
    expect(userAgent).toBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
  });

  test('should return null if user-agent header missing', () => {
    // Arrange
    const mockRequest = new Request('http://localhost');

    // Act
    const userAgent = extractUserAgent(mockRequest);

    // Assert
    expect(userAgent).toBeNull();
  });
});

describe('Request Metadata - anonymizeIP', () => {
  test('should anonymize IPv4 address (zero last octet)', () => {
    // Act
    const anonymized = anonymizeIP('192.168.1.100');

    // Assert
    expect(anonymized).toBe('192.168.1.0');
  });

  test('should anonymize different IPv4 addresses', () => {
    // Act & Assert
    expect(anonymizeIP('203.0.113.45')).toBe('203.0.113.0');
    expect(anonymizeIP('10.0.0.255')).toBe('10.0.0.0');
    expect(anonymizeIP('172.16.254.1')).toBe('172.16.254.0');
  });

  test('should anonymize IPv6 address (keep first 4 groups)', () => {
    // Act
    const anonymized = anonymizeIP('2001:db8:85a3:8d3:1319:8a2e:370:7348');

    // Assert
    expect(anonymized).toBe('2001:db8:85a3:8d3::');
  });

  test('should anonymize compressed IPv6 address', () => {
    // Act
    const anonymized = anonymizeIP('2001:db8::1');

    // Assert
    expect(anonymized).toBe('2001:db8::');
  });

  test('should return 0.0.0.0 for empty string', () => {
    // Act
    const anonymized = anonymizeIP('');

    // Assert
    expect(anonymized).toBe('0.0.0.0');
  });

  test('should return 0.0.0.0 for unknown format', () => {
    // Act
    const anonymized = anonymizeIP('not-an-ip');

    // Assert
    expect(anonymized).toBe('0.0.0.0');
  });

  test('should handle localhost IPv4', () => {
    // Act
    const anonymized = anonymizeIP('127.0.0.1');

    // Assert
    expect(anonymized).toBe('127.0.0.0');
  });

  test('should handle localhost IPv6', () => {
    // Act
    const anonymized = anonymizeIP('::1');

    // Assert
    expect(anonymized).toBe('::');
  });
});

describe('Request Metadata - isLocalhost', () => {
  test('should detect IPv4 localhost', () => {
    // Act & Assert
    expect(isLocalhost('127.0.0.1')).toBe(true);
  });

  test('should detect IPv6 localhost', () => {
    // Act & Assert
    expect(isLocalhost('::1')).toBe(true);
  });

  test('should detect localhost string', () => {
    // Act & Assert
    expect(isLocalhost('localhost')).toBe(true);
  });

  test('should detect IPv4-mapped IPv6 localhost', () => {
    // Act & Assert
    expect(isLocalhost('::ffff:127.0.0.1')).toBe(true);
  });

  test('should return false for public IPs', () => {
    // Act & Assert
    expect(isLocalhost('192.168.1.100')).toBe(false);
    expect(isLocalhost('203.0.113.45')).toBe(false);
    expect(isLocalhost('2001:db8::1')).toBe(false);
  });

  test('should return false for null IP', () => {
    // Act & Assert
    expect(isLocalhost(null)).toBe(false);
  });

  test('should return false for empty string', () => {
    // Act & Assert
    expect(isLocalhost('')).toBe(false);
  });
});

describe('Request Metadata - parseUserAgent', () => {
  test('should parse Chrome on Windows user agent', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.browser).toBe('Chrome');
    expect(parsed.os).toBe('Windows');
    expect(parsed.device).toBe('desktop');
  });

  test('should parse Firefox on macOS user agent', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.browser).toBe('Firefox');
    expect(parsed.os).toBe('macOS');
    expect(parsed.device).toBe('desktop');
  });

  test('should parse Safari on macOS user agent', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.browser).toBe('Safari');
    expect(parsed.os).toBe('macOS');
    expect(parsed.device).toBe('desktop');
  });

  test('should parse Edge user agent', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.browser).toBe('Edge');
    expect(parsed.os).toBe('Windows');
    expect(parsed.device).toBe('desktop');
  });

  test('should detect mobile device', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.os).toBe('iOS');
    expect(parsed.device).toBe('mobile');
  });

  test('should detect tablet device', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.device).toBe('tablet');
  });

  test('should detect Android OS', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.os).toBe('Android');
    expect(parsed.device).toBe('mobile');
  });

  test('should detect Linux OS', () => {
    // Arrange
    const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // Act
    const parsed = parseUserAgent(ua);

    // Assert
    expect(parsed.os).toBe('Linux');
    expect(parsed.device).toBe('desktop');
  });

  test('should return Unknown for null user agent', () => {
    // Act
    const parsed = parseUserAgent(null);

    // Assert
    expect(parsed.browser).toBe('Unknown');
    expect(parsed.os).toBe('Unknown');
    expect(parsed.device).toBe('desktop');
  });

  test('should return Unknown for empty user agent', () => {
    // Act
    const parsed = parseUserAgent('');

    // Assert
    expect(parsed.browser).toBe('Unknown');
    expect(parsed.os).toBe('Unknown');
    expect(parsed.device).toBe('desktop');
  });

  test('should return Unknown for unrecognized user agent', () => {
    // Act
    const parsed = parseUserAgent('CustomBot/1.0');

    // Assert
    expect(parsed.browser).toBe('Unknown');
    expect(parsed.os).toBe('Unknown');
    expect(parsed.device).toBe('desktop');
  });
});

describe('Request Metadata - Integration Scenarios', () => {
  test('should extract full metadata from typical request', () => {
    // Arrange
    const mockRequest = new Request('http://localhost/api/profile', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '203.0.113.45, 10.0.0.1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);
    const parsed = parseUserAgent(metadata.userAgent);
    const anonymized = anonymizeIP(metadata.ipAddress!);
    const isLocal = isLocalhost(metadata.ipAddress);

    // Assert
    expect(metadata.ipAddress).toBe('203.0.113.45');
    expect(parsed.browser).toBe('Chrome');
    expect(parsed.os).toBe('Windows');
    expect(anonymized).toBe('203.0.113.0');
    expect(isLocal).toBe(false);
  });

  test('should handle localhost development request', () => {
    // Arrange
    const mockRequest = new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'PostmanRuntime/7.32.0'
      }
    });

    // Act
    const metadata = extractRequestMetadata(mockRequest);
    const isLocal = isLocalhost(metadata.ipAddress);

    // Assert
    expect(metadata.ipAddress).toBe('127.0.0.1');
    expect(isLocal).toBe(true);
  });
});
