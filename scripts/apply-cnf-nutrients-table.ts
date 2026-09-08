/**
 * One-shot: create source_cnf_nutrients table (catalog only).
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS source_cnf_nutrients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      nutrient_id integer NOT NULL UNIQUE,
      name text NOT NULL,
      unit text NOT NULL,
      symbol text,
      tagname text,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_cnf_nutrients_name
    ON source_cnf_nutrients USING gin (name gin_trgm_ops);
  `);

  console.log('source_cnf_nutrients table ready');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
