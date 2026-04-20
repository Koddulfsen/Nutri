import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql`
    INSERT INTO symptom_definitions (name, slug, category, description, icon, user_id, is_system_defined, sort_order)
    VALUES ('Digestion', 'digestion', 'DIGESTIVE', 'Overall digestive comfort and gut health', null, null, true, 16)
    ON CONFLICT DO NOTHING
  `;
  console.log('Seeded Digestion definition');
  await sql.end();
}

main().catch(console.error);
