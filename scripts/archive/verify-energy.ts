import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!);
async function main() {
  const rows = await sql`
    SELECT external_source, external_id, source_name, source_unit, conversion_factor, is_canonical
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    WHERE c.name = 'Energy'
    ORDER BY external_source, external_id
  `;
  console.table(rows);
  await sql.end();
}
main();
