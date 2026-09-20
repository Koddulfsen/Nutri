/**
 * Relations that hold in any correct DRI table, checked on a source's values.json.
 * A violation means a misread or mis-keyed cell, not a scientific disagreement.
 *   1. RDA >= EAR for the same compound and demographic.
 *   2. UL >= RDA and UL >= AI where age bands overlap (units converted), unless the UL is
 *      supplemental-only (e.g. magnesium): it limits a different intake than the RDA covers.
 *   3. valueMin <= value <= valueMax.
 *
 * SOURCE_DEFECTS below lists the cases where a source document itself breaks one of these
 * relations. Each entry was verified against a render of the printed page, so storing the
 * published value is correct and the violation is reported as KNOWN, not FAIL. Never add an
 * entry to silence a transcription you have not re-read in the source.
 * Run: npx tsx scripts/dv-verify/check-source-consistency.ts <REGION>
 */
import { readSourceValues, type SourceValue } from '../../lib/dv/source-values';
import { SOURCES } from '../../db/seed/dv/sources';
import { conversionBetween } from '../../lib/food-health/units';

const region = process.argv[2];
const meta = SOURCES[region];
if (!meta) { console.error(`Unknown source "${region}"`); process.exit(1); }
const values = readSourceValues(meta.slug);

/** Region -> [substring of the value's `from`, why it is published that way]. */
const SOURCE_DEFECTS: Record<string, Array<[string, string]>> = {
  VIETNAM: [
    ['Folate (Total) RDA, 1-2 tuổi', 'Bảng 38 prints EAR 120 and RDA 100 µg for 1-2 y (verified on the page render); IOM, its source, gives EAR 120 / RDA 150'],
    ['Folate (Total) RDA, 15-19 tuổi (nam)', 'Bảng 38 prints EAR 320 and RDA 300 µg for boys 15-19 y (verified on the page render)'],
    ['Folate (Total) RDA, Phụ nữ cho con bú', 'Bảng 38 prints EAR 520 and RDA 500 µg for lactation (verified on the page render)'],
  ],
};
const defects = SOURCE_DEFECTS[region] ?? [];
let fails = 0;
let knowns = 0;
const fail = (m: string) => {
  const hit = defects.find(([frag]) => m.includes(frag));
  if (hit) { knowns++; console.log(`KNOWN ${m}\n      ${hit[1]}`); return; }
  fails++; console.log('FAIL ' + m);
};
const demo = (v: SourceValue) => [v.compound, v.sex, v.lifeStage, v.activityLevel ?? '-', v.dietaryContext ?? '-'].join('|');
const overlaps = (a: SourceValue, b: SourceValue) =>
  a.ageMinMonths <= (b.ageMaxMonths ?? Infinity) && b.ageMinMonths <= (a.ageMaxMonths ?? Infinity);
const inUnit = (v: SourceValue, unit: string) => {
  if (v.unit === unit) return v.value;
  const f = conversionBetween(v.unit, unit);
  return f == null ? null : v.value * f;
};

const byDemo = new Map<string, SourceValue[]>();
for (const v of values) {
  if (v.valueMin != null && v.value < v.valueMin) fail(`${v.from}: value ${v.value} < min ${v.valueMin}`);
  if (v.valueMax != null && v.value > v.valueMax) fail(`${v.from}: value ${v.value} > max ${v.valueMax}`);
  const k = demo(v);
  byDemo.set(k, [...(byDemo.get(k) ?? []), v]);
}
for (const group of byDemo.values()) {
  for (const a of group) {
    for (const b of group) {
      if (a === b || !overlaps(a, b) || a.isPercentOfEnergy || b.isPercentOfEnergy) continue;
      const bInA = inUnit(b, a.unit);
      if (bInA == null) continue;
      if (a.valueType === 'RDA' && b.valueType === 'EAR' && a.ageMinMonths === b.ageMinMonths && a.ageMaxMonths === b.ageMaxMonths && a.value < bInA)
        fail(`RDA < EAR: ${a.from} = ${a.value} ${a.unit} vs ${b.from} = ${b.value} ${b.unit}`);
      if (a.valueType === 'UL' && !a.supplementalOnly && (b.valueType === 'RDA' || b.valueType === 'AI') && a.value < bInA)
        fail(`UL < ${b.valueType}: ${a.from} = ${a.value} ${a.unit} vs ${b.from} = ${b.value} ${b.unit}`);
    }
  }
}
console.log(`${region}: ${values.length} values, consistency ${fails} failures${knowns ? `, ${knowns} known source defects` : ''}`);
if (fails) process.exitCode = 1;
