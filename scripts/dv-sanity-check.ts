/**
 * Sanity-check the new demographics-driven DV lookup.
 *
 * Picks a handful of well-known compounds and prints the target / upper-limit
 * for a 30-year-old male and 30-year-old female. Compare against published
 * USA/EU RDAs to see if the averages land in the right ballpark.
 *
 * Run: npx tsx scripts/dv-sanity-check.ts
 */

import 'dotenv/config';
import { db } from '@/db';
import { compounds } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { getDailyValuesBatchByDemographics } from '@/lib/services/daily-value-service';

const TEST_COMPOUNDS = [
  'Vitamin C (Total)',
  'Iron (Total)',
  'Calcium',
  'Magnesium',
  'Zinc',
  'Vitamin D (Total)',
  'Folate (Total)',
  'Potassium',
  'Sodium',
  'Protein',
];

async function main() {
  // Resolve compound names → ids
  const rows = await db
    .select({ id: compounds.id, name: compounds.name })
    .from(compounds)
    .where(inArray(compounds.name, TEST_COMPOUNDS));
  const byName = new Map<string, string>();
  for (const r of rows) byName.set(r.name, r.id);
  const ids = TEST_COMPOUNDS.map((n) => byName.get(n)).filter(Boolean) as string[];

  for (const sex of ['MALE', 'FEMALE'] as const) {
    const dv = await getDailyValuesBatchByDemographics({
      compoundIds: ids,
      ageYears: 30,
      sex,
    });
    console.log(`\n=== 30-year-old ${sex} ===`);
    const display = TEST_COMPOUNDS.map((name) => {
      const id = byName.get(name);
      const r = id ? dv.get(id) : undefined;
      return {
        compound: name,
        target: r?.target != null ? +r.target.toFixed(2) : '—',
        unit: r?.targetUnit ?? '',
        type: r?.targetType ?? '',
        sources: r?.targetSourceCount ?? 0,
        ul: r?.upperLimit != null ? +r.upperLimit.toFixed(2) : '—',
        ulUnit: r?.upperLimitUnit ?? '',
        ulSrc: r?.upperLimitSourceCount ?? 0,
      };
    });
    console.table(display);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
