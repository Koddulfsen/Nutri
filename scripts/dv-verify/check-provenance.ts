/**
 * Every loaded DV source must have a provenance entry, or be listed as pending.
 *
 * The point is that a source cannot be added and quietly skip the question of where its numbers come from: a new
 * region shows up here as unaccounted for until it is either audited (lib/dv/source-provenance.ts) or explicitly
 * parked in PROVENANCE_PENDING. It also checks that audited entries carry evidence, since an entry without a quote
 * from the source document is exactly the kind of unverified claim this repo keeps getting burned by.
 *
 * Run: npx tsx scripts/dv-verify/check-provenance.ts
 */
import { SOURCES } from '../../db/seed/dv/sources';
import { SOURCE_PROVENANCE, PROVENANCE_PENDING, type ProvenanceEntry } from '../../lib/dv/source-provenance';

let fails = 0;
const fail = (m: string) => { fails++; console.log('FAIL ' + m); };

/**
 * China is loaded by db/seed/seed-china-cns-2023.ts rather than the dv-sources loader, so it is not in SOURCES.
 * It still has rows in reference_daily_values, so it still needs provenance — list it here rather than let it slip
 * through the gap between the two loaders.
 */
const EXTRA_REGIONS = ['CHINA'];
const regions = [...Object.keys(SOURCES), ...EXTRA_REGIONS];
const audited = Object.keys(SOURCE_PROVENANCE);

for (const region of regions) {
  if (SOURCE_PROVENANCE[region]) continue;
  if (PROVENANCE_PENDING.includes(region)) continue;
  fail(`${region} has no provenance entry and is not in PROVENANCE_PENDING — see dv-sources/PROVENANCE.md`);
}
for (const region of PROVENANCE_PENDING) {
  if (!SOURCES[region] && !EXTRA_REGIONS.includes(region)) fail(`PROVENANCE_PENDING lists ${region}, which is not a source`);
  if (SOURCE_PROVENANCE[region]) fail(`${region} is both audited and pending — remove it from PROVENANCE_PENDING`);
}

const checkEntry = (region: string, group: string, e: ProvenanceEntry) => {
  if (!e.evidence || e.evidence.length < 40) fail(`${region}.${group}: evidence must quote the source document`);
  // A locator so the claim can be re-checked: a page, a numbered table/section, or — for reports published online
  // without pagination, like the NCBI Bookshelf DRI volumes — a book/chapter identifier.
  const LOCATOR = /\bp{1,2}\.\s?\d|§|Table|Tabel|Tabella|Bảng|Appendix|附录|NBK\d+|nap\d+|Summary|chapter|\bch\.\s?\d|\d{4};\d+\(\d+\):\d+|10\.\d{4,}\/|\.(?:html?|txt|xml|pdf)\b/;
  if (!LOCATOR.test(e.evidence)) fail(`${region}.${group}: evidence cites no page, table, section or book/chapter id`);
  if (e.class === 'primary' && e.derivedFrom.length) fail(`${region}.${group}: primary values cannot have derivedFrom`);
  if ((e.class === 'adopted' || e.class === 'adapted') && !e.derivedFrom.length) fail(`${region}.${group}: ${e.class} needs at least one deriver`);
};

for (const region of audited) {
  if (!SOURCES[region] && !EXTRA_REGIONS.includes(region)) { fail(`SOURCE_PROVENANCE has ${region}, which is not a source`); continue; }
  const groups = Object.entries(SOURCE_PROVENANCE[region].groups);
  if (!groups.length) fail(`${region} has an empty provenance entry`);
  for (const [group, entry] of groups) {
    checkEntry(region, group, entry);
    for (const ex of entry.exceptions ?? []) {
      if (!ex.compounds.length) fail(`${region}.${group}: an exception lists no compounds`);
      checkEntry(region, `${group} exception (${ex.compounds.join(', ')})`, ex as ProvenanceEntry);
    }
  }
}

console.log(`Provenance: ${audited.length} of ${regions.length} sources audited, ${PROVENANCE_PENDING.length} pending, ${fails} failures`);
if (fails) process.exitCode = 1;
