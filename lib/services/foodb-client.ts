/**
 * FooDB API Client
 *
 * Purpose: Typed HTTP client for FooDB (Food Database) API
 * Pattern: Class-based client with response type safety
 * Service: FooDB - World's largest food constituent database (https://foodb.ca/)
 *
 * Features:
 * - 28,000+ chemical compounds
 * - 1,000+ raw/unprocessed foods
 * - Phytochemicals, flavonoids, polyphenols
 * - Chemical composition and health effects
 *
 * API Documentation: https://foodb.ca/api_doc
 * Access: Requires API key (free for non-commercial use)
 *
 * Generated: 2025-11-18
 * Architecture: Phase 2 Multi-Source Food Integration
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '@/lib/logger';

/**
 * FooDB API Response Types
 */

export interface FooDBFoodSearchResult {
  food_id: number;
  public_id: string;
  food_name: string;
  scientific_name?: string;
  description?: string;
  food_group?: string;
  food_subgroup?: string;
  updated_at: string;
}

export interface FooDBFoodDetails {
  id: number;
  public_id: string;
  name: string;
  name_scientific?: string;
  description?: string;
  food_group?: string;
  food_subgroup?: string;
  food_type?: string;
  wikipedia_id?: string;
  picture_file_name?: string;
  picture_content_type?: string;
  picture_file_size?: number;
  picture_updated_at?: string;
  legacy_id?: number;
  created_at: string;
  updated_at: string;
}

export interface FooDBCompound {
  id: number;
  public_id: string;
  name: string;
  common_name?: string;
  description?: string;
  cas_number?: string;
  molecular_formula?: string;
  molecular_weight?: number;
  inchikey?: string;
  smiles?: string;
  state?: string;
  compound_type?: string;
}

export interface FooDBContent {
  id: number;
  food_id: number;
  compound_id: number;
  orig_content?: string;
  orig_min?: string;
  orig_max?: string;
  orig_unit?: string;
  orig_citation?: string;
  citation?: string;
  citation_type?: string;
  creator_id?: number;
  updater_id?: number;
  created_at: string;
  updated_at: string;
  source_id?: number;
  source_type?: string;
  standard_content?: number; // Standardized to mg/100g
}

export interface FooDBSearchResponse<T> {
  data: T[];
  page: number;
  total_pages?: number;
  total_results?: number;
}

/**
 * FooDB API Client
 * Implements typed API client for FooDB chemical composition database
 */
