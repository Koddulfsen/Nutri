/**
 * Mapping Coverage API
 *
 * Returns compound coverage data per source — how many compounds have actual
 * food data from each source, and how many foods contribute.
 *
 * GET ?stream=true         — SSE stream of per-source coverage (overview)
 * GET ?source=FDC          — detail for a specific source (compound-level breakdown)
 * GET                      — JSON overview (all sources at once)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// All sources from api_source_enum (ensures every source appears on the page)
const ALL_SOURCES = [
  'CNF', 'FDC', 'FOODB', 'PHENOL', 'DUKE', 'AFCD', 'UK_COFID', 'FINELI',
  'CIQUAL', 'BLS', 'FRIDA', 'NEVO', 'MATVARETABELLEN', 'FOODFILES',
  'MEXT', 'KFCT', 'INDB', 'ASEANFOODS', 'NUTRITIONIX',
];

import { normalizeSource } from '@/lib/utils/source-normalize';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const stream = searchParams.get('stream') === 'true';

    if (source) {
      return getSourceDetail(source);
    }
    if (stream) {
      return getOverviewStreaming();
    }
    return getOverview();
  } catch (error: any) {
    console.error('Mapping coverage error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- Helpers ----------

interface SourceEntry {
  source: string;
  totalCompounds: number;
  coveredCompounds: number;
  foodCount: number;
  compoundFoodCounts: number[];
}

/** Get mapped compounds per normalized source */
async function getMappedSources(): Promise<Map<string, { total: number; rawSources: string[] }>> {
  const result = await db.execute(sql`
    SELECT external_source as source, COUNT(DISTINCT compound_id) as total
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);
  const rows = ((result as any).rows ?? result) as Array<{ source: string; total: string }>;

  // Merge case variants into normalized names
  const merged = new Map<string, { total: number; rawSources: string[] }>();
  for (const row of rows) {
    const norm = normalizeSource(row.source);
    const existing = merged.get(norm);
    if (existing) {
      existing.total += parseInt(row.total);
      existing.rawSources.push(row.source);
    } else {
      merged.set(norm, { total: parseInt(row.total), rawSources: [row.source] });
    }
  }
  return merged;
}

/** Query coverage for a set of raw source names (handles case variants) */
async function getSourceCoverage(rawSources: string[]): Promise<{ foodCounts: number[]; foodCount: number }> {
  let allFoodCounts: number[] = [];
  let totalFoods = 0;

  for (const raw of rawSources) {
    try {
      // Compound food counts — uses ::text cast so mixed-case raw names work in the JOIN
      const countsResult = await db.execute(sql`
        SELECT
          cs.compound_id,
          COUNT(DISTINCT mn.food_id) as food_count
        FROM compound_sources cs
        JOIN merged_nutrients mn ON mn.compound_id = cs.compound_id
        JOIN nutrient_source_values nsv ON nsv.merged_nutrient_id = mn.id AND nsv.api_source::text = cs.external_source
        WHERE cs.external_source = ${raw}
        GROUP BY cs.compound_id
      `);
      const countRows = ((countsResult as any).rows ?? countsResult) as Array<{
        compound_id: string;
        food_count: string;
      }>;
      for (const r of countRows) {
        allFoodCounts.push(parseInt(r.food_count));
      }

      // Food count — also cast to text to avoid enum mismatch error
      const foodsResult = await db.execute(sql`
        SELECT COUNT(DISTINCT mn.food_id) as foods
        FROM nutrient_source_values nsv
        JOIN merged_nutrients mn ON mn.id = nsv.merged_nutrient_id
        WHERE nsv.api_source::text = ${raw} AND mn.compound_id IS NOT NULL
      `);
      const foodsRows = (foodsResult as any).rows ?? foodsResult;
      totalFoods = Math.max(totalFoods, parseInt((foodsRows[0] as any)?.foods || '0'));
    } catch {
      // This raw source variant has no enum match — skip it
    }
  }

  allFoodCounts.sort((a, b) => b - a);
  return { foodCounts: allFoodCounts, foodCount: totalFoods };
}

// ---------- SSE streaming overview ----------

async function getOverviewStreaming(): Promise<Response> {
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      try {
        send({ type: 'progress', detail: 'Counting mapped compounds...', percent: 5 });

        const mappedSources = await getMappedSources();
        // Merge ALL_SOURCES with mapped sources so every enum value appears
        const sourceNames = ALL_SOURCES.filter((s, i, arr) => arr.indexOf(s) === i).sort();

        const foodCountResult = await db.execute(sql`SELECT COUNT(*) as total FROM foods`);
        const foodCountRows = (foodCountResult as any).rows ?? foodCountResult;
        const totalFoods = parseInt((foodCountRows[0] as any).total);

        send({ type: 'progress', detail: `Found ${sourceNames.length} sources, ${totalFoods} foods`, percent: 10 });

        const sources: SourceEntry[] = [];

        for (let i = 0; i < sourceNames.length; i++) {
          const sourceName = sourceNames[i];
          const mapped = mappedSources.get(sourceName);
          const pct = 10 + Math.round(((i) / sourceNames.length) * 85);
          send({ type: 'progress', detail: `${sourceName} (${i + 1}/${sourceNames.length})`, percent: pct });

          if (!mapped) {
            // Source has no compound_sources entries — show as 0/0
            const entry: SourceEntry = {
              source: sourceName,
              totalCompounds: 0,
              coveredCompounds: 0,
              foodCount: 0,
              compoundFoodCounts: [],
            };
            sources.push(entry);
            send({ type: 'source', source: entry });
            continue;
          }

          try {
            const { foodCounts, foodCount } = await getSourceCoverage(mapped.rawSources);
            const entry: SourceEntry = {
              source: sourceName,
              totalCompounds: mapped.total,
              coveredCompounds: foodCounts.length,
              foodCount,
              compoundFoodCounts: foodCounts,
            };
            sources.push(entry);
            send({ type: 'source', source: entry });
          } catch {
            const entry: SourceEntry = {
              source: sourceName,
              totalCompounds: mapped.total,
              coveredCompounds: 0,
              foodCount: 0,
              compoundFoodCounts: [],
            };
            sources.push(entry);
            send({ type: 'source', source: entry });
          }
        }

        // Sort by coverage percentage descending
        sources.sort((a, b) => {
          const pctA = a.totalCompounds > 0 ? a.coveredCompounds / a.totalCompounds : 0;
          const pctB = b.totalCompounds > 0 ? b.coveredCompounds / b.totalCompounds : 0;
          return pctB - pctA;
        });

        send({ type: 'complete', sources, totalFoods });
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

// ---------- JSON overview (non-streaming fallback) ----------

async function getOverview() {
  const mappedSources = await getMappedSources();
  const sourceNames = ALL_SOURCES.filter((s, i, arr) => arr.indexOf(s) === i).sort();

  const foodCountResult = await db.execute(sql`SELECT COUNT(*) as total FROM foods`);
  const foodCountRows = (foodCountResult as any).rows ?? foodCountResult;
  const totalFoods = parseInt((foodCountRows[0] as any).total);

  const sources: SourceEntry[] = [];
  for (const sourceName of sourceNames) {
    const mapped = mappedSources.get(sourceName);
    if (!mapped) {
      sources.push({
        source: sourceName,
        totalCompounds: 0,
        coveredCompounds: 0,
        foodCount: 0,
        compoundFoodCounts: [],
      });
      continue;
    }
    try {
      const { foodCounts, foodCount } = await getSourceCoverage(mapped.rawSources);
      sources.push({
        source: sourceName,
        totalCompounds: mapped.total,
        coveredCompounds: foodCounts.length,
        foodCount,
        compoundFoodCounts: foodCounts,
      });
    } catch {
      sources.push({
        source: sourceName,
        totalCompounds: mapped.total,
        coveredCompounds: 0,
        foodCount: 0,
        compoundFoodCounts: [],
      });
    }
  }

  sources.sort((a, b) => {
    const pctA = a.totalCompounds > 0 ? a.coveredCompounds / a.totalCompounds : 0;
    const pctB = b.totalCompounds > 0 ? b.coveredCompounds / b.totalCompounds : 0;
    return pctB - pctA;
  });

  return NextResponse.json({ sources, totalFoods });
}

// ---------- Source detail ----------

async function getSourceDetail(source: string) {
  // Find all raw source names for this normalized source
  const mappedSources = await getMappedSources();
  const mapped = mappedSources.get(source);
  const rawSources = mapped ? mapped.rawSources : [source];

  // Query for each raw source variant and merge results
  const compounds: Array<{
    name: string;
    type: string;
    externalId: string;
    foodCount: number;
  }> = [];

  for (const raw of rawSources) {
    const result = await db.execute(sql`
      WITH source_coverage AS (
        SELECT
          mn.compound_id,
          COUNT(DISTINCT mn.food_id) as food_count
        FROM nutrient_source_values nsv
        JOIN merged_nutrients mn ON mn.id = nsv.merged_nutrient_id
        WHERE nsv.api_source::text = ${raw} AND mn.compound_id IS NOT NULL
        GROUP BY mn.compound_id
      )
      SELECT
        c.name as compound_name,
        c.compound_type,
        cs.external_id,
        COALESCE(sc.food_count, 0) as food_count
      FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      LEFT JOIN source_coverage sc ON sc.compound_id = cs.compound_id
      WHERE cs.external_source = ${raw}
      ORDER BY food_count DESC, c.name
    `);

    const rows = ((result as any).rows ?? result) as Array<{
      compound_name: string;
      compound_type: string;
      external_id: string;
      food_count: string;
    }>;

    for (const r of rows) {
      compounds.push({
        name: r.compound_name,
        type: r.compound_type,
        externalId: r.external_id,
        foodCount: parseInt(r.food_count),
      });
    }
  }

  // Sort by food count descending
  compounds.sort((a, b) => b.foodCount - a.foodCount || a.name.localeCompare(b.name));

  return NextResponse.json({ source, compounds });
}
