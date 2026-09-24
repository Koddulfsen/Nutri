/**
 * One-shot: create source_fdc_nutrients table (catalog only).
 * FDC food/content data is fetched from API at runtime — only the nutrient
 * catalog is cached locally so source-inspect search has the same shape
 * as our other 14 sources.
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS source_fdc_nutrients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      nutrient_id integer NOT NULL UNIQUE,
      name text NOT NULL,
      unit text NOT NULL,
      nutrient_nbr text,
      rank integer,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_fdc_nutrients_name
    ON source_fdc_nutrients USING gin (name gin_trgm_ops);
  `);

  console.log('source_fdc_nutrients table ready');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
