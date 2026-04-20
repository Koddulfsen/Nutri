import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkSchemas() {
  // Get column info for Duke tables
  const cols = await db.execute(sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'source_duke%'
    ORDER BY table_name, ordinal_position
  `);
  const colRows = (cols as any).rows ?? cols;
  
  let currentTable = '';
  for (const col of colRows) {
    if (col.table_name !== currentTable) {
      currentTable = col.table_name;
      console.log('\n' + currentTable + ':');
    }
    console.log('  - ' + col.column_name + ' (' + col.data_type + ')');
  }

  // Sample data from plants
  console.log('\n--- Sample plants ---');
  const plants = await db.execute(sql`SELECT * FROM source_duke_plants LIMIT 3`);
  const plantRows = (plants as any).rows ?? plants;
  plantRows.forEach((p: any) => console.log(JSON.stringify(p, null, 2)));

  // Sample from farmacy (content)
  console.log('\n--- Sample farmacy content ---');
  const farmacy = await db.execute(sql`SELECT * FROM source_duke_farmacy LIMIT 3`);
  const farmacyRows = (farmacy as any).rows ?? farmacy;
  farmacyRows.forEach((f: any) => console.log(JSON.stringify(f, null, 2)));

  process.exit(0);
}

checkSchemas();
