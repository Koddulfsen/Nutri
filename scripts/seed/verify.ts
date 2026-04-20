import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!);
const name = process.argv[2];
async function verify() {
  const rows = await sql`SELECT cs.external_source, cs.external_id, cs.source_name, cs.source_unit, cs.conversion_factor, cs.is_canonical FROM compound_sources cs JOIN compounds c ON c.id = cs.compound_id WHERE c.name = ${name} ORDER BY cs.external_source`;
  console.log(`\n${name} mappings (${rows.length}):\n`);
  console.table(rows);
}
verify().finally(() => sql.end());
