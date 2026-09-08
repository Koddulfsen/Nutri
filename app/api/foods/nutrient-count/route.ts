/**
 * Nutrient Count API Endpoint
 *
 * GET /api/foods/nutrient-count
 *
 * Purpose: Get nutrient count for a food from CNF, USDA, or FooDB
 * Pattern: Quick lookup without full nutrient data
 * Features:
 *   - Query parameters: source (CNF | FDC | FOODB), id (food ID)
 *   - Returns just the nutrient count for the specified food
 *   - Used by Add Food modal to show compound count for selected items
 *
 * Updated: 2026-01-18 - Added FooDB support
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cnfClient } from '@/lib/services/cnf-client';
import { usdaClient } from '@/lib/services/usda-client';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/auth/api-guard';

/**
 * Query parameters schema validation
 */
const QueryParamsSchema = z.object({
  source: z.enum(['CNF', 'FDC', 'FOODB', 'PHENOL', 'DUKE', 'AFCD', 'UK_COFID', 'FINELI', 'CIQUAL', 'BLS', 'FRIDA', 'NEVO', 'MATVARETABELLEN', 'FOODFILES', 'MEXT', 'KFCT', 'INDB', 'ASEANFOODS']),
  id: z.string().min(1, 'Food ID is required'),
  variant: z.string().optional(), // FooDB orig_food_name for specific preparation
});

/**
 * Response type
 */
interface NutrientCountResponse {
  source: 'CNF' | 'FDC' | 'FOODB' | 'PHENOL' | 'DUKE' | 'AFCD' | 'UK_COFID' | 'FINELI' | 'CIQUAL' | 'BLS' | 'FRIDA' | 'NEVO' | 'MATVARETABELLEN' | 'FOODFILES' | 'MEXT' | 'KFCT' | 'INDB' | 'ASEANFOODS';
  id: string;
  nutrientCount: number;
  foodName?: string;
}

/**
 * GET /api/foods/nutrient-count
 * Get nutrient count for a specific food
 */
export const maxDuration = 30;

