/**
 * PATCH /api/admin/source-mapping
 * Body: { csId, externalId, sourceUnit, conversionFactor }
 *
 * Updates a compound_sources row's external_id, source_unit, conversion_factor
 * and marks the verification as 'verified' with an Auto-fix-style note.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest) {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { csId, externalId, sourceUnit, conversionFactor } = body;

    if (!csId || !UUID_RE.test(csId)) return NextResponse.json({ error: 'Invalid csId' }, { status: 400 });
    if (!externalId || typeof externalId !== 'string') return NextResponse.json({ error: 'externalId required' }, { status: 400 });

    // Check for unique constraint conflict
    const conflict = await db.execute(sql`
      SELECT cs.id, c.name FROM compound_sources cs
      JOIN compounds c ON c.id = cs.compound_id
      WHERE cs.external_source = (SELECT external_source FROM compound_sources WHERE id = ${csId})
        AND cs.external_id = ${externalId}
        AND cs.id != ${csId}
      LIMIT 1
    `);
    const conflictRows = ((conflict as any).rows ?? conflict) as any[];
    if (conflictRows.length > 0) {
      return NextResponse.json({
        error: `That external_id is already mapped to compound "${conflictRows[0].name}" (cs_id: ${conflictRows[0].id}). Cannot create duplicate.`,
      }, { status: 409 });
    }

    const cf = conversionFactor != null ? String(conversionFactor) : '1.0';
    const su = sourceUnit ?? null;

    await db.execute(sql`
      UPDATE compound_sources
      SET external_id = ${externalId},
          source_unit = COALESCE(${su}, source_unit),
          conversion_factor = ${cf}
      WHERE id = ${csId}
    `);

    const note = `Inline fix: external_id="${externalId}", source_unit="${su ?? '-'}", cf=${cf}`;
    await db.execute(sql`
      INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_by, verified_at)
      VALUES (${csId}, 'verified', ${note}, ${user.id}, NOW())
      ON CONFLICT (compound_source_id) DO UPDATE SET
        status = 'verified',
        notes = EXCLUDED.notes,
        verified_by = EXCLUDED.verified_by,
        verified_at = NOW()
    `);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Source mapping update error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
