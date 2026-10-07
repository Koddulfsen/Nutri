/**
 * Every source's stored values, checked against the numbers its own document prints.
 *
 * This is the only check that can catch a whole column read one position to the left. `check-source-db`
 * proves the database matches the file the extract wrote; `check-source-consistency` proves the values
 * are internally sensible; neither would notice if the extract had read the wrong column from the start.
 * The pipeline would agree with itself perfectly and the answer would be wrong — the same failure as the
 * conversion factors (CLAUDE.md §6) and the choline unit.
 *
 * Each block below was transcribed BY HAND from that body's own published table, naming the document and
 * the table, and deliberately NOT from our own values.json — a copy of our data would prove nothing.
 * Where a figure needed a rendered page rather than a PDF text layer (EFSA's tables have rotated
 * headers), that is said so in the block.
 *
 * Adults only, both sexes, at age 30. That is where every body publishes and where disagreement between
 * them is most visible; it is not full coverage, and the gaps are listed at the bottom of the run.
 *
 * Run: npx tsx scripts/dv-verify/check-against-printed.ts [REGION]
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

interface Printed {
  /** Which document and table these were read from. */
  source: string;
  /** compound -> [male, female] as printed. null where that body prints nothing for it. */
  values: Record<string, [number | null, number | null]>;
  /** Unit as printed, per compound, where it differs from the obvious one. */
  units?: Record<string, string>;
  note?: string;
}

const PRINTED: Record<string, Printed> = {
  USA_CANADA: {
    source: 'DRI tables as reproduced by Health Canada (dri_tables-eng.pdf), "Reference Values for Vitamins" and "Reference Values for Elements", 19–30 y rows',
    values: {
      'Calcium': [1000, 1000],
      'Iron (Total)': [8, 18],
      'Magnesium': [400, 310],
      'Zinc': [11, 8],
      'Selenium': [55, 55],
      'Iodine': [150, 150],
      'Copper': [900, 900],
      'Phosphorus': [700, 700],
      'Vitamin C (Total)': [90, 75],
      'Vitamin A (RAE)': [900, 700],
      'Vitamin D (Total)': [15, 15],
      'Vitamin B12 (Total)': [2.4, 2.4],
      'Folate (Total)': [400, 400],
      'Thiamin (B1)': [1.2, 1.1],
      'Riboflavin (B2)': [1.3, 1.1],
      'Vitamin B6': [1.3, 1.3],
    },
    units: { 'Copper': 'µg', 'Selenium': 'µg', 'Iodine': 'µg', 'Vitamin A (RAE)': 'µg RAE', 'Vitamin D (Total)': 'µg', 'Vitamin B12 (Total)': 'µg', 'Folate (Total)': 'µg DFE', 'Niacin (B3)': 'mg NE' },
  },

  EU: {
    source: 'EFSA "Summary of Dietary Reference Values" v4 (drv-summary-tables.pdf), Tables 5 and 7 (minerals) and 9 and 11 (vitamins), ≥ 18 y / ≥ 25 y rows. Read from the rendered pages: the text layer mangles the rotated column headers',
    values: {
      'Calcium': [950, 950],
      'Iron (Total)': [11, 16],
      'Magnesium': [350, 300],
      'Selenium': [70, 70],
      'Iodine': [150, 150],
      'Copper': [1.6, 1.3],
      'Phosphorus': [550, 550],
      'Potassium': [3500, 3500],
      'Molybdenum': [65, 65],
      'Manganese': [3.0, 3.0],
      'Fluoride': [3.4, 2.9],
    },
    units: { 'Copper': 'mg', 'Selenium': 'µg', 'Iodine': 'µg', 'Molybdenum': 'µg' },
  },

  UK: {
    source: 'COMA 1991 RNIs as reprinted by the BNF 2021 summary (bnf-nutrition-requirements-2021.txt), "Reference Nutrient Intakes for Minerals" and "... for Vitamins", 19–50 y rows',
    values: {
      'Calcium': [700, 700],
      'Phosphorus': [550, 550],
      'Magnesium': [300, 270],
      'Potassium': [3500, 3500],
      'Iron (Total)': [8.7, 14.8],
      'Zinc': [9.5, 7.0],
      'Copper': [1.2, 1.2],
      'Selenium': [75, 60],
      'Iodine': [140, 140],
      'Thiamin (B1)': [1.0, 0.8],
      'Riboflavin (B2)': [1.3, 1.1],
      'Vitamin B6': [1.4, 1.2],
      'Vitamin B12 (Total)': [1.5, 1.5],
      'Folate (Total)': [200, 200],
      'Vitamin C (Total)': [40, 40],
    },
    units: { 'Selenium': 'µg', 'Iodine': 'µg', 'Vitamin B12 (Total)': 'µg', 'Folate (Total)': 'µg' },
  },
};

const only = process.argv[2];
let fails = 0;
let checked = 0;

async function main() {
  for (const [region, printed] of Object.entries(PRINTED)) {
    if (only && region !== only) continue;

    const rows = await sql<Array<{ name: string; value: number; unit: string; sex: string; value_type: string }>>`
      SELECT c.name, r.value::float8 value, r.unit, r.sex::text sex, r.value_type::text value_type
      FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
      WHERE r.source_region::text = ${region} AND r.life_stage = 'NONE'
        AND r.value_type IN ('RDA', 'AI')
        AND (r.age_min_months IS NULL OR r.age_min_months <= 360)
        AND (r.age_max_months IS NULL OR r.age_max_months >= 360)
        AND r.dietary_context IS NULL AND r.activity_level IS NULL`;

    console.log(`\n${region} — ${printed.source}`);
    let regionFails = 0;

    for (const [compound, [male, female]] of Object.entries(printed.values)) {
      for (const [sex, want] of [['MALE', male], ['FEMALE', female]] as const) {
        if (want == null) continue;
        checked++;
        const ours = rows.find((r) => r.name === compound && r.sex === sex);
        if (!ours) {
          fails++; regionFails++;
          console.log(`  MISSING  ${compound} ${sex}: printed ${want}, nothing stored`);
          continue;
        }
        if (Math.abs(ours.value - want) > 0.0005) {
          fails++; regionFails++;
          console.log(`  DIFFERS  ${compound} ${sex}: stored ${ours.value} ${ours.unit}, printed ${want}`);
          continue;
        }
        const wantUnit = printed.units?.[compound];
        if (wantUnit && ours.unit.replace('μ', 'µ') !== wantUnit.replace('μ', 'µ')) {
          fails++; regionFails++;
          console.log(`  UNIT     ${compound} ${sex}: stored "${ours.unit}", printed "${wantUnit}"`);
        }
      }
    }
    console.log(`  ${Object.keys(printed.values).length} compounds checked, ${regionFails} differ`);
  }

  const missing = ['WHO_FAO', 'JAPAN', 'CHINA', 'KOREA', 'DACH', 'RUSSIA', 'INDIA'].filter((r) => !PRINTED[r]);
  console.log(`\n${checked} values checked against printed tables, ${fails} failures`);
  if (missing.length) console.log(`NOT YET CHECKED against their own documents: ${missing.join(', ')}`);

  await sql.end();
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
