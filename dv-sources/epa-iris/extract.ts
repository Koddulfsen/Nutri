/**
 * US EPA Integrated Risk Information System (IRIS) -> values.json.
 *
 * Contaminant reference doses, not nutrient requirements. The region is USA_EPA rather than USA_CANADA
 * on purpose: that one is the IOM/NAM nutrient DRIs, and this is a toxicology programme in a different
 * agency. Two committees of the same country are two judgements, and merging them would hide a
 * disagreement — EPA's cadmium limit is nearly three times looser per day than EFSA's.
 *
 * Transcribed 2026-10-07 from the IRIS chemical record for cadmium (CASRN 7440-43-9), kept at
 * source/epa-iris-cadmium.txt. Full reasoning in NOTES.md.
 *
 * Mapping decisions:
 *   - EPA publishes TWO chronic oral RfDs for cadmium, by exposure route: 5e-4 mg/kg-day for water and
 *     1e-3 for food. The FOOD value is stored, because dietary exposure is what this system measures;
 *     storing the water value would compare a meal against a limit set for drinking water.
 *   - Stored as µg rather than mg, to match how the other two bodies state cadmium.
 *   - An RfD is a daily value per kg of body weight: averagingDays 1, perKgBodyWeight true.
 *
 * Not stored: lead (EPA sets no RfD — a safe level cannot be identified), and inorganic arsenic, whose
 * RfD exists but was not read from IRIS in this pass and is not transcribed on trust.
 *
 * Run: npx tsx dv-sources/epa-iris/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex } from '../../lib/dv/source-values';

const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];

for (const sex of BOTH) {
  out.push({
    compound: 'Cadmium',
    valueType: 'RfD',
    sex,
    lifeStage: 'NONE',
    // No age bands: an RfD is a per-kg value for the whole population, and the per-kg basis is what
    // makes it age-appropriate rather than a separate figure per band.
    ageMinMonths: 0,
    ageMaxMonths: null,
    activityLevel: null,
    dietaryContext: null,
    value: 1,
    valueMin: null,
    valueMax: null,
    unit: 'µg',
    isPercentOfEnergy: false,
    isProvisional: false,
    supplementalOnly: false,
    perKgBodyWeight: true,
    averagingDays: 1,
    note:
      'Chronic oral reference dose for FOOD exposure, 1 x 10^-3 mg/kg-day, stored as 1 µg/kg bw per day. ' +
      'Critical effect "significant proteinuria", from a NOAEL with a composite uncertainty factor of 10, ' +
      'confidence rated high. EPA also publishes a stricter 5 x 10^-4 mg/kg-day for water, which is not ' +
      'stored: it is set for drinking water, not for a meal. Last updated 1989 — two decades older than ' +
      "EFSA's and JECFA's cadmium values, and the most permissive of the three.",
    from: 'EPA IRIS, Cadmium (CASRN 7440-43-9), chronic oral RfD (food), last updated 10/01/1989',
  });
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.sex.localeCompare(b.sex));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'epa-iris', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/epa-iris/values.json`);
