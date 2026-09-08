/**
 * Compound-Centric Verification API
 *
 * GET — Fetch one compound at a time with all its source mappings and food values matrix.
 * Uses SSE streaming for progress reporting during reference loading.
 *
 * Verify/flag actions use the existing PATCH at /api/admin/verify-mappings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference, getSourceNutrientReferenceWithProgress } from '@/lib/services/source-nutrient-reference';
import { normalizeSource } from '@/lib/utils/source-normalize';
import { requireAdmin } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '1', 10) || 1));
    const typeFilter = searchParams.get('type') || '';
    const statusFilter = searchParams.get('status') || '';
    const sourceFilter = searchParams.get('source') || '';
    const stream = searchParams.get('stream') === 'true';

    if (stream) {
      return handleStreaming(offset, limit, typeFilter, statusFilter, sourceFilter);
    }

    return NextResponse.json({ error: 'Use stream=true' }, { status: 400 });
  } catch (error: any) {
    console.error('Verify compounds GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleStreaming(
  offset: number,
  limit: number,
  typeFilter: string,
  statusFilter: string,
  sourceFilter: string,
): Promise<Response> {
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      try {
        // Step 1: Global stats
        send({ type: 'progress', step: 'stats', detail: 'Loading stats...', percent: 5 });

        const statsResult = await db.execute(sql`
          SELECT
            COUNT(DISTINCT c.id) as compound_count,
            COUNT(cs.id) as mapping_total,
            COUNT(csv.id) FILTER (WHERE csv.status = 'verified') as mapping_verified,
            COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') as mapping_flagged,
            COUNT(csv.id) FILTER (WHERE csv.status = 'review') as mapping_review,
            COUNT(cs.id) - COUNT(csv.id) as mapping_unverified
          FROM compounds c
          JOIN compound_sources cs ON cs.compound_id = c.id
          LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
          WHERE c.tier = 'core'
        `);
        const statsRows = (statsResult as any).rows ?? statsResult;
        const stats = {
          compoundCount: parseInt(statsRows[0].compound_count),
          total: parseInt(statsRows[0].mapping_total),
          verified: parseInt(statsRows[0].mapping_verified),
          flagged: parseInt(statsRows[0].mapping_flagged),
          review: parseInt(statsRows[0].mapping_review),
          unverified: parseInt(statsRows[0].mapping_unverified),
        };
        send({ type: 'stats', stats });

        // Step 2: Source nutrient reference
        send({ type: 'progress', step: 'reference', detail: 'Building source reference...', percent: 10 });
        const sourceRef = await getSourceNutrientReferenceWithProgress((step, detail, refPercent) => {
          const overallPercent = 10 + Math.round(refPercent * 0.55);
          send({ type: 'progress', step: 'reference', detail, percent: overallPercent });
        });

        // Step 3: Filtered compound count
        send({ type: 'progress', step: 'compound', detail: 'Loading compound...', percent: 70 });

        const countResult = await getFilteredCompoundCount(typeFilter, statusFilter, sourceFilter);
        const filteredTotal = countResult;

        // Step 4: Get the compound at this offset
        const compoundRows = await getFilteredCompound(offset, limit, typeFilter, statusFilter, sourceFilter);

        if (compoundRows.length === 0) {
          send({ type: 'complete', filteredTotal, offset, compound: null, stats });
          controller.close();
          return;
        }

        // Group rows by compound (in case limit > 1 in future)
        const compoundId = compoundRows[0].compound_id;
        const compoundName = compoundRows[0].compound_name;
        const compoundUnit = compoundRows[0].compound_unit;
        const compoundType = compoundRows[0].compound_type;

        // Build source mappings with reference lookup
        const sourceMappings = compoundRows.map((row: any) => {
          const normalized = normalizeSource(row.external_source);
          const refKey = `${row.external_source}:${row.external_id}`;
          const altRefKey = `${normalized}:${row.external_id}`;
          const actualNutrient = sourceRef.get(refKey) ?? sourceRef.get(altRefKey) ?? null;

          const ourName = row.source_name?.toLowerCase().trim() || '';
          const actualName = actualNutrient?.name?.toLowerCase().trim() || '';
          const namesMatch = actualNutrient ? ourName === actualName : null;

          return {
            id: row.cs_id,
            externalSource: normalized,
            rawSource: row.external_source,
            externalId: row.external_id,
            ourName: row.source_name,
            actualName: actualNutrient?.name ?? null,
            actualUnit: actualNutrient?.unit ?? null,
            namesMatch,
            sourceUnit: row.source_unit,
            conversionFactor: row.conversion_factor || '1.0',
            isCanonical: row.is_canonical ?? false,
            verification: {
              status: row.verification_status || 'unverified',
              notes: row.verification_notes,
              verifiedAt: row.verified_at,
            },
          };
        });

        const mappingStats = {
          total: sourceMappings.length,
          verified: sourceMappings.filter((m: any) => m.verification.status === 'verified').length,
          flagged: sourceMappings.filter((m: any) => m.verification.status === 'flagged').length,
          review: sourceMappings.filter((m: any) => m.verification.status === 'review').length,
          unverified: sourceMappings.filter((m: any) => m.verification.status === 'unverified').length,
        };

        // Step 5: Food values matrix
        send({ type: 'progress', step: 'values', detail: 'Loading food values...', percent: 80 });

        const foodValues = await getFoodValuesMatrix(compoundId);

        const compound = {
          id: compoundId,
          name: compoundName,
          unit: compoundUnit,
          type: compoundType,
          mappingStats,
          sourceMappings,
          foodValues,
        };

        send({ type: 'complete', filteredTotal, offset, compound, stats });
        controller.close();
      } catch (error: any) {
        send({ type: 'error', error: error.message || 'Unknown error' });
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}

// ---------- Query helpers ----------

async function getFilteredCompoundCount(
  typeFilter: string,
  statusFilter: string,
  sourceFilter: string,
): Promise<number> {
  // Build dynamic query with filters
  let whereClause = sql`WHERE c.tier = 'core'`;

  if (typeFilter) {
    whereClause = sql`${whereClause} AND c.compound_type = ${typeFilter}`;
  }
  if (sourceFilter) {
    whereClause = sql`${whereClause} AND cs.external_source = ${sourceFilter}`;
  }

  let havingClause = sql``;
  if (statusFilter === 'unverified') {
    // "Needs work" — has any row that isn't terminal (not verified, not dead-flagged)
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status IN ('verified', 'flagged')) < COUNT(cs.id)`;
  } else if (statusFilter === 'verified') {
    // "All resolved" — every row is terminal (verified or dead-flagged)
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status IN ('verified', 'flagged')) = COUNT(cs.id)`;
  } else if (statusFilter === 'review') {
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status = 'review') > 0`;
  } else if (statusFilter === 'flagged') {
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') > 0`;
  }

  const result = await db.execute(sql`
    SELECT COUNT(*) as total FROM (
      SELECT c.id
      FROM compounds c
      JOIN compound_sources cs ON cs.compound_id = c.id
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      ${whereClause}
      GROUP BY c.id
      ${havingClause}
    ) sub
  `);
  const rows = (result as any).rows ?? result;
  return parseInt(rows[0]?.total || '0');
}

async function getFilteredCompound(
  offset: number,
  limit: number,
  typeFilter: string,
  statusFilter: string,
  sourceFilter: string,
): Promise<any[]> {
  let whereClause = sql`WHERE c.tier = 'core'`;

  if (typeFilter) {
    whereClause = sql`${whereClause} AND c.compound_type = ${typeFilter}`;
  }
  if (sourceFilter) {
    whereClause = sql`${whereClause} AND cs.external_source = ${sourceFilter}`;
  }

  let havingClause = sql``;
  if (statusFilter === 'unverified') {
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status IN ('verified', 'flagged')) < COUNT(cs.id)`;
  } else if (statusFilter === 'verified') {
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status IN ('verified', 'flagged')) = COUNT(cs.id)`;
  } else if (statusFilter === 'review') {
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status = 'review') > 0`;
  } else if (statusFilter === 'flagged') {
    havingClause = sql`HAVING COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') > 0`;
  }

  const result = await db.execute(sql`
    WITH filtered_compounds AS (
      SELECT c.id, c.name, c.unit, c.compound_type
      FROM compounds c
      JOIN compound_sources cs ON cs.compound_id = c.id
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      ${whereClause}
      GROUP BY c.id, c.name, c.unit, c.compound_type
      ${havingClause}
      ORDER BY c.name ASC
      LIMIT ${limit} OFFSET ${offset}
    )
    SELECT
      fc.id as compound_id, fc.name as compound_name, fc.unit as compound_unit,
      fc.compound_type,
      cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name,
      cs.source_unit, cs.conversion_factor, cs.is_canonical,
      csv.status as verification_status, csv.notes as verification_notes, csv.verified_at
    FROM filtered_compounds fc
    JOIN compound_sources cs ON cs.compound_id = fc.id
    LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
    ORDER BY fc.name, cs.external_source, cs.external_id
  `);

  return (result as any).rows ?? result;
}

async function getFoodValuesMatrix(compoundId: string): Promise<any[]> {
  const result = await db.execute(sql`
    SELECT
      f.id as food_id, f.name as food_name,
      mn.average_value, mn.unit, mn.source_count, mn.id as merged_id,
      nsv.api_source, nsv.value as source_value, nsv.source_unit
    FROM merged_nutrients mn
    JOIN foods f ON f.id = mn.food_id
    LEFT JOIN nutrient_source_values nsv ON nsv.merged_nutrient_id = mn.id
    WHERE mn.compound_id = ${compoundId}
    ORDER BY mn.average_value::numeric DESC, f.name, nsv.api_source
    LIMIT 100
  `);

  const rows = (result as any).rows ?? result;

  // Pivot flat rows into food-grouped matrix
  const foodMap = new Map<string, {
    foodId: string;
    foodName: string;
    average: number;
    unit: string;
    sourceCount: number;
    sourceValues: Record<string, number>;
  }>();

  for (const row of rows) {
    if (!foodMap.has(row.food_id)) {
      foodMap.set(row.food_id, {
        foodId: row.food_id,
        foodName: row.food_name,
        average: parseFloat(row.average_value || '0'),
        unit: row.unit || '',
        sourceCount: parseInt(row.source_count || '0'),
        sourceValues: {},
      });
    }
    if (row.api_source && row.source_value != null) {
      const entry = foodMap.get(row.food_id)!;
      const normalized = row.api_source; // api_source is already enum/uppercase
      entry.sourceValues[normalized] = parseFloat(row.source_value);
    }
  }

  // Return top 5 foods by average value
  return Array.from(foodMap.values()).slice(0, 5);
}
