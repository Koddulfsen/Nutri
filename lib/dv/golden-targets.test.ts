/**
 * Golden targets: does the system produce the RIGHT number, not merely a consistent one?
 *
 * Every other check in this project proves the pipeline agrees with itself. `check-source-db` proves the
 * database matches the file, `check-source-consistency` proves an RDA is not below its own EAR,
 * `check-provenance` proves each claim carries a quote. None of them would notice if a whole column had
 * been read one to the left, or a reference weight were wrong: the pipeline would be perfectly
 * self-consistent and the answer would be wrong. That is exactly how the conversion factors failed
 * (CLAUDE.md §6) — wrong input, plausible output, no crash.
 *
 * This file closes that gap in two layers.
 *
 * LAYER 1 — against the printed source. The US values below were read from the DRI tables as Health
 * Canada reproduces them (dri_tables-eng.pdf, "Reference Values for Vitamins" and "Reference Values for
 * Elements", the 19-30 y rows), NOT from our own values.json. That makes it an independent path: if the
 * extract read the wrong column, the numbers here would not match. The USA is used because its table is
 * freely published in full, covers every nutrient below, and is one of the ten independent bodies.
 *
 * LAYER 2 — the resolved target. What a user actually sees, frozen. These are not independently derived
 * — they are the median of the ten bodies — so the assertion is that the number does not MOVE without
 * someone deciding it should. When one of these fails, the question is not "how do I make the test
 * pass", it is "which source changed, and is the new number better?" Update the file with the answer in
 * the commit message.
 *
 * Hits the real database, because the point is to test the data as it is actually stored.
 */
import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import postgres from 'postgres';
import { resolveBar, type DvRow } from './resolve';
import { referenceWeightKg } from './reference-weights';

const sql = postgres(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!, { max: 1 });

/** Read straight from the printed table, per the header. [compound, male, female, unit] */
const US_DRI_19_30: Array<[string, number, number, string]> = [
  ['Calcium',              1000, 1000, 'mg'],
  ['Iron (Total)',            8,   18, 'mg'],
  ['Magnesium',             400,  310, 'mg'],
  ['Zinc',                   11,    8, 'mg'],
  ['Selenium',               55,   55, 'µg'],
  ['Iodine',                150,  150, 'µg'],
  ['Vitamin C (Total)',      90,   75, 'mg'],
  ['Vitamin A (RAE)',       900,  700, 'µg RAE'],
  ['Vitamin D (Total)',      15,   15, 'µg'],
  ['Vitamin B12 (Total)',   2.4,  2.4, 'µg'],
  ['Folate (Total)',        400,  400, 'µg DFE'],
];

/** The resolved target a user sees, per demographic. [compound, value, unit, bodies behind it] */
const RESOLVED_ADULT_MALE: Array<[string, number, string, number]> = [
  ['Calcium',              975,      'mg',     10],
  ['Iron (Total)',          10.5,    'mg',     10],
  ['Vitamin C (Total)',    100,      'mg',     10],
  ['Vitamin D (Total)',     12.5,    'µg',     10],
  ['Folate (Total)',       400,      'µg DFE',  7],
  ['Protein',               56.523,  'g',       9],
  ['Magnesium',            360,      'mg',     10],
  ['Zinc',                  11.5,    'mg',     10],
  ['Vitamin A (RAE)',      850,      'µg RAE',  5],
  ['Vitamin B12 (Total)',    2.4,    'µg',     10],
  ['Selenium',              60,      'µg',      9],
  ['Iodine',               150,      'µg',     10],
];

const RESOLVED_ADULT_FEMALE: Array<[string, number, string, number]> = [
  ['Calcium',              975,      'mg',     10],
  ['Iron (Total)',          17,      'mg',     10],
  ['Vitamin C (Total)',     95,      'mg',     10],
  ['Vitamin D (Total)',     12.5,    'µg',     10],
  ['Folate (Total)',       400,      'µg DFE',  7],
  ['Protein',               48.555,  'g',       9],
  ['Magnesium',            300,      'mg',     10],
  ['Zinc',                   8,      'mg',     10],
  ['Vitamin A (RAE)',      700,      'µg RAE',  5],
  ['Vitamin B12 (Total)',    2.4,    'µg',     10],
  ['Selenium',              60,      'µg',      9],
  ['Iodine',               150,      'µg',     10],
];

type Row = {
  region: string; vt: string; value: number; unit: string; pk: boolean; plus: number;
  pe: boolean; so: boolean; vmin: number | null; vmax: number | null;
};

