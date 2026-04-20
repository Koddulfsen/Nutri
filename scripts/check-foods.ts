import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Sample food_sources with correct columns
  const sources = await sql`
    SELECT fs.*, f.name as food_name
    FROM food_sources fs
    JOIN foods f ON f.id = fs.food_id
    LIMIT 10
  `;
  console.log('Food sources (first 10):');
  console.table(sources.map(s => ({ 
    food: s.food_name,
    api_source: s.api_source,
    api_food_id: s.api_food_id,
    variant: s.api_food_variant
  })));

  // Count by api_source
  const bySource = await sql`
    SELECT api_source, COUNT(*) as count 
    FROM food_sources GROUP BY api_source
  `;
  console.log('\nBy API source:');
  console.table(bySource);

  await sql.end();
}

main();
