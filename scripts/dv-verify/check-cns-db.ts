/**
 * End-to-end: every cell of each verified CNS printed table must exist in
 * reference_daily_values with exactly that value (pregnancy as base + increment),
 * and no CHINA row of that type may exist that the table does not print.
 * Run: npx tsx scripts/dv-verify/check-cns-db.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import { demo } from '../../dv-sources/cns-2023/raw-values';
import { TABLE_3_6_EAR, type PrintedNutrient } from '../../dv-sources/cns-2023/printed/table-3-6-ear';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

const COMPOUND: Record<string, string> = {
  calcium: 'Calcium', phosphorus: 'Phosphorus', magnesium: 'Magnesium', iron: 'Iron (Total)', iodine: 'Iodine',
  zinc: 'Zinc', selenium: 'Selenium', copper: 'Copper', molybdenum: 'Molybdenum', vitaminA: 'Vitamin A (RAE)',
  vitaminD: 'Vitamin D (Total)', thiamin: 'Thiamin (B1)', riboflavin: 'Riboflavin (B2)', niacin: 'Niacin (B3)',
  vitaminB6: 'Vitamin B6', folate: 'Folate (Total)', vitaminB12: 'Vitamin B12 (Total)', vitaminC: 'Vitamin C (Total)',
};
const TABLES: Array<{ name: string; valueType: string; data: Record<string, PrintedNutrient> }> = [
  { name: '附表 3-6 EAR', valueType: 'EAR', data: TABLE_3_6_EAR },
];
const BANDS = ['INFANT_0_6', 'INFANT_6_12', 'CHILD_1_3', 'CHILD_4_6', 'CHILD_7_8', 'CHILD_9_11',
  '12_14', '15_17', '18_29', '30_49', '50_64', '65_74', '75P'];
const STAGES = ['PREGNANT_T1', 'PREGNANT_T2', 'PREGNANT_T3', 'LACTATING'];

async function main() {
  let fails = 0, checked = 0;
  for (const t of TABLES) {
    for (const [key, p] of Object.entries(t.data)) {
      const name = COMPOUND[key];
      const rows = await sql<{ sex: string; life_stage: string; amin: number; amax: number | null; value: string }[]>`
        SELECT r.sex, r.life_stage, r.age_min_months amin, r.age_max_months amax, r.value
        FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
        WHERE r.source_region = 'CHINA' AND r.value_type = ${t.valueType} AND c.name = ${name}`;
      const expected = new Map<string, number>();
      BANDS.forEach((b, i) => {
        for (const sex of ['MALE', 'FEMALE']) {
          const v = sex === 'MALE' ? p.m[i] : p.f[i];
          if (v == null) continue;
          const d = demo(i < 6 ? b : `${sex === 'MALE' ? 'M' : 'F'}_${b}`);
          expected.set(`${sex}|NONE|${d.minMonths}|${d.maxMonths}`, v);
        }
      });
      STAGES.forEach((st, i) => {
        const a = Number((p.f[8]! + p.preg[i]).toFixed(4)), b = Number((p.f[9]! + p.preg[i]).toFixed(4));
        if (a === b) expected.set(`FEMALE|${st}|216|599`, a);
        else { expected.set(`FEMALE|${st}|216|359`, a); expected.set(`FEMALE|${st}|360|599`, b); }
      });
      const actual = new Map(rows.map((r) => [`${r.sex}|${r.life_stage}|${r.amin}|${r.amax}`, Number(r.value)]));
      for (const [k, v] of expected) {
        checked++;
        if (actual.get(k) !== v) { fails++; console.log(`FAIL ${t.name} ${name} ${k}: printed ${v}, db ${actual.get(k) ?? 'missing'}`); }
      }
      for (const k of actual.keys()) if (!expected.has(k)) { fails++; console.log(`FAIL ${t.name} ${name} ${k}: in db, not printed`); }
    }
  }
  console.log(`${checked} printed cells checked, ${fails} failures`);
  if (fails) process.exitCode = 1;
}
main().finally(() => sql.end());
