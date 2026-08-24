/**
 * USDA API Client
 *
 * Purpose: Typed HTTP client for USDA FoodData Central API v2
 * Pattern: Class-based client with response type safety
 * Service: USDA FoodData Central (https://api.nal.usda.gov/fdc/v1/)
 * Rate Limit: 1,000 requests/hour (DEMO_KEY has 30 req/hr limit)
 *
 * Generated: 2025-11-15
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 * Reference: architecture.md lines 250-400 (USDA FoodData Central Integration)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { withRetry, describeError } from './http-retry';

/**
 * USDA API Response Types
 */

export interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  pageList: number[];
  foods: USDAFoodSearchResult[];
}

export interface USDAFoodSearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  gtinUpc?: string;
  brandOwner?: string;
  ingredients?: string;
  score: number;
}

export interface USDAFoodDetails {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate?: string;
  foodCategory?: {
    id: number;
    description: string;
  };
  foodNutrients: USDANutrient[];
  foodPortions?: USDAFoodPortion[];
  foodAttributes?: USDAFoodAttribute[];
}

export interface USDANutrient {
  nutrient: {
    id: number;
    number: string; // e.g., "203" for protein
    name: string;
    rank: number;
    unitName: string;
  };
  amount: number;
  dataPoints?: number;
  min?: number;
  max?: number;
  median?: number;
  footnote?: string;
}

export interface USDAFoodPortion {
  id: number;
  amount: number;
  modifier: string; // e.g., "cup", "tbsp", "serving"
  gramWeight: number;
  sequenceNumber: number;
}

export interface USDAFoodAttribute {
  id: number;
  name: string;
  value: string;
}

export interface USDABatchResponse {
  [fdcId: string]: USDAFoodDetails;
}

/**
 * Rate limit headers from USDA API
 */
export interface USDAApiRateLimitHeaders {
  limit?: number;
  remaining?: number;
  reset?: number;
}

/**
 * USDA API Client
 * Implements typed API client for USDA FoodData Central v2
 */
