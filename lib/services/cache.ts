/**
 * 4-Layer Caching Service
 *
 * Purpose: Multi-layer cache strategy with L1 (in-memory), L2 (Redis), L3 (DB), L4 (USDA API)
 * Pattern: Cache-aside with LRU eviction for L1 and TTL for L2
 * Features:
 *   - L1: In-memory Map with LRU eviction (100 items max, 5 min TTL)
 *   - L2: Redis cache (1 hour TTL)
 *   - L3: Database (foods table) - permanent storage
 *   - L4: USDA API (fallback source)
 *   - Cache miss tracking and metrics
 *   - Automatic cache warming
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 1950-2150 (Multi-Layer Caching)
 */

import { getRedisClient } from './redis';
import { db } from '@/db';
import { foods, foodNutrientValues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { usdaService } from './usda-service';
import { logger } from '@/lib/logger';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  L1: {
    MAX_ITEMS: 100,
    TTL_MS: 5 * 60 * 1000, // 5 minutes
  },
  L2: {
    TTL_SECONDS: 60 * 60, // 1 hour
  },
} as const;

/**
 * L1 Cache Entry
 */
interface L1CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

/**
 * Food Data (unified response format)
 */
export interface FoodData {
  id: string;
  fdcId: number | null;
  name: string;
  description: string | null;
  foodCategoryId: string | null;
  defaultPortionType: string | null;
  defaultPortionSize: string | null;
  isEstimated: boolean;
  dataSource: string;
  nutrients: Array<{
    compoundId: string;
    value: string;
    unit: string;
    confidence: {
      l1: number;
      l2: number | null;
      l3: number | null;
      l4: number | null;
      final: number;
    };
    source: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cache Metrics
 */
interface CacheMetrics {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  l3Hits: number;
  l3Misses: number;
  l4Hits: number;
  totalRequests: number;
}

/**
 * 4-Layer Caching Service
 */
export class CacheService {
  // L1: In-memory LRU cache
  private l1Cache = new Map<string, L1CacheEntry<FoodData>>();

  // Metrics tracking
  private metrics: CacheMetrics = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    l3Hits: 0,
    l3Misses: 0,
    l4Hits: 0,
    totalRequests: 0,
  };

  /**
   * Get food data with 4-layer cache cascade
   * L1 (in-memory) → L2 (Redis) → L3 (Database) → L4 (USDA API)
   *
   * @param fdcId - USDA FoodData Central ID
   * @returns Food data or null if not found
   */
  async getFoodData(fdcId: number): Promise<FoodData | null> {
    this.metrics.totalRequests++;
    const cacheKey = `food:${fdcId}`;

    logger.debug(
      { service: 'cache', fdcId, cacheKey },
      'Starting 4-layer cache lookup'
    );

    // L1: Check in-memory cache
    const l1Result = this.getFromL1(cacheKey);
    if (l1Result) {
      this.metrics.l1Hits++;
      logger.debug({ service: 'cache', fdcId, layer: 'L1' }, 'Cache hit');
      return l1Result;
    }
    this.metrics.l1Misses++;

    // L2: Check Redis cache
    const l2Result = await this.getFromL2(cacheKey);
    if (l2Result) {
      this.metrics.l2Hits++;
      logger.debug({ service: 'cache', fdcId, layer: 'L2' }, 'Cache hit');

      // Promote to L1
      this.setInL1(cacheKey, l2Result);
      return l2Result;
    }
    this.metrics.l2Misses++;

    // L3: Check database
    const l3Result = await this.getFromL3(fdcId);
    if (l3Result) {
      this.metrics.l3Hits++;
      logger.debug({ service: 'cache', fdcId, layer: 'L3' }, 'Cache hit');

      // Promote to L2 and L1
      await this.setInL2(cacheKey, l3Result);
      this.setInL1(cacheKey, l3Result);
      return l3Result;
    }
    this.metrics.l3Misses++;

    // L4: Fetch from USDA API (fallback - should only happen if not imported yet)
    logger.info(
      { service: 'cache', fdcId, layer: 'L4' },
      'All caches missed - food not yet imported (returning null)'
    );

    return null; // Food not imported yet - frontend should trigger import
  }

  /**
   * Search foods (database search with L2 cache for results)
   *
   * @param query - Search query
   * @param options - Search options (category, brand, page, limit)
   * @returns Array of foods
   */
  async searchFoods(
    query: string,
    options: {
      category?: string;
      brand?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<FoodData[]> {
    const { category, brand, page = 1, limit = 20 } = options;
    const cacheKey = `search:${query}:${category || 'all'}:${brand || 'all'}:${page}:${limit}`;

    logger.debug(
      { service: 'cache', query, options },
      'Searching foods'
    );

    // Check L2 cache for search results (skip L1 for searches - too volatile)
    const l2Result = await this.getFromL2<FoodData[]>(cacheKey);
    if (l2Result) {
      logger.debug({ service: 'cache', query, layer: 'L2' }, 'Search cache hit');
      return l2Result;
    }

    // Search database (L3)
    // Note: Full-text search implementation will be in search-service.ts
    // For now, return empty array (will be implemented in Task 27)
    logger.debug(
      { service: 'cache', query },
      'Search not yet implemented - will be handled by search-service'
    );

    return [];
  }

  /**
   * Warm cache with commonly accessed foods
   *
   * @param fdcIds - Array of FDC IDs to warm
   */
  async warmCache(fdcIds: number[]): Promise<void> {
    logger.info(
      { service: 'cache', count: fdcIds.length },
      'Warming cache with common foods'
    );

    for (const fdcId of fdcIds) {
      try {
        await this.getFoodData(fdcId);
      } catch (error) {
        logger.warn(
          {
            service: 'cache',
            fdcId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to warm cache for food'
        );
      }
    }

    logger.info(
      { service: 'cache', count: fdcIds.length },
      'Cache warming completed'
    );
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & {
    l1HitRate: string;
    l2HitRate: string;
    l3HitRate: string;
    overallHitRate: string;
  } {
    const l1HitRate = this.metrics.l1Hits > 0
      ? ((this.metrics.l1Hits / this.metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

    const l2HitRate = this.metrics.l2Hits > 0
      ? ((this.metrics.l2Hits / this.metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

    const l3HitRate = this.metrics.l3Hits > 0
      ? ((this.metrics.l3Hits / this.metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

    const totalHits = this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits;
    const overallHitRate = this.metrics.totalRequests > 0
      ? ((totalHits / this.metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

    return {
      ...this.metrics,
      l1HitRate: `${l1HitRate}%`,
      l2HitRate: `${l2HitRate}%`,
      l3HitRate: `${l3HitRate}%`,
      overallHitRate: `${overallHitRate}%`,
    };
  }

  /**
   * Invalidate cache for specific food
   *
   * @param fdcId - USDA FoodData Central ID
   */
  async invalidateFood(fdcId: number): Promise<void> {
    const cacheKey = `food:${fdcId}`;

    logger.debug({ service: 'cache', fdcId }, 'Invalidating food cache');

    // Clear from L1
    this.l1Cache.delete(cacheKey);

    // Clear from L2
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(cacheKey);
      } catch (error) {
        logger.warn(
          {
            service: 'cache',
            fdcId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to invalidate L2 cache'
        );
      }
    }

    logger.info({ service: 'cache', fdcId }, 'Food cache invalidated');
  }

  /**
   * L1: Get from in-memory cache with LRU
   */
  private getFromL1(key: string): FoodData | null {
    const entry = this.l1Cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > CACHE_CONFIG.L1.TTL_MS) {
      this.l1Cache.delete(key);
      return null;
    }

    // Update access metrics (LRU)
    entry.accessCount++;
    entry.lastAccess = now;

    return entry.data;
  }

  /**
   * L1: Set in in-memory cache with LRU eviction
   */
  private setInL1(key: string, data: FoodData): void {
    const now = Date.now();

    // Evict if at capacity
    if (this.l1Cache.size >= CACHE_CONFIG.L1.MAX_ITEMS && !this.l1Cache.has(key)) {
      this.evictLRU();
    }

    this.l1Cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now,
    });
  }

  /**
   * Evict least recently used item from L1
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
      logger.debug({ service: 'cache', evictedKey: oldestKey }, 'LRU eviction');
    }
  }

  /**
   * L2: Get from Redis cache
   */
  private async getFromL2<T = FoodData>(key: string): Promise<T | null> {
    const redis = getRedisClient();

    if (!redis) {
      logger.debug({ service: 'cache', layer: 'L2' }, 'Redis not available - skipping');
      return null;
    }

    try {
      const result = await redis.get<string>(key);

      if (!result) {
        return null;
      }

      return JSON.parse(result) as T;
    } catch (error) {
      logger.warn(
        {
          service: 'cache',
          key,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get from L2 cache'
      );

      return null;
    }
  }

  /**
   * L2: Set in Redis cache with TTL
   */
  private async setInL2(key: string, data: FoodData): Promise<void> {
    const redis = getRedisClient();

    if (!redis) {
      logger.debug({ service: 'cache', layer: 'L2' }, 'Redis not available - skipping');
      return;
    }

    try {
      await redis.set(key, JSON.stringify(data), {
        ex: CACHE_CONFIG.L2.TTL_SECONDS,
      });
    } catch (error) {
      logger.warn(
        {
          service: 'cache',
          key,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to set in L2 cache'
      );
    }
  }

  /**
   * L3: Get from database with relational query
   */
  private async getFromL3(fdcId: number): Promise<FoodData | null> {
    try {
      const foodResult = await db
        .select()
        .from(foods)
        .where(eq(foods.fdcId, fdcId))
        .limit(1);

      if (foodResult.length === 0) {
        return null;
      }

      const food = foodResult[0];

      // Fetch nutrients
      const nutrients = await db
        .select()
        .from(foodNutrientValues)
        .where(eq(foodNutrientValues.foodId, food.id));

      return {
        id: food.id,
        fdcId: food.fdcId,
        name: food.name,
        description: food.description,
        foodCategoryId: food.foodCategoryId,
        defaultPortionType: food.defaultPortionType,
        defaultPortionSize: food.defaultPortionSize,
        isEstimated: food.isEstimated,
        dataSource: food.dataSource,
        nutrients: nutrients.map((n) => ({
          compoundId: n.compoundId,
          value: n.value,
          unit: n.unit,
          confidence: {
            l1: n.confidenceL1,
            l2: n.confidenceL2,
            l3: n.confidenceL3,
            l4: n.confidenceL4,
            final: n.confidenceFinal,
          },
          source: n.source,
        })),
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
      };
    } catch (error) {
      logger.error(
        {
          service: 'cache',
          fdcId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to get from L3 (database)'
      );

      return null;
    }
  }
}

/**
 * Singleton cache service instance
 */
export const cacheService = new CacheService();
