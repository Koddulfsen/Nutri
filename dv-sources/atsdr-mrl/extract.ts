/**
 * US ATSDR Minimal Risk Levels -> values.json.
 *
 * A third toxicology body, separate from USA_EPA and from USA_CANADA. ATSDR derives its own MRLs with
 * its own uncertainty factors — the published table carries a "Total Factors" column per value — and
 * for cadmium it lands ten times stricter than EPA's RfD on a different endpoint. Two agencies of the
 * same country reaching figures an order of magnitude apart are two judgements, not one.
 *
 * ONLY CHRONIC ORAL MRLs ARE STORED. The same table carries acute and intermediate rows, and its own
 * footer defines them: "Acute = 1 to 14 days, Intermediate = 15 to 364 days, and Chronic = 1 year or
 * longer". An intermediate MRL is a limit for up to a year of exposure, typically several times looser
 * than the chronic one, and nothing downstream could detect it being used as a daily target. Tin and
 * uranium are therefore NOT stored: ATSDR has oral MRLs for both, but neither has a chronic one.
 *
 * Transcribed 2026-10-09 from the July 2025 MRL table, kept at
 * source/atsdr-mrl-july-2025-metals.txt.
 *
 * ⚠️ ARSENIC IS DELIBERATELY ABSENT, and it is the one row here that is usable but unused. ATSDR
 * publishes a chronic oral MRL of 0.0003 mg/kg/day, but our `Arsenic` compound is TOTAL arsenic while
 * that limit is for the inorganic form. Unlike mercury — where the limited form is most of the total in
 * the foods that matter, so comparing them merely over-states — inorganic arsenic is a few percent of
 * total arsenic in seafood, which is where our arsenic values are largest. The comparison would read
 * roughly 950 % for oyster and 600 % for salmon against an actual inorganic exposure a small fraction
 * of that. Directionally safe, numerically misinformation. See NOTES.md.
 *
 * Not stored: lead and antimony (ATSDR has no MRL for either, by any route), mercury and nickel
 * (inhalation only), tin and uranium (no chronic oral row).
 *
 * Run: npx tsx dv-sources/atsdr-mrl/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex } from '../../lib/dv/source-values';

const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];

/** compound, mg/kg/day as printed, value stored in µg, uncertainty factor, endpoint, cover date */
const CHRONIC_ORAL: Array<[string, string, number, number, string, string]> = [
  ['Cadmium',  '0.0001 mg/kg/day', 0.1,  3,  'Renal',    '09/12'],
  ['Aluminum', '1 mg/kg/day',      1000, 90, 'Neurol.',  '09/08'],
];

for (const [compound, printed, ug, factors, endpoint, cover] of CHRONIC_ORAL) {
  for (const sex of BOTH) {
    out.push({
      compound,
      valueType: 'TDI',
      sex,
      lifeStage: 'NONE',
      // No age bands: an MRL is a per-kg value for the whole population.
      ageMinMonths: 0,
      ageMaxMonths: null,
      activityLevel: null,
      dietaryContext: null,
      value: ug,
      valueMin: null,
      valueMax: null,
      unit: 'µg',
      isPercentOfEnergy: false,
      isProvisional: false,
      supplementalOnly: false,
      perKgBodyWeight: true,
      averagingDays: 1,
      note:
        `Chronic oral minimal risk level, ${printed} as printed, stored as ${ug} µg/kg bw per day. `
        + `Endpoint ${endpoint}; total uncertainty and modifying factors ${factors}; status Final, cover `
        + `date ${cover}. ATSDR defines an MRL as "an estimate of the daily human exposure to a hazardous `
        + `substance that is likely to be without appreciable risk of adverse noncancer health effects `
        + `over a specified duration" — chronic meaning "1 year or longer", which is why only the chronic `
        + `row is used. Stored as TDI: it is a tolerable daily intake in everything but name, and the `
        + `resolver treats TDI as a contaminant ceiling resolved by strictest.`,
      from: `ATSDR Minimal Risk Levels (July 2025 table), ${compound}, chronic oral, cover date ${cover}`,
    });
  }
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.sex.localeCompare(b.sex));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'atsdr-mrl', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/atsdr-mrl/values.json`);
