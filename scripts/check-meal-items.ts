import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Check meal_items columns
  const cols = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'meal_items' ORDER BY ordinal_position
  `;
  console.log('meal_items columns:');
  cols.forEach(c => console.log('  ' + c.column_name + ': ' + c.data_type));

  // Sample meal_items with nutrients
  const items = await sql`SELECT food_name, nutrients FROM meal_items WHERE nutrients IS NOT NULL LIMIT 1`;
  if (items.length > 0) {
    console.log('\nSample nutrients for:', items[0].food_name);
    const n = items[0].nutrients as Record<string, unknown>;
    console.log('Total nutrient keys:', Object.keys(n).length);
    const first3 = Object.entries(n).slice(0, 3);
    first3.forEach(([k, v]) => console.log('  ' + k + ':', JSON.stringify(v)));
  }

  await sql.end();
}

main();
