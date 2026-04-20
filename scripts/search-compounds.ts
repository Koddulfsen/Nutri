import 'dotenv/config';
import { db } from '../db';
import { compounds } from '../db/schema/compounds';
import { ilike, or } from 'drizzle-orm';

async function main() {
  const results = await db.select({ id: compounds.id, name: compounds.name })
    .from(compounds)
    .where(or(
      ilike(compounds.name, '%energy%'),
      ilike(compounds.name, '%protein%'),
      ilike(compounds.name, '%fat%'),
      ilike(compounds.name, '%ash%'),
      ilike(compounds.name, '%carbohydrate%'),
      ilike(compounds.name, '%nitrogen%')
    ));

  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

main();