export async function GET(
  request: NextRequest
): Promise<NextResponse<NutrientCountResponse | { error: string; details?: any }>> {
  // Reaches external sources to count nutrients. Requires a session so anonymous
  // callers cannot burn upstream rate limits.
  const denied = await requireUser();
  if (denied) return denied;


  const startTime = Date.now();

  try {
    // Step 1: Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const paramsObject = {
      source: searchParams.get('source'),
      id: searchParams.get('id'),
      variant: searchParams.get('variant') || undefined,
    };

    const validationResult = QueryParamsSchema.safeParse(paramsObject);

    if (!validationResult.success) {
      logger.warn(
        {
          service: 'nutrient-count-api',
          errors: validationResult.error.errors,
        },
        'Invalid parameters'
      );

      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { source, id, variant } = validationResult.data;

    logger.info(
      {
        service: 'nutrient-count-api',
        source,
        id,
        variant,
      },
      'Fetching nutrient count'
    );

    let nutrientCount = 0;
    let foodName: string | undefined;

    // Step 2: Fetch nutrient count based on source
    if (source === 'CNF') {
      const foodCode = parseInt(id, 10);
      if (isNaN(foodCode)) {
        return NextResponse.json(
          { error: 'Invalid CNF food code' },
          { status: 400 }
        );
      }

      const nutrients = await cnfClient.getNutrients(foodCode);
      nutrientCount = nutrients.length;
    } else if (source === 'FDC') {
      const fdcId = parseInt(id, 10);
      if (isNaN(fdcId)) {
        return NextResponse.json(
          { error: 'Invalid FDC ID' },
          { status: 400 }
        );
      }

      const foodDetails = await usdaClient.getFoodDetails(fdcId, 'abridged');
      nutrientCount = foodDetails.foodNutrients?.length ?? 0;
      foodName = foodDetails.description;
    } else if (source === 'FOODB') {
      const foodbId = parseInt(id, 10);
      if (isNaN(foodbId)) {
        return NextResponse.json(
          { error: 'Invalid FooDB ID' },
          { status: 400 }
        );
      }

      // Count compounds with values for this food that map to Nutri compounds
      // If variant (orig_food_name) is provided, filter by it for specific preparation data
      const result = variant
        ? await db.execute<{ count: string; name: string }>(sql`
            SELECT
              COUNT(DISTINCT cs.compound_id) as count,
              ${variant} as name
            FROM source_foodb_content c
            JOIN compound_sources cs ON cs.external_id = c.foodb_compound_id::text
              AND cs.external_source = 'FOODB'
            WHERE c.foodb_food_id = ${foodbId}
              AND c.orig_food_name = ${variant}
              AND c.standard_content IS NOT NULL
              AND c.standard_content > 0
          `)
        : await db.execute<{ count: string; name: string }>(sql`
            SELECT
              COUNT(DISTINCT cs.compound_id) as count,
              f.name
            FROM source_foodb_content c
            JOIN source_foodb_foods f ON f.foodb_id = c.foodb_food_id
            JOIN compound_sources cs ON cs.external_id = c.foodb_compound_id::text
              AND cs.external_source = 'FOODB'
            WHERE c.foodb_food_id = ${foodbId}
              AND c.standard_content IS NOT NULL
              AND c.standard_content > 0
            GROUP BY f.name
          `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'PHENOL') {
      const phenolId = parseInt(id, 10);
      if (isNaN(phenolId)) {
        return NextResponse.json(
          { error: 'Invalid Phenol-Explorer ID' },
          { status: 400 }
        );
      }

      // Count compounds with values for this food that map to Nutri compounds
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(DISTINCT cs.compound_id) as count,
          f.name
        FROM source_phenol_content c
        JOIN source_phenol_foods f ON f.phenol_id = c.phenol_food_id
        JOIN compound_sources cs ON cs.external_id = c.phenol_compound_id::text
          AND cs.external_source = 'PHENOL_EXPLORER'
        WHERE c.phenol_food_id = ${phenolId}
          AND c.content_mean IS NOT NULL
          AND c.content_mean > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'DUKE') {
      // Count compounds with values for this plant that map to Nutri compounds
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(DISTINCT cs.compound_id) as count,
          p.common_name as name
        FROM source_duke_farmacy f
        JOIN source_duke_plants p ON p.fnf_num = f.fnf_num
        JOIN compound_sources cs ON cs.external_id = f.chem_id
          AND cs.external_source = 'DUKE'
        WHERE f.fnf_num = ${id}
        GROUP BY p.common_name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'AFCD') {
      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_afcd_content c
        JOIN source_afcd_foods f ON f.afcd_food_key = c.afcd_food_key
        WHERE c.afcd_food_key = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'UK_COFID') {
      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_cofid_content c
        JOIN source_cofid_foods f ON f.food_code = c.food_code
        WHERE c.food_code = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'FINELI') {
      const fineliId = parseInt(id, 10);
      if (isNaN(fineliId)) {
        return NextResponse.json(
          { error: 'Invalid Fineli food ID' },
          { status: 400 }
        );
      }

      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_fineli_content c
        JOIN source_fineli_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${fineliId}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'CIQUAL') {
      const ciqualId = parseInt(id, 10);
      if (isNaN(ciqualId)) {
        return NextResponse.json(
          { error: 'Invalid CIQUAL food ID' },
          { status: 400 }
        );
      }

      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_ciqual_content c
        JOIN source_ciqual_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${ciqualId}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'BLS') {
      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_bls_content c
        JOIN source_bls_foods f ON f.food_code = c.food_code
        WHERE c.food_code = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'FRIDA') {
      const fridaId = parseInt(id, 10);
      if (isNaN(fridaId)) {
        return NextResponse.json(
          { error: 'Invalid FRIDA food ID' },
          { status: 400 }
        );
      }

      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_frida_content c
        JOIN source_frida_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${fridaId}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'NEVO') {
      const nevoId = parseInt(id, 10);
      if (isNaN(nevoId)) {
        return NextResponse.json(
          { error: 'Invalid NEVO food ID' },
          { status: 400 }
        );
      }

      // Count all nutrients with values for this food
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_nevo_content c
        JOIN source_nevo_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${nevoId}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'MATVARETABELLEN') {
      // Count all nutrients with values for this food (text food_id)
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_matvaretabellen_content c
        JOIN source_matvaretabellen_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'FOODFILES') {
      // Count all nutrients with values for this food (text food_id)
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_foodfiles_content c
        JOIN source_foodfiles_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'MEXT') {
      // Count all nutrients with values for this food (text food_id)
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_mext_content c
        JOIN source_mext_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'KFCT') {
      // Count all nutrients with values for this food (text food_id)
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_kfct_content c
        JOIN source_kfct_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'INDB') {
      // Count all nutrients with values for this food (text food_id)
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_indb_content c
        JOIN source_indb_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    } else if (source === 'ASEANFOODS') {
      // Count all nutrients with values for this food (text food_id)
      const result = await db.execute<{ count: string; name: string }>(sql`
        SELECT
          COUNT(*) as count,
          f.name
        FROM source_aseanfoods_content c
        JOIN source_aseanfoods_foods f ON f.food_id = c.food_id
        WHERE c.food_id = ${id}
          AND c.value IS NOT NULL
          AND c.value > 0
        GROUP BY f.name
      `);

      const rows = (result as any).rows ?? result;
      if (rows.length > 0) {
        nutrientCount = parseInt(rows[0].count, 10);
        foodName = rows[0].name;
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info(
      {
        service: 'nutrient-count-api',
        source,
        id,
        nutrientCount,
        durationMs,
      },
      'Nutrient count fetched'
    );

    // Step 3: Return result
    return NextResponse.json({
      source,
      id,
      nutrientCount,
      foodName,
    });
  } catch (error) {
    logger.error(
      {
        service: 'nutrient-count-api',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Nutrient count fetch error'
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch nutrient count',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
