/**
 * GET /api/admin/core-compounds
 *
 * Returns all core-tier compounds with their source mappings and verification status.
 * Used by the core compounds audit page to review and clean up mapping inconsistencies.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

export async function GET() {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    if (process.env.NODE_ENV !== 'development') {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.compound_type  AS type,
        c.unit,
        c.parent_compound_id AS parent_id,
        cs.id            AS cs_id,
        cs.external_source AS source,
        cs.external_id,
        cs.source_name,
        cs.source_unit,
        cs.conversion_factor,
        cs.is_canonical,
        csv.status       AS verification_status
      FROM compounds c
      LEFT JOIN compound_sources cs ON cs.compound_id = c.id
      LEFT JOIN compound_source_verifications csv ON csv.compound_source_id = cs.id
      WHERE c.tier = 'core'
      ORDER BY c.name, cs.external_source
    `);

    const rawRows = (rows as any).rows ?? rows;

    // Group mappings under each compound
    const compoundMap = new Map<string, {
      id: string; name: string; type: string; unit: string; parentId: string | null;
      mappings: Array<{
        csId: string; source: string; externalId: string; sourceName: string | null;
        sourceUnit: string | null; conversionFactor: string; isCanonical: boolean;
        verificationStatus: string;
      }>;
    }>();

    for (const row of rawRows as any[]) {
      if (!compoundMap.has(row.id)) {
        compoundMap.set(row.id, {
          id: row.id,
          name: row.name,
          type: row.type,
          unit: row.unit,
          parentId: row.parent_id ?? null,
          mappings: [],
        });
      }
      if (row.cs_id) {
        compoundMap.get(row.id)!.mappings.push({
          csId: row.cs_id,
          source: row.source,
          externalId: row.external_id,
          sourceName: row.source_name ?? null,
          sourceUnit: row.source_unit ?? null,
          conversionFactor: row.conversion_factor ?? '1.0',
          isCanonical: row.is_canonical ?? false,
          verificationStatus: row.verification_status ?? 'unverified',
        });
      }
    }

    return NextResponse.json({ compounds: Array.from(compoundMap.values()) });
  } catch (error: any) {
    console.error('core-compounds error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
