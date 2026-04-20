/**
 * CNF (Canadian Nutrient File) API Client
 *
 * Purpose: Typed HTTP client for Health Canada's CNF API
 * Pattern: Class-based client with response type safety
 * Service: Canadian Nutrient File (https://food-nutrition.canada.ca/api/canadian-nutrient-file/)
 *
 * Features:
 * - Full database retrieval (undocumented feature)
 * - Client-side search filtering
 * - Bilingual support (English/French)
 * - Per-100g nutrient data
 *
 * Generated: 2025-11-18
 * Architecture: Phase 2 Feature System 01 (Multi-Source Data Integration)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/lib/logger';

/**
 * CNF API Response Types
 */

export interface CNFFoodListItem {
  food_code: number;
  food_description: string;
}

export interface CNFNutrientAmount {
  food_code: number;
  nutrient_value: number;
  standard_error: number;
  number_observation: number;
  nutrient_name_id: number;
  nutrient_web_name: string;
  nutrient_source_id: number;
}

export interface CNFServingSize {
  food_code: number;
  conversion_factor_value: number;
  measure_name: string;
}

/**
 * Internal search result format
 */
export interface CNFSearchResult {
  foodCode: number;
  name: string;
  relevanceScore: number;
}

/**
 * CNF API Client
 * Implements typed API client for Canadian Nutrient File
 */
