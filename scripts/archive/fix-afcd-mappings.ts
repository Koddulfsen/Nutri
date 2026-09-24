import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Missing compounds to add
const missingCompounds = [
  { name: 'Folic Acid', type: 'VITAMIN' as const, unit: 'ug', description: 'Synthetic form of folate used in supplements and fortification' },
  { name: 'Glycerol', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Sugar alcohol, backbone of triglycerides' },
  { name: 'Glycogen', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Storage form of glucose in animals' },
  { name: 'Maltodextrin', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Polysaccharide derived from starch' },
  { name: 'Erythritol', type: 'CARBOHYDRATE' as const, unit: 'g', description: 'Sugar alcohol with near-zero calories' },
  { name: 'Margaric Acid', type: 'FATTY_ACID' as const, unit: 'g', description: 'C17:0 - Heptadecanoic acid, saturated fatty acid' },
  { name: 'Gondoic Acid', type: 'FATTY_ACID' as const, unit: 'g', description: 'C20:1 - Monounsaturated omega-9 fatty acid' },
  { name: 'Adrenic Acid', type: 'FATTY_ACID' as const, unit: 'mg', description: 'C22:4w6 - Omega-6 polyunsaturated fatty acid' },
];

// Name corrections for AFCD mappings
const nameCorrections: Record<string, string> = {
  'EPA': 'Eicosapentaenoic Acid',
  'DPA': 'Docosapentaenoic Acid',
  'DHA': 'Docosahexaenoic Acid',
};

// Mappings to add after name corrections
const additionalMappings = [
  // EPA, DPA, DHA mappings
  { afcdName: 'C20:5w3 Eicosapentaenoic', nutriCompound: 'Eicosapentaenoic Acid', isCanonical: true },
  { afcdName: 'C22:5w3 Docosapentaenoic', nutriCompound: 'Docosapentaenoic Acid', isCanonical: true },
  { afcdName: 'C22:6w3 Docosahexaenoic', nutriCompound: 'Docosahexaenoic Acid', isCanonical: true },
  { afcdName: 'C20:5w3FD', nutriCompound: 'Eicosapentaenoic Acid', isCanonical: false },
  { afcdName: 'C22:5w3FD', nutriCompound: 'Docosapentaenoic Acid', isCanonical: false },
  { afcdName: 'C22:6w3FD', nutriCompound: 'Docosahexaenoic Acid', isCanonical: false },
  { afcdName: 'C20:5w3', nutriCompound: 'Eicosapentaenoic Acid', isCanonical: false },
  { afcdName: 'C22:5w3', nutriCompound: 'Docosapentaenoic Acid', isCanonical: false },
  { afcdName: 'C22:6w3', nutriCompound: 'Docosahexaenoic Acid', isCanonical: false },
  // Folic acid
  { afcdName: 'Folic acid', nutriCompound: 'Folic Acid', isCanonical: true },
  // Carbohydrates
  { afcdName: 'Glycerol', nutriCompound: 'Glycerol', isCanonical: true },
  { afcdName: 'Glycogen', nutriCompound: 'Glycogen', isCanonical: true },
  { afcdName: 'Maltodextrin', nutriCompound: 'Maltodextrin', isCanonical: true },
  { afcdName: 'Erythritol', nutriCompound: 'Erythritol', isCanonical: true },
  // Fatty acids
  { afcdName: 'C17FD', nutriCompound: 'Margaric Acid', isCanonical: true },
  { afcdName: 'C17', nutriCompound: 'Margaric Acid', isCanonical: false },
  { afcdName: 'C20:1FD', nutriCompound: 'Gondoic Acid', isCanonical: true },
  { afcdName: 'C20:1', nutriCompound: 'Gondoic Acid', isCanonical: false },
  { afcdName: 'C22:4w6FD', nutriCompound: 'Adrenic Acid', isCanonical: true },
  { afcdName: 'C22:4w6', nutriCompound: 'Adrenic Acid', isCanonical: false },
];

async function main() {
  console.log('=== Fixing AFCD Mappings ===\n');

  // Add missing compounds
  console.log('Adding missing compounds...');
  let addedCount = 0;

  for (const c of missingCompounds) {
    const existing = await db.execute(
      sql`SELECT id FROM compounds WHERE LOWER(name) = LOWER(${c.name})`
    );

    if ((existing as any).length > 0) {
      console.log(`⏭️  ${c.name} (exists)`);
      continue;
    }

    await db.execute(sql`
      INSERT INTO compounds (name, compound_type, unit, description)
      VALUES (${c.name}, ${c.type}, ${c.unit}, ${c.description})
    `);
    console.log(`✅ ${c.name}`);
    addedCount++;
  }

  console.log(`\nAdded ${addedCount} compounds\n`);

  // Add additional mappings
  console.log('Adding missing AFCD mappings...');
  let mappingCount = 0;

  for (const m of additionalMappings) {
    // Find compound
    const compound = await db.execute(
      sql`SELECT id FROM compounds WHERE LOWER(name) = LOWER(${m.nutriCompound})`
    );

    if ((compound as any).length === 0) {
      console.log(`❌ Compound not found: ${m.nutriCompound}`);
      continue;
    }

    const compoundId = (compound as any)[0].id;

    // Check if mapping exists
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'AFCD' AND external_id = ${m.afcdName}
    `);

    if ((existingMapping as any).length > 0) {
      continue;
    }

    // Insert mapping
    await db.execute(sql`
      INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
      VALUES (${compoundId}, 'AFCD', ${m.afcdName}, ${m.afcdName}, ${m.isCanonical})
    `);
    console.log(`✅ ${m.afcdName} → ${m.nutriCompound}`);
    mappingCount++;
  }

  console.log(`\nAdded ${mappingCount} mappings\n`);

  // Final counts
  const finalCount = await db.execute(sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);

  const compoundCount = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);

  console.log('=== Final Summary ===');
  console.log(`Total compounds: ${(compoundCount as any)[0]?.count}`);
  console.log('\nMappings by source:');
  (finalCount as any).forEach((r: any) => {
    console.log(`  ${r.external_source}: ${r.count}`);
  });
}

main().then(() => process.exit(0)).catch(console.error);