export class FooDBClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://foodb.ca';

  constructor() {
    this.apiKey = process.env.FOODB_API_KEY || '';

    if (!this.apiKey) {
      logger.warn(
        { service: 'foodb-api' },
        'FooDB API key not configured. Set FOODB_API_KEY environment variable. Request key at https://foodb.ca/api_doc'
      );
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    logger.info(
      {
        service: 'foodb-api',
        baseURL: this.baseURL,
        hasApiKey: !!this.apiKey,
      },
      'FooDB API client initialized'
    );
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search foods by name
   *
   * @param query - Food name search query
   * @param page - Page number (default: 1)
   * @returns Array of matching foods
   *
   * @example
   * const results = await foodbClient.searchFoods('chicken', 1);
   */
  async searchFoods(query: string, page = 1): Promise<FooDBFoodSearchResult[]> {
    if (!this.isConfigured()) {
      logger.warn(
        { service: 'foodb-api', query },
        'FooDB API key not configured - skipping search'
      );
      return [];
    }

    try {
      logger.debug(
        { service: 'foodb-api', query, page },
        'Searching foods via FooDB API'
      );

      const response = await this.client.get<FooDBFoodSearchResult[]>('/foods.json', {
        params: {
          food_name: query,
          page,
          api_key: this.apiKey,
        },
      });

      logger.info(
        {
          service: 'foodb-api',
          query,
          resultsReturned: response.data?.length ?? 0,
        },
        'FooDB food search completed'
      );

      return response.data || [];
    } catch (error) {
      this.handleError(error, 'searchFoods');
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Get detailed food information by ID
   *
   * @param foodId - FooDB food ID
   * @returns Detailed food information
   *
   * @example
   * const food = await foodbClient.getFoodDetails(1023);
   */
  async getFoodDetails(foodId: number): Promise<FooDBFoodDetails | null> {
    if (!this.isConfigured()) {
      logger.warn(
        { service: 'foodb-api', foodId },
        'FooDB API key not configured - skipping food details'
      );
      return null;
    }

    try {
      logger.debug(
        { service: 'foodb-api', foodId },
        'Fetching food details from FooDB API'
      );

      const response = await this.client.get<FooDBFoodDetails>(`/foods/${foodId}.json`, {
        params: {
          api_key: this.apiKey,
        },
      });

      logger.info(
        {
          service: 'foodb-api',
          foodId,
          foodName: response.data.name,
        },
        'FooDB food details fetched'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getFoodDetails');
      return null;
    }
  }

  /**
   * Get compounds for a specific food
   *
   * @param foodId - FooDB food ID
   * @param page - Page number (default: 1)
   * @param pageSize - Results per page (default: 50)
   * @returns Array of compound-content associations
   *
   * @example
   * const compounds = await foodbClient.getFoodCompounds(1023, 1, 50);
   */
  async getFoodCompounds(
    foodId: number,
    page = 1,
    pageSize = 50
  ): Promise<FooDBContent[]> {
    if (!this.isConfigured()) {
      logger.warn(
        { service: 'foodb-api', foodId },
        'FooDB API key not configured - skipping compounds'
      );
      return [];
    }

    try {
      logger.debug(
        { service: 'foodb-api', foodId, page, pageSize },
        'Fetching food compounds from FooDB API'
      );

      const response = await this.client.get<FooDBContent[]>('/contents.json', {
        params: {
          food_id: foodId,
          page,
          page_size: pageSize,
          api_key: this.apiKey,
        },
      });

      logger.info(
        {
          service: 'foodb-api',
          foodId,
          compoundCount: response.data?.length ?? 0,
        },
        'FooDB food compounds fetched'
      );

      return response.data || [];
    } catch (error) {
      this.handleError(error, 'getFoodCompounds');
      return [];
    }
  }

  /**
   * Get compound details by ID
   *
   * @param compoundId - FooDB compound ID
   * @returns Compound details
   *
   * @example
   * const compound = await foodbClient.getCompoundDetails(456);
   */
  async getCompoundDetails(compoundId: number): Promise<FooDBCompound | null> {
    if (!this.isConfigured()) {
      logger.warn(
        { service: 'foodb-api', compoundId },
        'FooDB API key not configured - skipping compound details'
      );
      return null;
    }

    try {
      logger.debug(
        { service: 'foodb-api', compoundId },
        'Fetching compound details from FooDB API'
      );

      const response = await this.client.get<FooDBCompound>(`/compounds/${compoundId}.json`, {
        params: {
          api_key: this.apiKey,
        },
      });

      logger.info(
        {
          service: 'foodb-api',
          compoundId,
          compoundName: response.data.name,
        },
        'FooDB compound details fetched'
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'getCompoundDetails');
      return null;
    }
  }

  /**
   * Get all nutrients/compounds for a food (aggregates paginated results)
   *
   * @param foodId - FooDB food ID
   * @param maxPages - Maximum pages to fetch (default: 10 = ~500 compounds)
   * @returns Complete array of all compounds for the food
   */
  async getAllFoodCompounds(foodId: number, maxPages = 10): Promise<FooDBContent[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const allCompounds: FooDBContent[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const compounds = await this.getFoodCompounds(foodId, page, 50);

      if (compounds.length === 0) {
        break; // No more results
      }

      allCompounds.push(...compounds);

      if (compounds.length < 50) {
        break; // Last page
      }
    }

    logger.info(
      {
        service: 'foodb-api',
        foodId,
        totalCompounds: allCompounds.length,
      },
      'FooDB all compounds aggregated'
    );

    return allCompounds;
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
          service: 'foodb-api',
          method,
          status,
          statusText: axiosError.response?.statusText,
          data,
          message: axiosError.message,
        },
        `FooDB API error in ${method}`
      );

      // Handle specific error codes
      if (status === 401 || status === 403) {
        logger.error(
          {
            service: 'foodb-api',
            method,
          },
          'FooDB API authentication failed - check FOODB_API_KEY environment variable'
        );
      } else if (status === 404) {
        logger.warn(
          {
            service: 'foodb-api',
            method,
          },
          'FooDB API resource not found'
        );
      } else if (status === 500) {
        logger.error(
          {
            service: 'foodb-api',
            method,
          },
          'FooDB API internal server error'
        );
      }
    } else {
      logger.error(
        {
          service: 'foodb-api',
          method,
          error: error instanceof Error ? error.message : String(error),
        },
        `Unexpected error in ${method}`
      );
    }
  }
}

/**
 * Singleton FooDB client instance
 */
export const foodbClient = new FooDBClient();

// ============================================================================
// STAGING TABLE CLIENT (for local data access)
// ============================================================================

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { wordMatchSQL } from '@/lib/utils/search-words';

/**
 * FooDB staging table food result
 */
export interface FooDBStagingFood {
  foodbId: number;
  name: string;
  nameScientific: string | null;
  description: string | null;
  foodGroup: string | null;
}

/**
 * FooDB staging table nutrient result (with Nutri compound mapping)
 */
export interface FooDBStagingNutrient {
  foodbCompoundId: number;
  compoundName: string;
  value: number;
  unit: string;
  sourceUnit: string;
  compoundId: string | null; // Nutri compound UUID if mapped
  nutriCompoundName: string | null; // Nutri compound name if mapped
}

/**
 * FooDB Staging Client
 * Fetches data from local staging tables (not API)
 */
class FooDBStagingClient {
  /**
   * Search foods by name in staging table
   */
  async searchFoods(query: string, limit: number = 20): Promise<FooDBStagingFood[]> {
    const startTime = Date.now();

    try {
      const results = await db.execute<{
        foodb_id: number;
        name: string;
        name_scientific: string | null;
        description: string | null;
        food_group: string | null;
      }>(
        sql`SELECT foodb_id, name, name_scientific, description, food_group FROM source_foodb_foods WHERE (`
          .append(wordMatchSQL('name', query))
          .append(sql` OR `)
          .append(wordMatchSQL('name_scientific', query))
          .append(sql`) ORDER BY CASE WHEN LOWER(name) = LOWER(${query}) THEN 0 ELSE 1 END, similarity(name, ${query}) DESC, name ASC LIMIT ${limit}`)
      );

      const rows = (results as any).rows ?? results;
      const foods = rows.map((row: any) => ({
        foodbId: row.foodb_id,
        name: row.name,
        nameScientific: row.name_scientific,
        description: row.description,
        foodGroup: row.food_group,
      }));

      logger.debug(
        {
          service: 'foodb-staging',
          query,
          count: foods.length,
          durationMs: Date.now() - startTime,
        },
        'FooDB staging search completed'
      );

      return foods;
    } catch (error) {
      logger.error(
        {
          service: 'foodb-staging',
          error: error instanceof Error ? error.message : String(error),
        },
        'FooDB staging search failed'
      );
      throw error;
    }
  }

  /**
   * Get food by ID from staging table
   */
  async getFood(foodbId: number): Promise<FooDBStagingFood | null> {
    const results = await db.execute<{
      foodb_id: number;
      name: string;
      name_scientific: string | null;
      description: string | null;
      food_group: string | null;
    }>(sql`
      SELECT foodb_id, name, name_scientific, description, food_group
      FROM source_foodb_foods
      WHERE foodb_id = ${foodbId}
    `);

    const rows = (results as any).rows ?? results;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      foodbId: row.foodb_id,
      name: row.name,
      nameScientific: row.name_scientific,
      description: row.description,
      foodGroup: row.food_group,
    };
  }

  /**
   * Get nutrients for a food from staging table
   * Returns nutrients with Nutri compound mapping where available
   *
   * @param foodbId - FooDB food ID (parent food)
   * @param origFoodName - Optional specific variant/preparation name (filters by orig_food_name)
   */
  async getNutrients(foodbId: number, origFoodName?: string): Promise<FooDBStagingNutrient[]> {
    const startTime = Date.now();

    try {
      // If origFoodName is provided, filter by it for specific preparation data
      // Otherwise fall back to all content for the foodbId (legacy behavior)
      const results = origFoodName
        ? await db.execute<{
            foodb_compound_id: number;
            compound_name: string;
            standard_content: number;
            orig_unit: string;
            compound_id: string | null;
            nutri_compound_name: string | null;
            conversion_factor: string | null;
            canonical_unit: string | null;
          }>(sql`
            SELECT
              c.foodb_compound_id,
              COALESCE(fc.name, 'FooDB#' || c.foodb_compound_id) as compound_name,
              c.standard_content,
              c.orig_unit,
              cs.compound_id,
              comp.name as nutri_compound_name,
              cs.conversion_factor,
              comp.unit as canonical_unit
            FROM source_foodb_content c
            LEFT JOIN source_foodb_compounds fc ON fc.foodb_id = c.foodb_compound_id
            LEFT JOIN compound_sources cs ON cs.external_source IN ('FOODB', 'FooDB')
              AND (cs.external_id = c.foodb_compound_id::text
                OR cs.external_id = 'FDB' || LPAD(c.foodb_compound_id::text, 6, '0'))
            LEFT JOIN compounds comp ON comp.id = cs.compound_id
            WHERE c.foodb_food_id = ${foodbId}
              AND c.orig_food_name = ${origFoodName}
              AND c.standard_content IS NOT NULL
              AND c.standard_content > 0
            ORDER BY c.standard_content DESC
          `)
        : await db.execute<{
            foodb_compound_id: number;
            compound_name: string;
            standard_content: number;
            orig_unit: string;
            compound_id: string | null;
            nutri_compound_name: string | null;
            conversion_factor: string | null;
            canonical_unit: string | null;
          }>(sql`
            SELECT
              c.foodb_compound_id,
              COALESCE(fc.name, 'FooDB#' || c.foodb_compound_id) as compound_name,
              c.standard_content,
              c.orig_unit,
              cs.compound_id,
              comp.name as nutri_compound_name,
              cs.conversion_factor,
              comp.unit as canonical_unit
            FROM source_foodb_content c
            LEFT JOIN source_foodb_compounds fc ON fc.foodb_id = c.foodb_compound_id
            LEFT JOIN compound_sources cs ON cs.external_source IN ('FOODB', 'FooDB')
              AND (cs.external_id = c.foodb_compound_id::text
                OR cs.external_id = 'FDB' || LPAD(c.foodb_compound_id::text, 6, '0'))
            LEFT JOIN compounds comp ON comp.id = cs.compound_id
            WHERE c.foodb_food_id = ${foodbId}
              AND c.standard_content IS NOT NULL
              AND c.standard_content > 0
            ORDER BY c.standard_content DESC
          `);

      const rows = (results as any).rows ?? results;
      const nutrients = rows.map((row: any) => ({
        foodbCompoundId: row.foodb_compound_id,
        compoundName: row.compound_name,
        value: parseFloat(row.standard_content) * parseFloat(row.conversion_factor || '1'),
        unit: row.canonical_unit || row.orig_unit || 'mg/100g',
        sourceUnit: row.orig_unit || 'mg/100g',
        compoundId: row.compound_id,
        nutriCompoundName: row.nutri_compound_name,
      }));

      logger.debug(
        {
          service: 'foodb-staging',
          foodbId,
          origFoodName,
          count: nutrients.length,
          mappedCount: nutrients.filter((n: any) => n.compoundId).length,
          durationMs: Date.now() - startTime,
        },
        'FooDB staging nutrients fetched'
      );

      return nutrients;
    } catch (error) {
      logger.error(
        {
          service: 'foodb-staging',
          foodbId,
          origFoodName,
          error: error instanceof Error ? error.message : String(error),
        },
        'FooDB staging nutrient fetch failed'
      );
      throw error;
    }
  }

  /**
   * Get nutrient count for a food (mapped compounds only)
   *
   * @param foodbId - FooDB food ID (parent food)
   * @param origFoodName - Optional specific variant/preparation name
   */
  async getNutrientCount(foodbId: number, origFoodName?: string): Promise<number> {
    const result = origFoodName
      ? await db.execute<{ count: string }>(sql`
          SELECT COUNT(DISTINCT cs.compound_id) as count
          FROM source_foodb_content c
          JOIN compound_sources cs ON cs.external_source IN ('FOODB', 'FooDB')
            AND (cs.external_id = c.foodb_compound_id::text
              OR cs.external_id = 'FDB' || LPAD(c.foodb_compound_id::text, 6, '0'))
          WHERE c.foodb_food_id = ${foodbId}
            AND c.orig_food_name = ${origFoodName}
            AND c.standard_content IS NOT NULL
            AND c.standard_content > 0
        `)
      : await db.execute<{ count: string }>(sql`
          SELECT COUNT(DISTINCT cs.compound_id) as count
          FROM source_foodb_content c
          JOIN compound_sources cs ON cs.external_source IN ('FOODB', 'FooDB')
            AND (cs.external_id = c.foodb_compound_id::text
              OR cs.external_id = 'FDB' || LPAD(c.foodb_compound_id::text, 6, '0'))
          WHERE c.foodb_food_id = ${foodbId}
            AND c.standard_content IS NOT NULL
            AND c.standard_content > 0
        `);

    const rows = (result as any).rows ?? result;
    return parseInt(rows[0]?.count || '0', 10);
  }
}

/**
 * Singleton FooDB staging client instance
 */
export const foodbStagingClient = new FooDBStagingClient();
