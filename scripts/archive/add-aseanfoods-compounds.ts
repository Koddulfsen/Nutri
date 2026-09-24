/**
 * ASEANFOODS Integration Script
 *
 * Maps ASEANFOODS INFOODS tagnames to Nutri compound IDs.
 * ASEANFOODS uses standard INFOODS tagnames for 21 nutrients.
 *
 * Source: ASEAN Food Composition Database, Electronic Version 1 (2014)
 * URL: https://inmu.mahidol.ac.th/aseanfoods/
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

const SOURCE = 'ASEANFOODS';

// ASEANFOODS uses INFOODS tagnames
const aseanfoodsMappings: { code: string; compoundName: string; isCanonical: boolean; sourceUnit: string }[] = [
  // Proximate
  { code: 'WATER', compoundName: 'Water', isCanonical: true, sourceUnit: 'g' },
  { code: 'PROCNT', compoundName: 'Protein', isCanonical: true, sourceUnit: 'g' },
  { code: 'FAT', compoundName: 'Total Fat', isCanonical: true, sourceUnit: 'g' },
  { code: 'FIBTG', compoundName: 'Total Fiber', isCanonical: true, sourceUnit: 'g' },
  { code: 'CHOAVLDF', compoundName: 'Available Carbohydrate', isCanonical: true, sourceUnit: 'g' },
  { code: 'CHOCDF', compoundName: 'Total Carbohydrate', isCanonical: true, sourceUnit: 'g' },
  { code: 'ASH', compoundName: 'Ash', isCanonical: true, sourceUnit: 'g' },
  { code: 'ENERC', compoundName: 'Energy', isCanonical: true, sourceUnit: 'kcal' },

  // Minerals
  { code: 'CA', compoundName: 'Calcium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'P', compoundName: 'Phosphorus', isCanonical: true, sourceUnit: 'mg' },
  { code: 'FE', compoundName: 'Iron', isCanonical: true, sourceUnit: 'mg' },
  { code: 'NA', compoundName: 'Sodium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'K', compoundName: 'Potassium', isCanonical: true, sourceUnit: 'mg' },
  { code: 'CU', compoundName: 'Copper', isCanonical: true, sourceUnit: 'mg' },
  { code: 'ZN', compoundName: 'Zinc', isCanonical: true, sourceUnit: 'mg' },

  // Vitamins
  { code: 'THIA', compoundName: 'Thiamin', isCanonical: true, sourceUnit: 'mg' },
  { code: 'RIBF', compoundName: 'Riboflavin', isCanonical: true, sourceUnit: 'mg' },
  { code: 'NIA', compoundName: 'Niacin', isCanonical: true, sourceUnit: 'mg' },
  { code: 'VITC', compoundName: 'Vitamin C', isCanonical: true, sourceUnit: 'mg' },
  { code: 'RETOL', compoundName: 'Retinol', isCanonical: true, sourceUnit: 'µg' },
  { code: 'CARTB', compoundName: 'Beta-Carotene', isCanonical: true, sourceUnit: 'µg' },
  { code: 'VITA_RAE', compoundName: 'Vitamin A', isCanonical: true, sourceUnit: 'µg' },
];

async function main() {
  console.log('=== ASEANFOODS Compound Mapping ===\n');
  console.log('Mapping INFOODS tagnames to Nutri compounds...\n');

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of aseanfoodsMappings) {
    // Find compound
    const result = await db.execute(
      sql`SELECT id, name FROM compounds WHERE name = ${mapping.compoundName} LIMIT 1`
    );

    const compound = (result as any[])[0];

    if (!compound) {
      console.log(`✗ ${mapping.code}: Compound "${mapping.compoundName}" not found`);
      failed++;
      continue;
    }

    // Check if mapping exists
    const existing = await db.execute(
      sql`SELECT id FROM compound_sources
          WHERE external_source = ${SOURCE} AND external_id = ${mapping.code} LIMIT 1`
    );

    if ((existing as any[]).length > 0) {
      skipped++;
      continue;
    }

    // Insert mapping
    await db.execute(
      sql`INSERT INTO compound_sources (compound_id, external_source, external_id, source_unit, is_canonical)
          VALUES (${compound.id}, ${SOURCE}, ${mapping.code}, ${mapping.sourceUnit}, ${mapping.isCanonical})`
    );

    console.log(`✓ ${mapping.code} → ${mapping.compoundName}`);
    created++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Show totals
  const totalMappings = await db.execute(
    sql`SELECT COUNT(*) as count FROM compound_sources WHERE external_source = ${SOURCE}`
  );
  console.log(`\nTotal ASEANFOODS mappings: ${(totalMappings as any[])[0].count}`);

  // Show all sources
  const allSources = await db.execute(
    sql`SELECT external_source, COUNT(*) as count
        FROM compound_sources
        GROUP BY external_source
        ORDER BY count DESC`
  );

  console.log(`\nAll source mappings:`);
  for (const row of allSources as any[]) {
    console.log(`  ${row.external_source}: ${row.count}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
