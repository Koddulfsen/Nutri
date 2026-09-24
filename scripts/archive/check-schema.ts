import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Check meal_logs
  const mealLogs = await sql`SELECT COUNT(*) as count FROM meal_logs`;
  console.log('meal_logs count:', mealLogs[0].count);

  // Check meal_items
  const mealItems = await sql`SELECT COUNT(*) as count FROM meal_items`;
  console.log('meal_items count:', mealItems[0].count);

  // Check food_nutrient_values - this is probably the key table
  const fnv = await sql`SELECT COUNT(*) as count FROM food_nutrient_values`;
  console.log('food_nutrient_values count:', fnv[0].count);

  // Sample food_nutrient_values
  const sample = await sql`
    SELECT fnv.*, f.name as food_name, c.name as compound_name
    FROM food_nutrient_values fnv
    JOIN foods f ON f.id = fnv.food_id
    JOIN compounds c ON c.id = fnv.compound_id
    LIMIT 10
  `;
  console.log('\nSample food_nutrient_values:');
  console.table(sample.map(s => ({
    food: s.food_name,
    compound: s.compound_name,
    amount: s.amount,
    unit: s.unit
  })));

  // Check the columns
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'food_nutrient_values' ORDER BY ordinal_position
  `;
  console.log('\nfood_nutrient_values columns:', cols.map(c => c.column_name).join(', '));

  await sql.end();
}

main();
