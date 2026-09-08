/**
 * PATCH /api/admin/compound/[id]
 * Updates compound name and/or compound_type. Used by the source-inspect page
 * for inline metadata fixes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

const VALID_TYPES = [
  'MACRONUTRIENT', 'VITAMIN', 'MINERAL', 'AMINO_ACID', 'NUCLEOTIDE',
  'FATTY_ACID', 'CARBOHYDRATE', 'POLYPHENOL', 'CAROTENOID', 'ALKALOID',
  'GLUCOSINOLATE', 'TERPENOID', 'STEROL', 'ORGANIC_ACID', 'ANTI_NUTRIENT',
  'HEAVY_METAL', 'MYCOTOXIN', 'PESTICIDE_RESIDUE', 'PLASTICIZER',
  'PROCESSING_COMPOUND', 'SYNTHETIC_ADDITIVE',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Admin-only. Middleware is a second line of defence, not a boundary
  // (see CVE-2025-29927: middleware can be skipped entirely).
  const denied = await requireAdmin();
  if (denied) return denied;


  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid compound id' }, { status: 400 });

    const body = await request.json();
    const { name, compoundType } = body;

    if (name == null && compoundType == null) {
      return NextResponse.json({ error: 'Provide name and/or compoundType' }, { status: 400 });
    }
    if (compoundType != null && !VALID_TYPES.includes(compoundType)) {
      return NextResponse.json({ error: `Invalid compoundType. Valid: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    if (name != null && (typeof name !== 'string' || name.trim().length === 0 || name.length > 200)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    if (name != null && compoundType != null) {
      await db.execute(sql`UPDATE compounds SET name = ${name}, compound_type = ${compoundType} WHERE id = ${id}`);
    } else if (name != null) {
      await db.execute(sql`UPDATE compounds SET name = ${name} WHERE id = ${id}`);
    } else {
      await db.execute(sql`UPDATE compounds SET compound_type = ${compoundType} WHERE id = ${id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Compound update error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
