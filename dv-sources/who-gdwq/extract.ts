/**
 * WHO Guidelines for Drinking-water Quality -> values.json.
 *
 * A separate body from WHO_FAO. Both are WHO, but JECFA (the food committee) and the GDWQ panel are
 * different expert processes with different memberships and schedules, so counting them as one body
 * would hide a disagreement the same way folding EPA into the IOM would. Where both set a figure for
 * the same substance, they should be two votes.
 *
 * WHY A WATER GUIDELINE BELONGS IN A FOOD APP, which is the obvious objection:
 *
 * The per-litre guideline value is NOT stored and is not usable here — 20 µg/L is a concentration in
 * water, like a Codex maximum level is a concentration in a product. What is stored is the TDI the
 * guideline is derived FROM, and a TDI is a whole-diet figure per kg of body weight. WHO's own
 * derivation makes that explicit: it takes the TDI, allocates 10 % of it to drinking water, assumes a
 * 60 kg adult drinking 2 litres a day, and arrives at 20 µg/L. The other 90 % is everything else a
 * person consumes — which is exactly what this app measures (Jens, 2026-10-09).
 *
 * Transcribed 2026-10-09 from WHO's own antimony chemical fact sheet, kept at
 * source/who-gdwq-antimony-fact-sheet.txt.
 *
 * ⚠️ Two caveats that are recorded on the value rather than hidden:
 *   - The assessment date is 2003, and the uncertainty factor is 1000 (100 interspecies/intraspecies,
 *     10 for the short 90-day study). WHO itself flags elsewhere that the value may be conservative.
 *   - The UK COT circulated a draft in April 2025 proposing 20 µg/kg bw per day instead, using the same
 *     underlying study with a different NOAEL reading and an uncertainty factor of 300. That draft says
 *     explicitly it is not to be cited, so it is NOT used here — but if it is adopted, this value moves
 *     by more than 3x and should be revisited.
 *
 * Not stored: the guideline values themselves, and every substance whose GDWQ entry has no TDI.
 *
 * Run: npx tsx dv-sources/who-gdwq/extract.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import type { SourceValue, Sex } from '../../lib/dv/source-values';

const out: SourceValue[] = [];
const BOTH: Sex[] = ['MALE', 'FEMALE'];

for (const sex of BOTH) {
  out.push({
    compound: 'Antimony',
    valueType: 'TDI',
    sex,
    lifeStage: 'NONE',
    // No age bands: a TDI is a per-kg value for the whole population, and the per-kg basis is what
    // makes it age-appropriate rather than a separate figure per band.
    ageMinMonths: 0,
    ageMaxMonths: null,
    activityLevel: null,
    dietaryContext: null,
    value: 6,
    valueMin: null,
    valueMax: null,
    unit: 'µg',
    isPercentOfEnergy: false,
    isProvisional: false,
    supplementalOnly: false,
    perKgBodyWeight: true,
    averagingDays: 1,
    note:
      'Tolerable daily intake, per kg of body weight, for the WHOLE diet — not the per-litre drinking-' +
      'water guideline, which WHO derives from this by allocating only 10 % of it to water. As printed: ' +
      '"Tolerable daily intake (TDI) 6 µg/kg body weight, based on a NOAEL of 6.0 mg/kg body weight per ' +
      'day for decreased body weight gain and reduced food and water intake in a 90-day study in which ' +
      'rats were administered potassium antimony tartrate in drinking-water, using an uncertainty factor ' +
      'of 1000 (100 for interspecies and intraspecies variation, 10 for the short duration of the study)". ' +
      'Assessed 2003. The large uncertainty factor and the short study make this a conservative figure, ' +
      'and a UK COT draft of April 2025 proposes 20 µg/kg bw per day instead — not used here, since that ' +
      'draft states it is not to be cited.',
    from: 'WHO Guidelines for Drinking-water Quality, antimony chemical fact sheet, TDI (assessment date 2003)',
  });
}

out.sort((a, b) => a.compound.localeCompare(b.compound) || a.sex.localeCompare(b.sex));
writeFileSync(path.join(process.cwd(), 'dv-sources', 'who-gdwq', 'values.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} values to dv-sources/who-gdwq/values.json`);
