/**
 * GET /api/admin/source-inspect?source=AFCD
 *
 * Returns every active mapping for the source, side-by-side with what the
 * source's own catalog says about that external_id. No editing, no scoring —
 * pure inspection.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSourceNutrientReference } from '@/lib/services/source-nutrient-reference';
import { normalizeSource } from '@/lib/utils/source-normalize';
import { requireAdmin } from '@/lib/auth/api-guard';

const SUPPORTED_SOURCES = [
  'AFCD', 'ASEANFOODS', 'BLS', 'CIQUAL', 'CNF', 'DUKE', 'FDC', 'FINELI', 'FOODB', 'FOODFILES',
  'FRIDA', 'INDB', 'KFCT', 'MATVARETABELLEN', 'MEXT', 'NEVO', 'UK_COFID',
];

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
    const source = searchParams.get('source');
    if (!source) {
      return NextResponse.json({ supportedSources: SUPPORTED_SOURCES });
    }
    if (!SUPPORTED_SOURCES.includes(source)) {
      return NextResponse.json({ error: `Unsupported source. Supported: ${SUPPORTED_SOURCES.join(', ')}` }, { status: 400 });
    }

    const ref = await getSourceNutrientReference();

    // Pull all mappings for this source (skip dead-flagged)
    const rows = await db.execute(sql`
      SELECT
        cs.id as cs_id,
        c.id as compound_id, c.name as compound_name, c.unit as compound_unit, c.compound_type,
        cs.external_id, cs.source_name, cs.source_unit, cs.conversion_factor,
        csv.status as verification_status, csv.notes as verification_notes
      FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      WHERE cs.external_source = ${source}
      ORDER BY c.name ASC
    `);
    const mappings = ((rows as any).rows ?? rows) as any[];

    // Look up each mapping in the source's catalog
    const enriched = mappings.map((m: any) => {
      const normalized = normalizeSource(source);
      const hit = ref.get(`${source}:${m.external_id}`) ?? ref.get(`${normalized}:${m.external_id}`) ?? null;
      return {
        csId: m.cs_id,
        compoundId: m.compound_id,
        compoundName: m.compound_name,
        compoundUnit: m.compound_unit,
        compoundType: m.compound_type,
        externalId: m.external_id,
        ourSourceName: m.source_name,
        ourSourceUnit: m.source_unit,
        conversionFactor: m.conversion_factor,
        actualName: hit?.name ?? null,
        actualUnit: hit?.unit ?? null,
        resolved: hit !== null,
        verificationStatus: m.verification_status ?? 'unverified',
        verificationNotes: m.verification_notes,
      };
    });

    const stats = {
      total: enriched.length,
      resolved: enriched.filter(e => e.resolved).length,
      broken: enriched.filter(e => !e.resolved).length,
      verified: enriched.filter(e => e.verificationStatus === 'verified').length,
      review: enriched.filter(e => e.verificationStatus === 'review').length,
      flagged: enriched.filter(e => e.verificationStatus === 'flagged').length,
      unverified: enriched.filter(e => e.verificationStatus === 'unverified').length,
    };

    return NextResponse.json({
      source,
      stats,
      mappings: enriched,
    });
  } catch (error: any) {
    console.error('Source inspect error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
