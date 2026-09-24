import 'dotenv/config';
import postgres from 'postgres';

/**
 * Test the food enrichment pipeline
 */
async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('🧪 Testing Food Enrichment Pipeline\n');

  // Test foods to try
  const testFoods = [
    'Broccoli',
    'Apple',
    'Spinach',
    'Salmon',
    'Tomato',
    'Garlic',
    'Blueberry',
    'Kale',
  ];

  for (const foodName of testFoods) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 Testing: "${foodName}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 1. Test FooDB matching
    const foodbMatches = await sql`
      SELECT foodb_id, name, food_group,
             similarity(LOWER(name), ${foodName.toLowerCase()}) as sim
      FROM source_foodb_foods
      WHERE similarity(LOWER(name), ${foodName.toLowerCase()}) > 0.4
      ORDER BY sim DESC
      LIMIT 3
    `;
    console.log(`\n📦 FooDB matches (${foodbMatches.length}):`);
    for (const m of foodbMatches) {
      console.log(`   ${m.name} (${(m.sim * 100).toFixed(0)}%)`);
    }

    // 2. Test Phenol-Explorer matching
    const phenolMatches = await sql`
      SELECT phenol_id, name, food_group,
             similarity(LOWER(name), ${foodName.toLowerCase()}) as sim
      FROM source_phenol_foods
      WHERE similarity(LOWER(name), ${foodName.toLowerCase()}) > 0.4
      ORDER BY sim DESC
      LIMIT 3
    `;
    console.log(`\n🍇 Phenol-Explorer matches (${phenolMatches.length}):`);
    for (const m of phenolMatches) {
      console.log(`   ${m.name} (${(m.sim * 100).toFixed(0)}%)`);
    }

    // 4. Count potential compounds from best FooDB match
    if (foodbMatches.length > 0) {
      const bestMatch = foodbMatches[0];
      const compoundCount = await sql`
        SELECT COUNT(*) as cnt
        FROM source_foodb_content fc
        JOIN external_compound_mappings ecm
          ON ecm.external_source = 'foodb'
          AND ecm.external_id = fc.foodb_compound_id::text
        WHERE fc.foodb_food_id = ${bestMatch.foodb_id}
          AND fc.standard_content IS NOT NULL
          AND fc.standard_content > 0
          AND ecm.match_status = 'auto_matched'
      `;
      console.log(`\n📊 Mappable compounds from FooDB: ${compoundCount[0].cnt}`);

      // Show sample compounds
      const sampleCompounds = await sql`
        SELECT c.name, fc.standard_content, fc.orig_unit
        FROM source_foodb_content fc
        JOIN external_compound_mappings ecm
          ON ecm.external_source = 'foodb'
          AND ecm.external_id = fc.foodb_compound_id::text
        JOIN compounds c ON c.id = ecm.compound_id
        WHERE fc.foodb_food_id = ${bestMatch.foodb_id}
          AND fc.standard_content IS NOT NULL
          AND fc.standard_content > 0
          AND ecm.match_status = 'auto_matched'
        ORDER BY fc.standard_content DESC
        LIMIT 5
      `;
      if (sampleCompounds.length > 0) {
        console.log('   Sample compounds:');
        for (const c of sampleCompounds) {
          console.log(`   - ${c.name}: ${c.standard_content} ${c.orig_unit || 'mg/100g'}`);
        }
      }
    }
  }

  console.log('\n\n✅ Pipeline test complete!');
  await sql.end();
}

main().catch(console.error);
