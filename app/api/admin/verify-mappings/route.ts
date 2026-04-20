/**
 * Compound Source Mapping Verification API
 *
 * GET  - Fetch mappings with compound info, source reference, verification status, and sample values
 * PATCH - Update verification status for a mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference, getSourceNutrientReferenceWithProgress, isSourceNutrientReferenceCached } from '@/lib/services/source-nutrient-reference';

// Allowlist of valid external sources to prevent injection via source filter
const VALID_SOURCES = new Set([
  'FDC', 'CNF', 'AFCD', 'UK_COFID', 'CIQUAL', 'FINELI', 'BLS',
  'FRIDA', 'NEVO', 'MATVARETABELLEN', 'FOODFILES', 'MEXT', 'KFCT',
  'INDB', 'ASEANFOODS', 'FOODB', 'PHENOL', 'DUKE', 'NUTRITIONIX',
]);

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '1', 10) || 1));
    const statsOnly = searchParams.get('stats') === 'true';
    const stream = searchParams.get('stream') === 'true';

    // Validate source filter against allowlist
    if (source && !VALID_SOURCES.has(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    // SSE streaming mode
    if (stream) {
      return handleStreamingRequest(user.id, source, status, offset, limit);
    }

    // Stats query
    const statsResult = await db.execute(sql`
      SELECT
        COUNT(cs.id) as total,
        COUNT(csv.id) FILTER (WHERE csv.status = 'verified') as verified,
        COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') as flagged,
        COUNT(cs.id) - COUNT(csv.id) as unverified
      FROM compound_sources cs
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
    `);
    const statsRows = (statsResult as any).rows ?? statsResult;
    const statsData = statsRows[0] as {
      total: string;
      verified: string;
      flagged: string;
      unverified: string;
    };

    // Source breakdown
    const sourceBreakdown = await db.execute(sql`
      SELECT
        cs.external_source as source,
        COUNT(cs.id) as total,
        COUNT(csv.id) FILTER (WHERE csv.status = 'verified') as verified,
        COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') as flagged
      FROM compound_sources cs
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      GROUP BY cs.external_source
      ORDER BY cs.external_source
    `);

    if (statsOnly) {
      return NextResponse.json({
        success: true,
        stats: {
          total: parseInt(statsData.total),
          verified: parseInt(statsData.verified),
          flagged: parseInt(statsData.flagged),
          unverified: parseInt(statsData.unverified),
        },
        sourceBreakdown: (sourceBreakdown as any).rows ?? sourceBreakdown,
      });
    }

    // Use parameterized queries for filtered results
    // Pick the right query based on filter combination
    let mappingsResult: any;
    let countResult: any;

    if (source && status === 'verified') {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source} AND csv.status = 'verified'
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source} AND csv.status = 'verified'
      `);
    } else if (source && status === 'flagged') {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source} AND csv.status = 'flagged'
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source} AND csv.status = 'flagged'
      `);
    } else if (source && status === 'unverified') {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source} AND csv.id IS NULL
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source} AND csv.id IS NULL
      `);
    } else if (source) {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source}
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE cs.external_source = ${source}
      `);
    } else if (status === 'verified') {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE csv.status = 'verified'
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE csv.status = 'verified'
      `);
    } else if (status === 'flagged') {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE csv.status = 'flagged'
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE csv.status = 'flagged'
      `);
    } else if (status === 'unverified') {
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE csv.id IS NULL
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        WHERE csv.id IS NULL
      `);
    } else {
      // No filters
      mappingsResult = await db.execute(sql`
        SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
               cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
               c.unit as compound_unit, c.compound_type, csv.status as verification_status,
               csv.notes as verification_notes, csv.verified_at
        FROM compound_sources cs
        JOIN compounds c ON c.id = cs.compound_id
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        ORDER BY c.name ASC, cs.external_source ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      countResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM compound_sources cs
        LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      `);
    }

    const countRows = (countResult as any).rows ?? countResult;
    const filteredTotal = parseInt((countRows[0] as any).total);

    // Load source nutrient reference for actual names
    const sourceRef = await getSourceNutrientReference();

    // For each mapping, look up actual source nutrient name + sample values
    const mappingRows = (mappingsResult as any).rows ?? mappingsResult;
    const mappings = await Promise.all(
      mappingRows.map(async (row: any) => {
        const key = `${row.external_source}:${row.external_id}`;
        const actualNutrient = sourceRef.get(key) ?? null;

        // Get sample food values for this compound (up to 5 foods)
        let sampleValues: Array<{
          foodName: string;
          averageValue: string;
          unit: string;
          sourceCount: number;
          perSourceValues: Array<{ source: string; value: string; unit: string }>;
        }> = [];

        try {
          const samples = await db.execute(sql`
            SELECT
              f.name as food_name,
              mn.average_value,
              mn.unit,
              mn.source_count,
              mn.id as merged_id
            FROM merged_nutrients mn
            JOIN foods f ON f.id = mn.food_id
            WHERE mn.compound_id = ${row.compound_id}
            ORDER BY mn.created_at DESC
            LIMIT 5
          `);

          const sampleRows = (samples as any).rows ?? samples;
          if (sampleRows.length > 0) {
            sampleValues = await Promise.all(
              sampleRows.map(async (s: any) => {
                const perSource = await db.execute(sql`
                  SELECT api_source as source, value, source_unit as unit
                  FROM nutrient_source_values
                  WHERE merged_nutrient_id = ${s.merged_id}
                  ORDER BY api_source
                `);

                return {
                  foodName: s.food_name,
                  averageValue: s.average_value,
                  unit: s.unit,
                  sourceCount: s.source_count,
                  perSourceValues: ((perSource as any).rows ?? perSource).map((p: any) => ({
                    source: p.source,
                    value: p.value,
                    unit: p.unit || '',
                  })),
                };
              })
            );
          }
        } catch {
          // Sample values are nice-to-have
        }

        return {
          id: row.cs_id,
          externalSource: row.external_source,
          externalId: row.external_id,
          ourMapping: {
            sourceName: row.source_name,
            sourceUnit: row.source_unit,
            conversionFactor: row.conversion_factor || '1.0',
            isCanonical: row.is_canonical ?? false,
          },
          actualSource: actualNutrient
            ? { name: actualNutrient.name, unit: actualNutrient.unit }
            : null,
          compound: {
            id: row.compound_id,
            name: row.compound_name,
            unit: row.compound_unit,
            type: row.compound_type,
          },
          verification: {
            status: row.verification_status || 'unverified',
            notes: row.verification_notes,
            verifiedAt: row.verified_at,
          },
          sampleValues,
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        total: parseInt(statsData.total),
        verified: parseInt(statsData.verified),
        flagged: parseInt(statsData.flagged),
        unverified: parseInt(statsData.unverified),
      },
      sourceBreakdown: (sourceBreakdown as any).rows ?? sourceBreakdown,
      filteredTotal,
      offset,
      mappings,
    });
  } catch (error: any) {
    console.error('Verify mappings GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleStreamingRequest(
  userId: string,
  source: string | null,
  status: string | null,
  offset: number,
  limit: number
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
        // Step 1: Stats
        send({ type: 'progress', step: 'stats', detail: 'Loading stats...', percent: 5 });
        const statsResult = await db.execute(sql`
          SELECT COUNT(cs.id) as total,
            COUNT(csv.id) FILTER (WHERE csv.status = 'verified') as verified,
            COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') as flagged,
            COUNT(cs.id) - COUNT(csv.id) as unverified
          FROM compound_sources cs
          LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
        `);
        const statsRows = (statsResult as any).rows ?? statsResult;
        const statsData = statsRows[0] as any;

        const sourceBreakdown = await db.execute(sql`
          SELECT cs.external_source as source, COUNT(cs.id) as total,
            COUNT(csv.id) FILTER (WHERE csv.status = 'verified') as verified,
            COUNT(csv.id) FILTER (WHERE csv.status = 'flagged') as flagged
          FROM compound_sources cs
          LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
          GROUP BY cs.external_source ORDER BY cs.external_source
        `);

        send({
          type: 'stats',
          stats: {
            total: parseInt(statsData.total),
            verified: parseInt(statsData.verified),
            flagged: parseInt(statsData.flagged),
            unverified: parseInt(statsData.unverified),
          },
          sourceBreakdown: (sourceBreakdown as any).rows ?? sourceBreakdown,
        });

        // Step 2: Source nutrient reference
        send({ type: 'progress', step: 'reference', detail: 'Building source reference...', percent: 10 });
        const sourceRef = await getSourceNutrientReferenceWithProgress((step, detail, refPercent) => {
          // Map the reference progress (0-100) to our overall progress (10-70)
          const overallPercent = 10 + Math.round(refPercent * 0.6);
          send({ type: 'progress', step: 'reference', detail, percent: overallPercent });
        });

        // Step 3: Mapping query
        send({ type: 'progress', step: 'mapping', detail: 'Loading mapping...', percent: 75 });

        // Build the filtered query
        let mappingsResult: any;
        let countResult: any;
        const baseSelect = sql`SELECT cs.id as cs_id, cs.external_source, cs.external_id, cs.source_name, cs.source_unit,
          cs.conversion_factor, cs.is_canonical, c.id as compound_id, c.name as compound_name,
          c.unit as compound_unit, c.compound_type, csv.status as verification_status,
          csv.notes as verification_notes, csv.verified_at
          FROM compound_sources cs
          JOIN compounds c ON c.id = cs.compound_id
          LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id`;

        if (source && status === 'verified') {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE cs.external_source = ${source} AND csv.status = 'verified' ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE cs.external_source = ${source} AND csv.status = 'verified'`);
        } else if (source && status === 'flagged') {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE cs.external_source = ${source} AND csv.status = 'flagged' ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE cs.external_source = ${source} AND csv.status = 'flagged'`);
        } else if (source && status === 'unverified') {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE cs.external_source = ${source} AND csv.id IS NULL ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE cs.external_source = ${source} AND csv.id IS NULL`);
        } else if (source) {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE cs.external_source = ${source} ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE cs.external_source = ${source}`);
        } else if (status === 'verified') {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE csv.status = 'verified' ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE csv.status = 'verified'`);
        } else if (status === 'flagged') {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE csv.status = 'flagged' ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE csv.status = 'flagged'`);
        } else if (status === 'unverified') {
          mappingsResult = await db.execute(sql`${baseSelect} WHERE csv.id IS NULL ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id WHERE csv.id IS NULL`);
        } else {
          mappingsResult = await db.execute(sql`${baseSelect} ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`);
          countResult = await db.execute(sql`SELECT COUNT(*) as total FROM compound_sources cs LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id`);
        }

        const countRows = (countResult as any).rows ?? countResult;
        const filteredTotal = parseInt((countRows[0] as any).total);

        // Step 4: Sample values
        send({ type: 'progress', step: 'samples', detail: 'Loading sample values...', percent: 85 });
        const mappingRows = (mappingsResult as any).rows ?? mappingsResult;
        const mappings = await Promise.all(
          mappingRows.map(async (row: any) => {
            const key = `${row.external_source}:${row.external_id}`;
            const actualNutrient = sourceRef.get(key) ?? null;

            let sampleValues: any[] = [];
            try {
              const samples = await db.execute(sql`
                SELECT f.name as food_name, mn.average_value, mn.unit, mn.source_count, mn.id as merged_id
                FROM merged_nutrients mn JOIN foods f ON f.id = mn.food_id
                WHERE mn.compound_id = ${row.compound_id} ORDER BY mn.created_at DESC LIMIT 5
              `);
              const sampleRows = (samples as any).rows ?? samples;
              if (sampleRows.length > 0) {
                sampleValues = await Promise.all(sampleRows.map(async (s: any) => {
                  const perSource = await db.execute(sql`
                    SELECT api_source as source, value, source_unit as unit
                    FROM nutrient_source_values WHERE merged_nutrient_id = ${s.merged_id} ORDER BY api_source
                  `);
                  return {
                    foodName: s.food_name, averageValue: s.average_value, unit: s.unit, sourceCount: s.source_count,
                    perSourceValues: ((perSource as any).rows ?? perSource).map((p: any) => ({ source: p.source, value: p.value, unit: p.unit || '' })),
                  };
                }));
              }
            } catch {}

            return {
              id: row.cs_id, externalSource: row.external_source, externalId: row.external_id,
              ourMapping: { sourceName: row.source_name, sourceUnit: row.source_unit, conversionFactor: row.conversion_factor || '1.0', isCanonical: row.is_canonical ?? false },
              actualSource: actualNutrient ? { name: actualNutrient.name, unit: actualNutrient.unit } : null,
              compound: { id: row.compound_id, name: row.compound_name, unit: row.compound_unit, type: row.compound_type },
              verification: { status: row.verification_status || 'unverified', notes: row.verification_notes, verifiedAt: row.verified_at },
              sampleValues,
            };
          })
        );

        send({ type: 'complete', filteredTotal, offset, mappings });
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

export async function PATCH(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { compoundSourceId, status, notes } = body;

    if (!compoundSourceId || !['verified', 'flagged'].includes(status)) {
      return NextResponse.json(
        { error: 'compoundSourceId and status (verified|flagged) required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(compoundSourceId)) {
      return NextResponse.json({ error: 'Invalid compoundSourceId' }, { status: 400 });
    }

    // Upsert verification
    await db.execute(sql`
      INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_by, verified_at)
      VALUES (${compoundSourceId}, ${status}, ${notes || null}, ${user.id}, NOW())
      ON CONFLICT (compound_source_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        verified_by = EXCLUDED.verified_by,
        verified_at = NOW()
    `);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify mappings PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
