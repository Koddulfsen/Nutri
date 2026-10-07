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

  INDIA: {
    source: 'ICMR-NIN 2020 short tables (brief-note.txt), Table 3 (Males) and Table 4 (Females), "RDA 2020" column',
    values: {
      'Calcium': [1000, 1000],
      'Magnesium': [440, 370],
      'Iron (Total)': [19, 29],
      'Zinc': [17, 13.0],
      'Iodine': [150, 150],
      'Thiamin (B1)': [1.8, 1.7],
      'Riboflavin (B2)': [2.5, 2.4],
      'Niacin (B3)': [18, 14],
      'Vitamin B6': [2.4, 1.9],
      'Folate (Total)': [300, 220],
      'Vitamin B12 (Total)': [2.2, 2.2],
      'Vitamin C (Total)': [80, 65],
      'Vitamin A (RAE)': [1000, 840],
    },
    units: { 'Iodine': 'µg', 'Folate (Total)': 'µg DFE', 'Vitamin B12 (Total)': 'µg' },
    note: 'Vitamin D is printed in IU (600), which is stored as µg; checked separately rather than here.',
  },

  WHO_FAO: {
    source: 'FAO/WHO "Vitamin and mineral requirements in human nutrition" 2nd ed., Appendix 1 (snapshot source/y2809e0o.htm), Table 1 minerals and Table 2 vitamins, "Males 19–65 years" and "Females 19–50 years (pre-menopausal)" rows',
    values: {
      // Minerals. Zinc and iron are printed at several bioavailability levels, and which one is stored
      // is a judgement recorded in the extract header, so they are checked there rather than here.
      'Calcium': [1000, 1000],
      'Magnesium': [260, 220],
      'Selenium': [34, 26],
      'Iodine': [130, 110],
      // Vitamins.
      'Thiamin (B1)': [1.2, 1.1],
      'Riboflavin (B2)': [1.3, 1.1],
      'Niacin (B3)': [16, 14],
      'Vitamin B6': [1.3, 1.3],
      'Pantothenic Acid (B5)': [5, 5],
      'Biotin (B7)': [30, 30],
      'Folate (Total)': [400, 400],
      'Vitamin B12 (Total)': [2.4, 2.4],
      'Vitamin C (Total)': [45, 45],
      'Vitamin A (RE)': [600, 500],
      'Vitamin D (Total)': [5, 5],
      'Vitamin E (Total)': [10, 7.5],
      'Vitamin K (Total)': [65, 55],
    },
    units: {
      'Selenium': 'µg', 'Iodine': 'µg', 'Niacin (B3)': 'mg NE', 'Biotin (B7)': 'µg',
      'Folate (Total)': 'µg DFE', 'Vitamin B12 (Total)': 'µg', 'Vitamin A (RE)': 'µg RE',
      'Vitamin D (Total)': 'µg', 'Vitamin E (Total)': 'mg α-TE', 'Vitamin K (Total)': 'µg',
    },
  },

  DACH: {
    source: 'DGE/ÖGE/SGE Referenzwerte-Tool, snapshot source/dge-referenzwerte-tool-all.html, age group "25 bis unter 51 Jahre". Read by pulling the visible table cells, a different route from the extract\'s own parse, so a parsing assumption cannot hide in both',
    values: {
      'Calcium': [1000, 1000],
      'Magnesium': [350, 300],
      'Iron (Total)': [11, 16],      // females printed "Prämenopausal 16 / Postmenopausal 14"; 16 is stored for 25–50 y
      'Iodine': [150, 150],
      'Selenium': [70, 60],
      'Folate (Total)': [300, 300],
      'Thiamin (B1)': [1.2, 1.0],
      'Riboflavin (B2)': [1.4, 1.1],
      'Vitamin C (Total)': [110, 95],
      'Vitamin D (Total)': [20, 20],
      'Vitamin B12 (Total)': [4.0, 4.0],
    },
    units: { 'Iodine': 'µg', 'Selenium': 'µg', 'Folate (Total)': 'µg DFE', 'Vitamin D (Total)': 'µg', 'Vitamin B12 (Total)': 'µg' },
  },

  RUSSIA: {
    source: 'MR 2.3.1.0253-21 (snapshot source/garant-mr-2.3.1.0253-21.html), the "Старше 18 лет" (over 18) mineral and vitamin tables, male block and female block',
    values: {
      'Calcium': [1000, 1000],
      'Phosphorus': [700, 700],
      'Magnesium': [420, 420],
      'Potassium': [3500, 3500],
      'Iron (Total)': [10, 18],
      'Zinc': [12, 12],
      'Iodine': [150, 150],
      'Copper': [1.0, 1.0],
      'Manganese': [2.0, 2.0],
      'Molybdenum': [70, 70],
      'Selenium': [70, 55],
      'Chromium': [40, 40],
      'Fluoride': [4.0, 4.0],
      // Vitamins. The male and female blocks are separate tables and do NOT simply repeat: vitamin A
      // is 900 for men and 800 for women. Transcribing the male block for both reported a false
      // mismatch against a correct stored value — the data was right and the expectation was wrong.
      'Niacin (B3)': [20, 20],
      'Folate (Total)': [400, 400],
      'Pantothenic Acid (B5)': [5.0, 5.0],
      'Biotin (B7)': [50, 50],
      'Vitamin A (RE)': [900, 800],
      'Vitamin E (Total)': [15, 15],
      'Vitamin D (Total)': [15, 15],
      'Vitamin K (Total)': [120, 120],
    },
    units: {
      'Iodine': 'µg', 'Molybdenum': 'µg', 'Selenium': 'µg', 'Chromium': 'µg', 'Biotin (B7)': 'µg',
      'Niacin (B3)': 'mg NE', 'Folate (Total)': 'µg', 'Vitamin A (RE)': 'µg RE',
      'Vitamin E (Total)': 'mg α-TE', 'Vitamin D (Total)': 'µg', 'Vitamin K (Total)': 'µg',
    },
  },

  JAPAN: {
    source: 'MHLW "Dietary Reference Intakes for Japanese" 2025 report, read from RENDERED pages of mhlw-dri-2025-report.pdf (its text layer holds no extractable Japanese): vitamin A p.181, calcium p.283, vitamin B1 p.234, iron p.345, all 30–49 y rows, 推奨量 (RDA) column',
    values: {
      'Vitamin A (RAE)': [900, 700],
      'Calcium': [750, 650],
      'Thiamin (B1)': [1.2, 0.9],
      'Iron (Total)': [7.5, 10.5],   // female: the 月経あり (menstruating) column, per the extract's recorded choice
    },
    units: { 'Vitamin A (RAE)': 'µg RAE' },
    note:
      'A deliberately small sample, and the reason is worth recording. The English 2020 edition ' +
      '(mhlw-dri-2020-en.pdf) HAS a clean text layer and would have made this cheap — but it is a ' +
      'different edition, and using it as the reference produces false mismatches: it prints thiamin ' +
      'RDA 1.4/1.1 where the 2025 report prints 1.2/0.9, so our (correct) stored values would have ' +
      'looked wrong. Only the edition the data came from can check the data.',
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
