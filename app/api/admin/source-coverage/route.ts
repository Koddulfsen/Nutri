/**
 * GET /api/admin/source-coverage?source=MEXT
 *
 * Compound-centric view: list ALL Nutri core compounds and show what mappings
 * (if any) the requested source provides for each. Inverse of /source-inspect
 * which lists mappings and asks "what compound does this point to?".
 *
 * Returns:
 *   - all core compounds grouped by compound_type
 *   - for each compound: 0+ mappings (compound_sources rows for this source)
 *   - stats: total / mapped / gaps / multi / verified / review / flagged
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference, getSourceNutrientReferenceWithProgress, isSourceNutrientReferenceCached } from '@/lib/services/source-nutrient-reference';
import { requireAdmin } from '@/lib/auth/api-guard';

const SUPPORTED_SOURCES = [
  'AFCD', 'ASEANFOODS', 'BLS', 'CIQUAL', 'CNF', 'DUKE', 'FDC', 'FINELI', 'FOODB', 'FOODFILES',
  'FRIDA', 'INDB', 'KFCT', 'MATVARETABELLEN', 'MEXT', 'NEVO', 'UK_COFID',
];

interface MappingRow {
  csId: string;
  externalId: string;
  ourSourceName: string | null;
  ourSourceUnit: string | null;
  conversionFactor: string | null;
  actualName: string | null;
  actualUnit: string | null;
  resolved: boolean;
  status: string;
  notes: string | null;
}

interface CompoundRow {
  compoundId: string;
  name: string;
  unit: string;
  type: string;
  mappings: MappingRow[];
}

export async function GET(request: NextRequest) {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const stream = searchParams.get('stream') === 'true';
    if (!source) return NextResponse.json({ supportedSources: SUPPORTED_SOURCES });
    if (!SUPPORTED_SOURCES.includes(source)) {
      return NextResponse.json({ error: `Unsupported source. Supported: ${SUPPORTED_SOURCES.join(', ')}` }, { status: 400 });
    }

    if (stream) {
      return handleStreamingRequest(source);
    }

    // 1. All core compounds
    const compoundsRaw = await db.execute(sql`
      SELECT id, name, unit, compound_type::text as compound_type
      FROM compounds
      WHERE tier = 'core'
      ORDER BY compound_type, name
    `);
    const compoundsRows = (compoundsRaw as any).rows ?? compoundsRaw;

    // 2. All mappings for this source
    const mappingsRaw = await db.execute(sql`
      SELECT cs.id as cs_id, cs.compound_id, cs.external_id, cs.source_name, cs.source_unit, cs.conversion_factor,
             csv.status, csv.notes
      FROM compound_sources cs
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      WHERE cs.external_source = ${source}
    `);
    const mappingsRows = (mappingsRaw as any).rows ?? mappingsRaw;

    // 3. Source nutrient reference for actual names
    const ref = await getSourceNutrientReference();

    // Group mappings by compound_id
    const mappingsByCompound = new Map<string, MappingRow[]>();
    for (const m of mappingsRows) {
      const row = m as any;
      const hit = ref.get(`${source}:${row.external_id}`) ?? null;
      const mr: MappingRow = {
        csId: row.cs_id,
        externalId: row.external_id,
        ourSourceName: row.source_name,
        ourSourceUnit: row.source_unit,
        conversionFactor: row.conversion_factor,
        actualName: hit?.name ?? null,
        actualUnit: hit?.unit ?? null,
        resolved: hit !== null,
        status: row.status ?? 'unverified',
        notes: row.notes,
      };
      if (!mappingsByCompound.has(row.compound_id)) mappingsByCompound.set(row.compound_id, []);
      mappingsByCompound.get(row.compound_id)!.push(mr);
    }

    // Assemble compound rows
    const compounds: CompoundRow[] = [];
    for (const c of compoundsRows) {
      const row = c as any;
      compounds.push({
        compoundId: row.id,
        name: row.name,
        unit: row.unit,
        type: row.compound_type,
        mappings: mappingsByCompound.get(row.id) ?? [],
      });
    }

    // Stats
    const totalCompounds = compounds.length;
    const compoundsWithAtLeastOneActiveMapping = compounds.filter(c => c.mappings.some(m => m.status !== 'flagged')).length;
    const gaps = compounds.filter(c => c.mappings.length === 0 || c.mappings.every(m => m.status === 'flagged')).length;
    const multiMapped = compounds.filter(c => c.mappings.filter(m => m.status !== 'flagged').length > 1).length;

    const allMappings = compounds.flatMap(c => c.mappings);
    const verified = allMappings.filter(m => m.status === 'verified').length;
    const review = allMappings.filter(m => m.status === 'review').length;
    const flagged = allMappings.filter(m => m.status === 'flagged').length;
    const unverified = allMappings.filter(m => m.status === 'unverified').length;

    return NextResponse.json({
      source,
      stats: {
        totalCompounds,
        mapped: compoundsWithAtLeastOneActiveMapping,
        gaps,
        multiMapped,
        totalMappings: allMappings.length,
        verified,
        review,
        flagged,
        unverified,
      },
      compounds,
    });
  } catch (error: any) {
    console.error('Source coverage error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function handleStreamingRequest(source: string): Promise<Response> {
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      try {
        const cached = isSourceNutrientReferenceCached();
        send({ type: 'progress', step: 'init', detail: cached ? 'Reference cached — fast path' : 'Building source nutrient reference (first load, ~30s)…', percent: 5 });

        const ref = cached
          ? await getSourceNutrientReference()
          : await getSourceNutrientReferenceWithProgress((step, detail, refPct) => {
              const overall = 5 + Math.round(refPct * 0.7);
              send({ type: 'progress', step, detail, percent: overall });
            });

        send({ type: 'progress', step: 'compounds', detail: 'Loading core compounds…', percent: 80 });
        const compoundsRaw = await db.execute(sql`
          SELECT id, name, unit, compound_type::text as compound_type
          FROM compounds WHERE tier = 'core'
          ORDER BY compound_type, name
        `);
        const compoundsRows = (compoundsRaw as any).rows ?? compoundsRaw;

        send({ type: 'progress', step: 'mappings', detail: `Loading ${source} mappings…`, percent: 88 });
        const mappingsRaw = await db.execute(sql`
          SELECT cs.id as cs_id, cs.compound_id, cs.external_id, cs.source_name, cs.source_unit, cs.conversion_factor,
                 csv.status, csv.notes
          FROM compound_sources cs
          LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
          WHERE cs.external_source = ${source}
        `);
        const mappingsRows = (mappingsRaw as any).rows ?? mappingsRaw;

        send({ type: 'progress', step: 'assemble', detail: 'Assembling…', percent: 95 });

        const mappingsByCompound = new Map<string, any[]>();
        for (const m of mappingsRows) {
          const row = m as any;
          const hit = ref.get(`${source}:${row.external_id}`) ?? null;
          const mr = {
            csId: row.cs_id, externalId: row.external_id, ourSourceName: row.source_name,
            ourSourceUnit: row.source_unit, conversionFactor: row.conversion_factor,
            actualName: hit?.name ?? null, actualUnit: hit?.unit ?? null,
            resolved: hit !== null, status: row.status ?? 'unverified', notes: row.notes,
          };
          if (!mappingsByCompound.has(row.compound_id)) mappingsByCompound.set(row.compound_id, []);
          mappingsByCompound.get(row.compound_id)!.push(mr);
        }

        const compounds = compoundsRows.map((c: any) => ({
          compoundId: c.id, name: c.name, unit: c.unit, type: c.compound_type,
          mappings: mappingsByCompound.get(c.id) ?? [],
        }));

        const totalCompounds = compounds.length;
        const mapped = compounds.filter((c: any) => c.mappings.some((m: any) => m.status !== 'flagged')).length;
        const gaps = compounds.filter((c: any) => c.mappings.length === 0 || c.mappings.every((m: any) => m.status === 'flagged')).length;
        const multiMapped = compounds.filter((c: any) => c.mappings.filter((m: any) => m.status !== 'flagged').length > 1).length;
        const allMappings = compounds.flatMap((c: any) => c.mappings);

        send({
          type: 'complete',
          source,
          stats: {
            totalCompounds, mapped, gaps, multiMapped,
            totalMappings: allMappings.length,
            verified: allMappings.filter((m: any) => m.status === 'verified').length,
            review: allMappings.filter((m: any) => m.status === 'review').length,
            flagged: allMappings.filter((m: any) => m.status === 'flagged').length,
            unverified: allMappings.filter((m: any) => m.status === 'unverified').length,
          },
          compounds,
        });
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
