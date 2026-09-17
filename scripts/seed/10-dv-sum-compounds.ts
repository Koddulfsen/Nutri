/**
 * Seed compounds that DV authorities publish values for but that no single food-source nutrient
 * represents. They have no food mappings: intake is derived from their components at read time.
 *
 *   EPA + DHA                 = EPA + DHA
 *   Methionine + Cysteine     = Methionine + Cysteine
 *   Phenylalanine + Tyrosine  = Phenylalanine + Tyrosine
 *   Vitamin A (RE)            = retinol + β-carotene / 6 + other provitamin A carotenoids / 12
 *                               (retinol equivalents; RAE uses 12 and 24 instead)
 *
 * Idempotent: existing rows are left as they are and reported.
 *
 * Run: DATABASE_URL="$MIGRATION_DATABASE_URL" npx tsx scripts/seed/10-dv-sum-compounds.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const compounds: Array<{ name: string; type: string; unit: string; parent: string | null; description: string }> = [
  { name: 'EPA + DHA', type: 'FATTY_ACID', unit: 'g', parent: 'Omega-3',
    description: 'Sum of EPA (Eicosapentaenoic Acid) and DHA (Docosahexaenoic Acid). No food-source mapping: derived from its components.' },
  { name: 'Methionine + Cysteine', type: 'AMINO_ACID', unit: 'g', parent: null,
    description: 'Sum of Methionine and Cysteine (total sulphur amino acids). No food-source mapping: derived from its components.' },
  { name: 'Phenylalanine + Tyrosine', type: 'AMINO_ACID', unit: 'g', parent: null,
    description: 'Sum of Phenylalanine and Tyrosine (aromatic amino acids). No food-source mapping: derived from its components.' },
  { name: 'Vitamin A (RE)', type: 'VITAMIN', unit: 'µg', parent: null,
    description: 'Vitamin A as retinol equivalents: 1 µg RE = 1 µg retinol = 6 µg β-carotene = 12 µg other provitamin A carotenoids. Not interchangeable with RAE (β-carotene 12:1). No food-source mapping yet: derived from retinol and carotenoids.' },
];

async function seed() {
  for (const c of compounds) {
    const existing = await sql`SELECT id FROM compounds WHERE name = ${c.name}`;
    if (existing.length > 0) { console.log(`= ${c.name} (exists)`); continue; }
    let parentId: string | null = null;
    if (c.parent) {
      const p = await sql`SELECT id FROM compounds WHERE name = ${c.parent}`;
      if (p.length !== 1) throw new Error(`Parent ${c.parent} not found`);
      parentId = p[0].id;
    }
    await sql`INSERT INTO compounds (compound_type, tier, name, unit, parent_compound_id, description)
      VALUES (${c.type}::compound_type_enum, 'core', ${c.name}, ${c.unit}, ${parentId}, ${c.description})`;
    console.log(`✓ ${c.name} (created)`);
  }
  const [n] = await sql`SELECT COUNT(*)::int AS n FROM compounds`;
  console.log(`Compounds: ${n.n}`);
}

seed().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => sql.end());
