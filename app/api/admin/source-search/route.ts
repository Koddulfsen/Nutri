/**
 * GET /api/admin/source-search?source=AFCD&q=arachidonic
 * Searches a source's nutrient catalog by name (ILIKE %q%). Returns up to 20.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/api-guard';

interface Adapter {
  source: string;
  table: string;
  idColumn: string;
  nameColumn: string;
  unitColumn?: string;
}

const ADAPTERS: Record<string, Adapter> = {
  AFCD: { source: 'AFCD', table: 'source_afcd_nutrients', idColumn: 'nutrient_index', nameColumn: 'name', unitColumn: 'unit' },
  CIQUAL: { source: 'CIQUAL', table: 'source_ciqual_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  UK_COFID: { source: 'UK_COFID', table: 'source_cofid_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  FINELI: { source: 'FINELI', table: 'source_fineli_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  BLS: { source: 'BLS', table: 'source_bls_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  NEVO: { source: 'NEVO', table: 'source_nevo_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  FRIDA: { source: 'FRIDA', table: 'source_frida_nutrients', idColumn: 'eurofir_code', nameColumn: 'name', unitColumn: 'unit' },
  MATVARETABELLEN: { source: 'MATVARETABELLEN', table: 'source_matvaretabellen_nutrients', idColumn: 'eurofir_code', nameColumn: 'name', unitColumn: 'unit' },
  FOODFILES: { source: 'FOODFILES', table: 'source_foodfiles_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  MEXT: { source: 'MEXT', table: 'source_mext_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  KFCT: { source: 'KFCT', table: 'source_kfct_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  INDB: { source: 'INDB', table: 'source_indb_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  ASEANFOODS: { source: 'ASEANFOODS', table: 'source_aseanfoods_nutrients', idColumn: 'nutrient_code', nameColumn: 'name', unitColumn: 'unit' },
  FOODB: { source: 'FOODB', table: 'source_foodb_compounds', idColumn: 'public_id', nameColumn: 'name' },
  FDC: { source: 'FDC', table: 'source_fdc_nutrients', idColumn: 'nutrient_id', nameColumn: 'name', unitColumn: 'unit' },
  CNF: { source: 'CNF', table: 'source_cnf_nutrients', idColumn: 'nutrient_id', nameColumn: 'name', unitColumn: 'unit' },
  DUKE: { source: 'DUKE', table: 'source_duke_chemicals', idColumn: 'chem_id', nameColumn: 'name' },
};

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
    const q = searchParams.get('q')?.trim() ?? '';

    if (!source || !ADAPTERS[source]) {
      return NextResponse.json({ error: 'Invalid or unsupported source' }, { status: 400 });
    }
    if (q.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const adapter = ADAPTERS[source];
    const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;

    const result = await db.execute(sql.raw(`
      SELECT ${adapter.idColumn}::text AS id, ${adapter.nameColumn} AS name${adapter.unitColumn ? `, ${adapter.unitColumn} AS unit` : ', NULL AS unit'}
      FROM ${adapter.table}
      WHERE ${adapter.nameColumn} ILIKE '${pattern.replace(/'/g, "''")}'
         OR ${adapter.idColumn}::text ILIKE '${pattern.replace(/'/g, "''")}'
      ORDER BY length(${adapter.nameColumn}) ASC, ${adapter.nameColumn} ASC
      LIMIT 20
    `));
    let rows = ((result as any).rows ?? result) as Array<{ id: string; name: string; unit: string | null }>;

    // FOODB virtual macro IDs — not in source_foodb_compounds catalog but have content data
    if (source === 'FOODB') {
      const FOODB_MACROS: Array<{ id: string; name: string; unit: string | null }> = [
        { id: '1', name: 'Total Fat (macro)', unit: null },
        { id: '2', name: 'Protein (macro)', unit: null },
        { id: '3', name: 'Carbohydrate (macro)', unit: null },
        { id: '5', name: 'Dietary Fiber (macro)', unit: null },
        { id: '38', name: 'Energy (macro)', unit: null },
      ];
      const ql = q.toLowerCase();
      const matched = FOODB_MACROS.filter(m =>
        m.id === q || m.name.toLowerCase().includes(ql) || (q.length === 1 && m.id === q)
      );
      // Prepend macros, dedupe by id
      const seen = new Set(rows.map(r => r.id));
      rows = [...matched.filter(m => !seen.has(m.id)), ...rows];
    }

    return NextResponse.json({ source, query: q, results: rows });
  } catch (error: any) {
    console.error('Source search error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
