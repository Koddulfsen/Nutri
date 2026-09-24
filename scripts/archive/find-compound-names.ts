import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  const searches = [
    'carbohydrate', 'fiber', 'fibre', 'dietary fiber',
    'thiamin', 'pantothenic', 'folate', 'vitamin a',
    'methyltetrahydrofolate', '5-mthf'
  ];

  for (const term of searches) {
    const result = await db.execute(
      sql`SELECT name FROM compounds WHERE LOWER(name) LIKE ${`%${term}%`} LIMIT 5`
    );
    const rows = result.rows || result;
    const names = rows.map((r: any) => r.name).join(', ');
    console.log(`${term}: ${names || 'NONE'}`);
  }
}

main().catch(console.error).finally(() => process.exit());