export class USDAClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://api.nal.usda.gov/fdc/v1';
  private lastRateLimitHeaders: USDAApiRateLimitHeaders = {};

  constructor() {
    this.apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor to capture rate limit headers
    this.client.interceptors.response.use(
      (response) => {
        // Parse X-RateLimit headers if present
        this.lastRateLimitHeaders = {
          limit: response.headers['x-ratelimit-limit']
            ? parseInt(response.headers['x-ratelimit-limit'], 10)
            : undefined,
          remaining: response.headers['x-ratelimit-remaining']
            ? parseInt(response.headers['x-ratelimit-remaining'], 10)
            : undefined,
          reset: response.headers['x-ratelimit-reset']
            ? parseInt(response.headers['x-ratelimit-reset'], 10)
            : undefined,
        };

        logger.debug(
          {
            service: 'usda-api',
            rateLimitHeaders: this.lastRateLimitHeaders,
          },
          'USDA API rate limit headers captured'
        );

        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    logger.info(
      {
        service: 'usda-api',
        baseURL: this.baseURL,
        apiKey: this.apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'CUSTOM_KEY',
      },
      'USDA API client initialized'
    );
  }

  /**
   * Get last captured rate limit headers from USDA API
   */
  getRateLimitHeaders(): USDAApiRateLimitHeaders {
    return { ...this.lastRateLimitHeaders };
  }

  /**
   * Search foods by query string
   *
   * @param query - Search query (e.g., "chicken breast")
   * @param pageSize - Results per page (default: 50, max: 200)
   * @param pageNumber - Page number (1-indexed)
   * @returns Search response with paginated results
   *
   * @example
   * const results = await usdaClient.searchFoods('apple', 50, 1);
   */
  async searchFoods(
    query: string,
    pageSize = 50,
    pageNumber = 1
  ): Promise<USDASearchResponse> {
    try {
      logger.debug(
        { service: 'usda-api', query, pageSize, pageNumber },
        'Searching foods via USDA API (POST with dataType filter)'
      );

      // Use POST endpoint with dataType filter for whole foods only
      const response = await this.client.post<USDASearchResponse>(
        '/foods/search',
        {
          query,
          dataType: ['Foundation', 'SR Legacy'], // Only whole/minimally processed foods
          pageSize: Math.min(pageSize, 200), // API max is 200
          pageNumber,
        },
        {
          params: {
            api_key: this.apiKey,
          },
        }
      );

      logger.info(
        {
          service: 'usda-api',
          query,
          dataTypes: ['Foundation', 'SR Legacy'],
          totalHits: response.data.totalHits,
          resultsReturned: response.data.foods?.length ?? 0,
        },
        'USDA food search completed'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'searchFoods');
      throw error;
    }
  }

  /**
   * Get detailed food information by FDC ID
   *
   * @param fdcId - USDA FoodData Central ID
   * @param format - Response format ('abridged' or 'full', default: 'full')
   * @returns Detailed food information with nutrients
   *
   * @example
   * const food = await usdaClient.getFoodDetails(123456);
   */
  async getFoodDetails(
    fdcId: number,
    format: 'abridged' | 'full' = 'full'
  ): Promise<USDAFoodDetails> {
    try {
      logger.debug(
        { service: 'usda-api', fdcId, format },
        'Fetching food details from USDA API'
      );

      // Retried: connection-level blips against api.nal.usda.gov dropped USDA entirely
      // for a food, with no HTTP response and no usable error. See http-retry.ts.
      const response = await withRetry(
        () =>
          this.client.get<USDAFoodDetails>(`/food/${fdcId}`, {
            params: {
              format,
              api_key: this.apiKey,
            },
          }),
        { label: `USDA getFoodDetails(${fdcId})` }
      );

      logger.info(
        {
          service: 'usda-api',
          fdcId,
          description: response.data.description,
          nutrientCount: response.data.foodNutrients?.length ?? 0,
        },
        'USDA food details fetched'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getFoodDetails');
      throw error;
    }
  }

  /**
   * Get nutrient values for a specific food
   *
   * @param fdcId - USDA FoodData Central ID
   * @returns Array of nutrients with amounts
   *
   * @example
   * const nutrients = await usdaClient.getNutrients(123456);
   */
  async getNutrients(fdcId: number): Promise<USDANutrient[]> {
    try {
      const foodDetails = await this.getFoodDetails(fdcId, 'full');
      return foodDetails.foodNutrients || [];
    } catch (error) {
      this.handleError(error, 'getNutrients');
      throw error;
    }
  }

  /**
   * Get multiple foods by FDC IDs (batch operation)
   *
   * @param fdcIds - Array of USDA FoodData Central IDs
   * @param format - Response format ('abridged' or 'full', default: 'full')
   * @returns Array of food details
   *
   * @example
   * const foods = await usdaClient.getFoodsBatch([123456, 789012]);
   */
  async getFoodsBatch(
    fdcIds: number[],
    format: 'abridged' | 'full' = 'full'
  ): Promise<USDAFoodDetails[]> {
    try {
      logger.debug(
        { service: 'usda-api', fdcIds, count: fdcIds.length, format },
        'Fetching foods batch from USDA API'
      );

      const response = await this.client.post<USDAFoodDetails[]>(
        '/foods',
        {
          fdcIds,
          format,
        },
        {
          params: {
            api_key: this.apiKey,
          },
        }
      );

      logger.info(
        {
          service: 'usda-api',
          requested: fdcIds.length,
          returned: response.data?.length ?? 0,
        },
        'USDA foods batch fetched'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getFoodsBatch');
      throw error;
    }
  }

  /**
   * Handle API errors with structured logging
   */
  private handleError(error: unknown, method: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      logger.error(
        {
          service: 'usda-api',
          method,
          status,
          statusText: axiosError.response?.statusText,
          data,
          message: axiosError.message,
          // Without these, a connection-level failure logs only `message: "Error"` and the
          // cause is unrecoverable after the fact. Keep every identifying field.
          code: (axiosError as any).code,
          errno: (axiosError as any).errno,
          syscall: (axiosError as any).syscall,
          address: (axiosError as any).address,
          description: describeError(axiosError),
          stack: axiosError.stack,
        },
        `USDA API error in ${method}: ${describeError(axiosError)}`
      );

      // Handle specific error codes
      if (status === 429) {
        logger.warn(
          {
            service: 'usda-api',
            rateLimitHeaders: this.lastRateLimitHeaders,
          },
          'USDA API rate limit exceeded'
        );
      } else if (status === 404) {
        logger.warn(
          {
            service: 'usda-api',
            method,
          },
          'USDA API resource not found'
        );
      }
    } else {
      logger.error(
        {
          service: 'usda-api',
          method,
          error: error instanceof Error ? error.message : String(error),
          description: describeError(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        `Unexpected error in ${method}: ${describeError(error)}`
      );
    }
  }
}

/**
 * Singleton USDA client instance
 */
export const usdaClient = new USDAClient();
