import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkApple() {
  // Find the Apple food
  const foods = await db.execute(sql`
    SELECT id, name, data_source, created_at
    FROM foods
    WHERE name ILIKE '%apple%'
    ORDER BY created_at DESC
    LIMIT 5
  `);
  
  const rows = (foods as any).rows ?? foods;
  console.log('=== Foods matching Apple ===');
  console.log(JSON.stringify(rows, null, 2));
  
  if (rows.length > 0) {
    const foodId = rows[0].id;
    
    // Get sources for this food
    const sources = await db.execute(sql`
      SELECT api_source, api_food_id, created_at
      FROM food_sources
      WHERE food_id = ${foodId}::uuid
    `);
    const sourceRows = (sources as any).rows ?? sources;
    console.log('\n=== Sources used ===');
    console.log(JSON.stringify(sourceRows, null, 2));
    
    // Get merged nutrients count
    const nutrientCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM merged_nutrients
      WHERE food_id = ${foodId}::uuid
    `);
    const countRows = (nutrientCount as any).rows ?? nutrientCount;
    console.log('\n=== Merged nutrients count ===');
    console.log(countRows[0].count);
    
    // Get sample of merged nutrients with source breakdown
    const sampleNutrients = await db.execute(sql`
      SELECT 
        mn.id,
        mn.nutrient_name,
        mn.average_value,
        mn.unit,
        mn.source_count,
        c.name as compound_name
      FROM merged_nutrients mn
      LEFT JOIN compounds c ON c.id = mn.compound_id
      WHERE mn.food_id = ${foodId}::uuid
      ORDER BY mn.source_count DESC, mn.average_value DESC
      LIMIT 20
    `);
    const nutrientRows = (sampleNutrients as any).rows ?? sampleNutrients;
    console.log('\n=== Sample merged nutrients (top 20 by source count) ===');
    console.log(JSON.stringify(nutrientRows, null, 2));
    
    // Get source value breakdown for a few nutrients
    if (nutrientRows.length > 0) {
      const sourceValues = await db.execute(sql`
        SELECT 
          nsv.api_source,
          nsv.value,
          mn.nutrient_name
        FROM nutrient_source_values nsv
        JOIN merged_nutrients mn ON mn.id = nsv.merged_nutrient_id
        WHERE mn.food_id = ${foodId}::uuid
        ORDER BY mn.nutrient_name, nsv.api_source
        LIMIT 50
      `);
      const valueRows = (sourceValues as any).rows ?? sourceValues;
      console.log('\n=== Source contributions (first 50) ===');
      console.log(JSON.stringify(valueRows, null, 2));
    }
  }
  
  process.exit(0);
}

checkApple().catch(console.error);
