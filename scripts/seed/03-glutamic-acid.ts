/**
 * Seed Core Compounds: Glutamic Acid
 * Run: npx tsx scripts/seed/03-glutamic-acid.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!);

const compound = { name: 'Glutamic Acid', unit: 'g', type: 'AMINO_ACID' };
const mappings = [
  { source: 'FDC', externalId: '1224', sourceName: 'Glutamic acid', sourceUnit: 'g', conversionFactor: '1.0', isCanonical: true },
  { source: 'CNF', externalId: '515', sourceName: 'GLUTAMIC ACID', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'AFCD', externalId: 'Glutamic acid', sourceName: 'Glutamic acid', sourceUnit: 'mg/g N', conversionFactor: '1.0' },
  { source: 'FOODfiles', externalId: 'GLU', sourceName: 'Glutamic acid', sourceUnit: 'mg', conversionFactor: '0.001' },
  { source: 'BLS', externalId: 'GLU', sourceName: 'Glutaminsäure, inklusive Glutamin', sourceUnit: 'g', conversionFactor: '1.0' },
  { source: 'FRIDA', externalId: '150', sourceName: 'Glutaminsyre', sourceUnit: 'mg', conversionFactor: '0.001' },
  { source: 'FooDB', externalId: '12538', sourceName: 'L-Glutamic acid', sourceUnit: 'g', conversionFactor: '1.0' },
];

async function seed() {
  console.log('Seeding Glutamic Acid...\n');
  const existing = await sql`SELECT id FROM compounds WHERE name = ${compound.name}`;
  let compoundId: string;
  if (existing.length > 0) { compoundId = existing[0].id; await sql`UPDATE compounds SET tier = 'core', unit = ${compound.unit} WHERE id = ${compoundId}`; console.log(`~ ${compound.name} (updated)`); }
  else { const [row] = await sql`INSERT INTO compounds (compound_type, tier, name, unit) VALUES (${compound.type}::compound_type_enum, 'core', ${compound.name}, ${compound.unit}) RETURNING id`; compoundId = row.id; console.log(`✓ ${compound.name} (created)`); }
  let inserted = 0;
  for (const m of mappings) { const result = await sql`INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical) VALUES (${compoundId}, ${m.source}, ${m.externalId}, ${m.sourceName}, ${m.sourceUnit}, ${m.conversionFactor}, ${m.isCanonical ?? false}) ON CONFLICT (external_source, external_id) DO NOTHING RETURNING id`; if (result.length > 0) inserted++; }
  console.log(`  └─ ${inserted}/${mappings.length} mappings inserted\n`);
  const total = await sql`SELECT COUNT(*) as n FROM compounds WHERE tier = 'core'`;
  const totalMappings = await sql`SELECT COUNT(*) as n FROM compound_sources`;
  console.log('─'.repeat(40) + `\nCore compounds: ${total[0].n}\nTotal mappings: ${totalMappings[0].n}`);
}
seed().catch(console.error).finally(() => sql.end());
