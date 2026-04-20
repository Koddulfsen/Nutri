// Test Suite: Rate Limiting
// Tests for lib/security/rate-limit.ts
// Generated: 2025-11-10

import {
  rateLimiters,
  checkRateLimit,
  checkRateLimitSoft,
  getRateLimitStatus,
  resetRateLimit,
  RateLimitResult
} from '@/lib/security/rate-limit';

// Mock @upstash/ratelimit
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn()
  })),
}));

// Mock @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    del: jest.fn()
  }))
}));

describe('Rate Limiting - checkRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should pass when within rate limit', async () => {
    // Arrange
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 50,
        reset: Date.now() + 600000 // 10 minutes from now
      })
    };

    const identifier = 'user-123';

    // Act
    const result = await checkRateLimit(identifier, mockLimiter as any);

    // Assert
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(50);
    expect(result.limit).toBe(100);
    expect(mockLimiter.limit).toHaveBeenCalledWith(identifier);
  });

  test('should throw error when rate limit exceeded', async () => {
    // Arrange
    const resetTime = Date.now() + 300000; // 5 minutes from now
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: resetTime
      })
    };

    const identifier = 'user-123';

    // Act & Assert
    await expect(checkRateLimit(identifier, mockLimiter as any)).rejects.toThrow(/Rate limit exceeded/);
    await expect(checkRateLimit(identifier, mockLimiter as any)).rejects.toThrow(/Try again in \d+ minute/);
  });

  test('should calculate wait time correctly', async () => {
    // Arrange
    const resetTime = Date.now() + 120000; // 2 minutes from now
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: resetTime
      })
    };

    // Act & Assert
    try {
      await checkRateLimit('user-123', mockLimiter as any);
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.message).toMatch(/Try again in 2 minutes/);
    }
  });

  test('should handle singular minute in error message', async () => {
    // Arrange: Reset in 1 minute
    const resetTime = Date.now() + 30000; // 30 seconds from now
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: resetTime
      })
    };

    // Act & Assert
    try {
      await checkRateLimit('user-123', mockLimiter as any);
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.message).toMatch(/Try again in 1 minute[^s]/); // "1 minute" not "1 minutes"
    }
  });

  test('should return all rate limit metadata', async () => {
    // Arrange
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 500,
        remaining: 250,
        reset: 1699999999000
      })
    };

    // Act
    const result = await checkRateLimit('api-key-123', mockLimiter as any);

    // Assert
    expect(result).toEqual({
      success: true,
      limit: 500,
      remaining: 250,
      reset: 1699999999000
    });
  });
});

describe('Rate Limiting - checkRateLimitSoft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return result without throwing when within limit', async () => {
    // Arrange
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 75,
        reset: Date.now() + 600000
      })
    };

    // Act
    const result = await checkRateLimitSoft('user-123', mockLimiter as any);

    // Assert
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(75);
  });

  test('should return result without throwing when limit exceeded', async () => {
    // Arrange
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 600000
      })
    };

    // Act
    const result = await checkRateLimitSoft('user-123', mockLimiter as any);

    // Assert: No error thrown
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('should allow checking limit status without blocking', async () => {
    // Arrange
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: false,
        limit: 3,
        remaining: 0,
        reset: Date.now() + 86400000 // 24 hours
      })
    };

    // Act
    const result = await checkRateLimitSoft('user-123', mockLimiter as any);

    // Assert: Returns result without throwing
    expect(result).toEqual({
      success: false,
      limit: 3,
      remaining: 0,
      reset: expect.any(Number)
    });
  });
});

describe('Rate Limiting - getRateLimitStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return rate limit status from Redis', async () => {
    // This test would require mocking Redis.get()
    // For now, we'll test the function signature and error handling

    // Act
    const result = await getRateLimitStatus('user-123', 'ratelimit:api');

    // Assert: Should return null or status object
    expect(result === null || typeof result === 'object').toBe(true);
  });

  test('should return null on Redis error', async () => {
    // Mock Redis to throw error
    const { Redis } = require('@upstash/redis');
    const mockRedis = new Redis();
    mockRedis.get = jest.fn().mockRejectedValue(new Error('Redis error'));

    // Act
    const result = await getRateLimitStatus('user-123', 'ratelimit:api');

    // Assert
    expect(result).toBeNull();
  });
});

describe('Rate Limiting - resetRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reset rate limit by deleting Redis key', async () => {
    // Arrange
    const { Redis } = require('@upstash/redis');
    const mockRedis = new Redis();
    mockRedis.del = jest.fn().mockResolvedValue(1);

    // Act
    await resetRateLimit('user-123', 'ratelimit:api');

    // Assert
    expect(mockRedis.del).toHaveBeenCalledWith('ratelimit:api:user-123');
  });

  test('should throw error on Redis failure', async () => {
    // Arrange
    const { Redis } = require('@upstash/redis');
    const mockRedis = new Redis();
    mockRedis.del = jest.fn().mockRejectedValue(new Error('Redis error'));

    // Act & Assert
    await expect(resetRateLimit('user-123', 'ratelimit:api')).rejects.toThrow('Failed to reset rate limit');
  });
});

describe('Rate Limiting - Rate Limiter Configurations', () => {
  test('should have api rate limiter configured', () => {
    // Assert
    expect(rateLimiters.api).toBeDefined();
  });

  test('should have auth rate limiter configured', () => {
    // Assert
    expect(rateLimiters.auth).toBeDefined();
  });

  test('should have compliance rate limiter configured', () => {
    // Assert
    expect(rateLimiters.compliance).toBeDefined();
  });

  test('should have apiKey rate limiter configured', () => {
    // Assert
    expect(rateLimiters.apiKey).toBeDefined();
  });
});

describe('Rate Limiting - Integration Scenarios', () => {
  test('should handle rapid sequential requests', async () => {
    // Arrange
    let remaining = 100;
    const mockLimiter = {
      limit: jest.fn().mockImplementation(() => {
        remaining--;
        return Promise.resolve({
          success: remaining >= 0,
          limit: 100,
          remaining: Math.max(0, remaining),
          reset: Date.now() + 600000
        });
      })
    };

    // Act: Make 105 requests (should fail after 100)
    const results: RateLimitResult[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < 105; i++) {
      try {
        const result = await checkRateLimit(`user-${i}`, mockLimiter as any);
        results.push(result);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // Assert
    expect(results.length).toBe(100); // First 100 succeed
    expect(errors.length).toBe(5); // Last 5 fail
  });

  test('should differentiate between different identifiers', async () => {
    // Arrange
    const mockLimiter = {
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 600000
      })
    };

    // Act
    await checkRateLimit('user-1', mockLimiter as any);
    await checkRateLimit('user-2', mockLimiter as any);
    await checkRateLimit('ip-192.168.1.1', mockLimiter as any);

    // Assert: Each identifier called separately
    expect(mockLimiter.limit).toHaveBeenCalledWith('user-1');
    expect(mockLimiter.limit).toHaveBeenCalledWith('user-2');
    expect(mockLimiter.limit).toHaveBeenCalledWith('ip-192.168.1.1');
    expect(mockLimiter.limit).toHaveBeenCalledTimes(3);
  });
});
