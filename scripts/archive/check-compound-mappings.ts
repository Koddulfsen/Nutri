import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkMappings() {
  // Check compound_sources table structure
  console.log('=== Compound Source Mappings ===\n');

  // Count mappings per source
  const mappings = await db.execute(sql`
    SELECT external_source, COUNT(*) as mapping_count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY mapping_count DESC
  `);
  const mappingRows = (mappings as any).rows ?? mappings;
  console.log('Mappings per source:');
  mappingRows.forEach((r: any) => console.log(`  - ${r.external_source}: ${r.mapping_count} compounds mapped`));

  // Check FooDB specifically
  console.log('\n=== FooDB Analysis ===');
  const foodbTotal = await db.execute(sql`SELECT COUNT(*) as count FROM source_foodb_compounds`);
  const foodbMapped = await db.execute(sql`
    SELECT COUNT(DISTINCT external_id) as count
    FROM compound_sources
    WHERE external_source = 'FooDB'
  `);
  const totalRows = (foodbTotal as any).rows ?? foodbTotal;
  const mappedRows = (foodbMapped as any).rows ?? foodbMapped;
  console.log(`  Total FooDB compounds: ${totalRows[0]?.count}`);
  console.log(`  Mapped to Nutri: ${mappedRows[0]?.count}`);
  console.log(`  Mapping rate: ${((mappedRows[0]?.count / totalRows[0]?.count) * 100).toFixed(1)}%`);

  // Check Duke specifically
  console.log('\n=== Duke Analysis ===');
  const dukeTotal = await db.execute(sql`SELECT COUNT(*) as count FROM source_duke_chemicals`);
  const dukeMapped = await db.execute(sql`
    SELECT COUNT(DISTINCT external_id) as count
    FROM compound_sources
    WHERE external_source = 'Duke'
  `);
  const dukeTotalRows = (dukeTotal as any).rows ?? dukeTotal;
  const dukeMappedRows = (dukeMapped as any).rows ?? dukeMapped;
  console.log(`  Total Duke chemicals: ${dukeTotalRows[0]?.count}`);
  console.log(`  Mapped to Nutri: ${dukeMappedRows[0]?.count}`);
  if (dukeTotalRows[0]?.count > 0) {
    console.log(`  Mapping rate: ${((dukeMappedRows[0]?.count / dukeTotalRows[0]?.count) * 100).toFixed(1)}%`);
  }

  // Check Phenol-Explorer
  console.log('\n=== Phenol-Explorer Analysis ===');
  const phenolTotal = await db.execute(sql`SELECT COUNT(*) as count FROM source_phenol_compounds`);
  const phenolMapped = await db.execute(sql`
    SELECT COUNT(DISTINCT external_id) as count
    FROM compound_sources
    WHERE external_source = 'Phenol-Explorer'
  `);
  const phenolTotalRows = (phenolTotal as any).rows ?? phenolTotal;
  const phenolMappedRows = (phenolMapped as any).rows ?? phenolMapped;
  console.log(`  Total Phenol compounds: ${phenolTotalRows[0]?.count}`);
  console.log(`  Mapped to Nutri: ${phenolMappedRows[0]?.count}`);
  console.log(`  Mapping rate: ${((phenolMappedRows[0]?.count / phenolTotalRows[0]?.count) * 100).toFixed(1)}%`);

  // Example: Check a specific food (milk in FooDB)
  console.log('\n=== Example: Milk in FooDB ===');
  const milkFood = await db.execute(sql`
    SELECT public_id, name
    FROM source_foodb_foods
    WHERE name ILIKE '%milk%' AND name ILIKE '%cow%'
    LIMIT 1
  `);
  const milkRows = (milkFood as any).rows ?? milkFood;
  if (milkRows.length > 0) {
    const milk = milkRows[0];
    console.log(`  Food: ${milk.name} (ID: ${milk.public_id})`);

    // Raw compound count from FooDB
    const rawCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM source_foodb_content
      WHERE food_id = ${milk.public_id}
    `);
    const rawRows = (rawCount as any).rows ?? rawCount;
    console.log(`  Raw FooDB compounds: ${rawRows[0]?.count}`);

    // Mapped compound count
    const mappedCount = await db.execute(sql`
      SELECT COUNT(DISTINCT cs.compound_id) as count
      FROM source_foodb_content fc
      JOIN compound_sources cs ON cs.external_id = fc.source_id::text
        AND cs.external_source = 'FooDB'
      WHERE fc.food_id = ${milk.public_id}
    `);
    const mappedCountRows = (mappedCount as any).rows ?? mappedCount;
    console.log(`  Mapped to Nutri compounds: ${mappedCountRows[0]?.count}`);
  }

  process.exit(0);
}

checkMappings();