export class CNFClient {
  private client: AxiosInstance;
  private baseURL = 'https://food-nutrition.canada.ca/api/canadian-nutrient-file';
  private foodsCache: CNFFoodListItem[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'application/json',
      },
    });

    logger.info(
      {
        service: 'cnf-api',
        baseURL: this.baseURL,
      },
      'CNF API client initialized'
    );
  }

  /**
   * Get all foods from CNF database (undocumented feature)
   * Returns entire database when no ID provided
   *
   * @returns Array of all foods in database
   */
  async getAllFoods(): Promise<CNFFoodListItem[]> {
    // Check cache first
    if (this.foodsCache && this.cacheTimestamp) {
      const age = Date.now() - this.cacheTimestamp;
      if (age < this.CACHE_TTL) {
        logger.debug(
          { service: 'cnf-api', cacheAge: age },
          'Returning cached CNF foods list'
        );
        return this.foodsCache;
      }
    }

    try {
      logger.debug(
        { service: 'cnf-api' },
        'Fetching all foods from CNF API'
      );

      // Undocumented feature: no ID = full list
      const response = await this.client.get<CNFFoodListItem[]>('/food/', {
        params: {
          lang: 'en',
          type: 'json',
        },
      });

      this.foodsCache = response.data;
      this.cacheTimestamp = Date.now();

      logger.info(
        {
          service: 'cnf-api',
          foodCount: response.data.length,
        },
        'CNF foods list fetched and cached'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getAllFoods');
      throw error;
    }
  }

  /**
   * Search foods by query string (client-side filtering)
   *
   * Uses token-based matching with word boundaries (no partial matches like "salmonberry" for "salmon")
   * Algorithm: Exponential + Average + Combined bonuses
   *   - Tokenize by common delimiters (comma, space, hyphen, etc.)
   *   - Match exact tokens only (word boundary matching)
   *   - Score by: matchRatio × (positionScore + bonuses)
   *   - Position uses exponential decay on average token position
   *   - Bonuses for first-token match and consecutive tokens
   *
   * @param query - Search query (e.g., "chicken breast")
   * @param limit - Maximum results to return (default: 50)
   * @returns Array of matching foods with relevance scores
   */
  async searchFoods(query: string, limit = 50): Promise<CNFSearchResult[]> {
    try {
      logger.debug(
        { service: 'cnf-api', query, limit },
        'Searching CNF foods (token-based)'
      );

      // Get all foods (from cache if available)
      const allFoods = await this.getAllFoods();

      // Tokenize query (split by spaces)
      const queryTokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);

      if (queryTokens.length === 0) {
        return [];
      }

      // Common delimiters for food databases
      const DELIMITERS = /[,\s\-\(\):;\/]+/;

      // Simple plural normalization (handles most English food words)
      const normalize = (word: string): string => {
        if (word.endsWith('ies')) return word.slice(0, -3) + 'y'; // berries → berry
        if (word.endsWith('es') && word.length > 3) return word.slice(0, -2); // tomatoes → tomato
        if (word.endsWith('s') && word.length > 2) return word.slice(0, -1); // eggs → egg
        return word;
      };

      // Normalize query tokens for plural matching
      const normalizedQueryTokens = queryTokens.map(normalize);

      // Filter and score results
      const results = allFoods
        .map((food) => {
          // Tokenize food description
          const foodTokens = food.food_description
            .toLowerCase()
            .split(DELIMITERS)
            .map(t => t.trim())
            .filter(t => t.length > 1);

          if (foodTokens.length === 0) {
            return { foodCode: food.food_code, name: food.food_description, relevanceScore: 0 };
          }

          // Normalize food tokens for plural matching
          const normalizedFoodTokens = foodTokens.map(normalize);

          // Find exact token matches (word boundary matching with plural normalization)
          const matchPositions: number[] = [];
          for (const nqt of normalizedQueryTokens) {
            const idx = normalizedFoodTokens.findIndex(nft => nft === nqt);
            if (idx >= 0) matchPositions.push(idx);
          }

          // No matches = no score
          if (matchPositions.length === 0) {
            return { foodCode: food.food_code, name: food.food_description, relevanceScore: 0 };
          }

          // Match ratio: what % of query tokens were found
          const matchRatio = matchPositions.length / queryTokens.length;

          // Position score: exponential decay on average position
          // Earlier tokens = higher score
          const avgPosition = matchPositions.reduce((a, b) => a + b, 0) / matchPositions.length;
          const positionScore = 1 / (1 + avgPosition);

          // Bonuses
          let bonus = 0;

          // First token bonus: query matches the primary food
          if (matchPositions.includes(0)) {
            bonus += 0.25;
          }

          // Consecutive tokens bonus: query tokens appear consecutively
          if (matchPositions.length >= 2) {
            const sorted = [...matchPositions].sort((a, b) => a - b);
            let consecutive = true;
            for (let i = 1; i < sorted.length; i++) {
              if (sorted[i] !== sorted[i - 1] + 1) {
                consecutive = false;
                break;
              }
            }
            if (consecutive) bonus += 0.15;
          }

          // Final score
          const score = Math.round(matchRatio * (positionScore + bonus) * 1000);

          return {
            foodCode: food.food_code,
            name: food.food_description,
            relevanceScore: score,
          };
        })
        .filter((result) => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      logger.info(
        {
          service: 'cnf-api',
          query,
          totalResults: results.length,
        },
        'CNF search completed'
      );

      return results;
    } catch (error) {
      this.handleError(error, 'searchFoods');
      throw error;
    }
  }

  /**
   * Get nutrient amounts for a specific food
   *
   * @param foodCode - CNF food code
   * @returns Array of nutrients with amounts (per 100g)
   */
  async getNutrients(foodCode: number): Promise<CNFNutrientAmount[]> {
    try {
      logger.debug(
        { service: 'cnf-api', foodCode },
        'Fetching nutrient amounts from CNF API'
      );

      const response = await this.client.get<CNFNutrientAmount[]>('/nutrientamount/', {
        params: {
          id: foodCode,
          lang: 'en',
          type: 'json',
        },
      });

      logger.info(
        {
          service: 'cnf-api',
          foodCode,
          nutrientCount: response.data.length,
        },
        'CNF nutrient amounts fetched'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getNutrients');
      throw error;
    }
  }

  /**
   * Get serving sizes for a specific food
   *
   * @param foodCode - CNF food code
   * @returns Array of serving sizes with conversion factors
   */
  async getServingSizes(foodCode: number): Promise<CNFServingSize[]> {
    try {
      logger.debug(
        { service: 'cnf-api', foodCode },
        'Fetching serving sizes from CNF API'
      );

      const response = await this.client.get<CNFServingSize[]>('/servingsize/', {
        params: {
          id: foodCode,
          lang: 'en',
          type: 'json',
        },
      });

      logger.info(
        {
          service: 'cnf-api',
          foodCode,
          servingSizeCount: response.data.length,
        },
        'CNF serving sizes fetched'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getServingSizes');
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
          service: 'cnf-api',
          method,
          status,
          statusText: axiosError.response?.statusText,
          data,
          message: axiosError.message,
        },
        `CNF API error in ${method}`
      );
    } else {
      logger.error(
        {
          service: 'cnf-api',
          method,
          error: error instanceof Error ? error.message : String(error),
        },
        `Unexpected error in ${method}`
      );
    }
  }
}

/**
 * Singleton CNF client instance
 */
export const cnfClient = new CNFClient();