async function rowsFor(compound: string, ageMonths: number, sex: 'MALE' | 'FEMALE'): Promise<DvRow[]> {
  const rs = await sql<Row[]>`
    SELECT r.source_region::text region, r.value_type::text vt, r.value::float8 value, r.unit,
           r.per_kg_body_weight pk, r.plus_absolute::float8 plus, r.is_percent_of_energy pe,
           r.supplemental_only so, r.value_min::float8 vmin, r.value_max::float8 vmax
    FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
    WHERE c.name = ${compound} AND r.sex = ${sex} AND r.life_stage = 'NONE'
      AND (r.age_min_months IS NULL OR r.age_min_months <= ${ageMonths})
      AND (r.age_max_months IS NULL OR r.age_max_months >= ${ageMonths})`;
  return rs.map((r) => ({
    region: r.region, compound, valueType: r.vt as DvRow['valueType'], value: r.value,
    valueMin: r.vmin, valueMax: r.vmax, unit: r.unit, perKgBodyWeight: r.pk,
    plusAbsolute: r.plus, isPercentOfEnergy: r.pe, supplementalOnly: r.so,
  }));
}

const resolve = async (compound: string, ageMonths: number, sex: 'MALE' | 'FEMALE') =>
  resolveBar(compound, await rowsFor(compound, ageMonths, sex), {}, {
    referenceWeightFor: (region) => referenceWeightKg(ageMonths, sex, region),
  });

describe('layer 1: our stored US values equal the ones the DRI tables print', () => {
  it.each(US_DRI_19_30)('%s', async (compound, male, female, unit) => {
    for (const [sex, printed] of [['MALE', male], ['FEMALE', female]] as const) {
      const ours = (await rowsFor(compound, 360, sex)).find(
        (r) => r.region === 'USA_CANADA' && (r.valueType === 'RDA' || r.valueType === 'AI')
      );
      expect(ours, `${compound} ${sex}: no US value is stored at all`).toBeDefined();
      expect(ours!.value, `${compound} ${sex}: stored value differs from the printed DRI table`).toBe(printed);
      expect(ours!.unit, `${compound} ${sex}: stored unit differs from the printed one`).toBe(unit);
    }
  });
});

describe('layer 2: the resolved target a user sees does not move silently', () => {
  describe('adult man, 30', () => {
    it.each(RESOLVED_ADULT_MALE)('%s', async (compound, value, unit, bodies) => {
      const bar = await resolve(compound, 360, 'MALE');
      expect(bar.goal, `${compound}: no goal resolved`).toBeTruthy();
      expect(bar.goal!.value, compound).toBeCloseTo(value, 3);
      expect(bar.goal!.unit, `${compound} unit`).toBe(unit);
      expect(bar.goal!.sources.length, `${compound} bodies`).toBe(bodies);
    });
  });

  describe('adult woman, 30', () => {
    it.each(RESOLVED_ADULT_FEMALE)('%s', async (compound, value, unit, bodies) => {
      const bar = await resolve(compound, 360, 'FEMALE');
      expect(bar.goal, `${compound}: no goal resolved`).toBeTruthy();
      expect(bar.goal!.value, compound).toBeCloseTo(value, 3);
      expect(bar.goal!.unit, `${compound} unit`).toBe(unit);
      expect(bar.goal!.sources.length, `${compound} bodies`).toBe(bodies);
    });
  });
});

describe('layer 2: the target responds to the person', () => {
  it('gives a heavier man more protein, by exactly his extra weight times each body\'s per-kg figure', async () => {
    const rows = await rowsFor('Protein', 360, 'MALE');
    const at = (kg: number) => resolveBar('Protein', rows, {}, { weightKg: kg }).goal!.value;
    expect(at(95)).toBeGreaterThan(at(55));
    // EFSA is 0.83 g/kg, so 40 kg of difference is 33.2 g on EFSA's own contribution.
    const eu = rows.find((r) => r.region === 'EU' && r.valueType === 'RDA')!;
    expect(eu.perKgBodyWeight).toBe(true);
    expect(eu.value * 40).toBeCloseTo(33.2, 4);
  });

  it('separates a pregnancy target from the everyday one', async () => {
    const everyday = await resolve('Protein', 360, 'FEMALE');
    const rows = await rowsFor('Protein', 360, 'FEMALE');
    const t3 = await sql<Row[]>`
      SELECT r.source_region::text region, r.value_type::text vt, r.value::float8 value, r.unit,
             r.per_kg_body_weight pk, r.plus_absolute::float8 plus, r.is_percent_of_energy pe,
             r.supplemental_only so, r.value_min::float8 vmin, r.value_max::float8 vmax
      FROM reference_daily_values r JOIN compounds c ON c.id = r.compound_id
      WHERE c.name = 'Protein' AND r.sex = 'FEMALE' AND r.life_stage = 'PREGNANT_T3'
        AND r.age_min_months <= 360 AND (r.age_max_months IS NULL OR r.age_max_months >= 360)`;
    const bar = resolveBar('Protein', t3.map((r) => ({
      region: r.region, compound: 'Protein', valueType: r.vt as DvRow['valueType'], value: r.value,
      valueMin: r.vmin, valueMax: r.vmax, unit: r.unit, perKgBodyWeight: r.pk, plusAbsolute: r.plus,
      isPercentOfEnergy: r.pe, supplementalOnly: r.so,
    })), {}, { referenceWeightFor: (region) => referenceWeightKg(360, 'FEMALE', region) });
    expect(bar.goal!.value).toBeGreaterThan(everyday.goal!.value);
    expect(rows.length).toBeGreaterThan(0);
  });
});
