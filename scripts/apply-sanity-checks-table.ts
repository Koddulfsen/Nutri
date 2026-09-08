/**
 * One-shot: create compound_food_sanity_checks table.
 * Used instead of `npm run db:migrate` because the Drizzle migration ledger is
 * out of sync with the DB (tries to recreate pre-existing tables like
 * waitlist_signups). Apply just the new table directly.
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS compound_food_sanity_checks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      compound_id uuid NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
      food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      verdict text NOT NULL,
      confidence text NOT NULL,
      expected_low numeric,
      expected_high numeric,
      typical_value numeric,
      unit text NOT NULL,
      our_value_at_check numeric NOT NULL,
      sources jsonb NOT NULL,
      note text,
      checked_by uuid,
      checked_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_cfsc_compound_food_uniq
    ON compound_food_sanity_checks (compound_id, food_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_cfsc_verdict
    ON compound_food_sanity_checks (verdict);
  `);

  console.log('compound_food_sanity_checks table ready');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
