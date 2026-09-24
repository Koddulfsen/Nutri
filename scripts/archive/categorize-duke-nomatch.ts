import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Categorize Duke NO_MATCH items into:
 * - SKIP: Aggregate terms, duplicates, toxic, or not useful
 * - MAP: Should map to existing Nutri compound (name variation)
 * - ADD: New compound worth adding
 * - FORM: Variant of existing compound (needs parent)
 */

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Load activities data for reference
  const content = fs.readFileSync('data/duke/AGGREGAC.csv', 'utf-8');
  const activities = parse(content, { columns: true, skip_empty_lines: true });

  const chemActivities = new Map<string, Set<string>>();
  for (const row of activities) {
    const chem = row.CHEM?.trim();
    const activity = row.ACTIVITY?.trim();
    if (!chem || !activity) continue;
    if (!chemActivities.has(chem)) chemActivities.set(chem, new Set());
    chemActivities.get(chem)!.add(activity);
  }

  // Get plant counts
  const plantCounts = await sql`
    SELECT chem_id, COUNT(DISTINCT fnf_num) as cnt
    FROM source_duke_farmacy GROUP BY chem_id
  `;
  const plantMap = new Map(plantCounts.map(r => [r.chem_id, Number(r.cnt)]));

  // Get existing Nutri compounds
  const compounds = await sql`SELECT id, name, compound_type, alternate_names FROM compounds`;
  const compoundNames = new Map(compounds.map(c => [c.name.toLowerCase(), c]));

  // ============================================================
  // CATEGORIZATION RULES
  // ============================================================

  // Items to SKIP (aggregates, categories, toxic, not useful)
  const skipPatterns: Array<{ pattern: RegExp; reason: string }> = [
    // Aggregate terms
    { pattern: /^POLYPHENOLS$/i, reason: 'Aggregate term' },
    { pattern: /^TANNIN$/i, reason: 'Aggregate - use Tannic Acid' },
    { pattern: /^OPC$/i, reason: 'Abbreviation for proanthocyanidins' },
    { pattern: /^OPCS$/i, reason: 'Abbreviation for proanthocyanidins' },
    { pattern: /^VITAMIN-B$/i, reason: 'Aggregate - we have specific B vitamins' },
    { pattern: /^ANTHOCYANOSIDE$/i, reason: 'Aggregate term for anthocyanins' },
    { pattern: /^GINKGOLIDES$/i, reason: 'Plural aggregate' },
    { pattern: /^GINKGOLIDE$/i, reason: 'Use specific ginkgolide (A, B, C)' },
    { pattern: /^SAIKOSAPONIN$/i, reason: 'Aggregate - multiple types exist' },
    { pattern: /^FLAVONE$/i, reason: 'Base structure, not specific compound' },

    // Duplicates / alternate spellings of existing
    { pattern: /^GLYCYRRHETIC-ACID$/i, reason: 'Same as Glycyrrhetinic Acid' },
    { pattern: /^AESCIN$/i, reason: 'Same as Escin' },
    { pattern: /^AESCULIN$/i, reason: 'Same as Esculin (already mapped)' },

    // Toxic / harmful compounds
    { pattern: /^ARISTOLOCHIC-ACID$/i, reason: 'Nephrotoxic/carcinogenic - banned' },
    { pattern: /^COLCHICINE$/i, reason: 'Toxic alkaloid - prescription only' },
    { pattern: /^COCAINE$/i, reason: 'Controlled substance' },
    { pattern: /^SCOPOLAMINE$/i, reason: 'Toxic - prescription only' },
    { pattern: /^EPHEDRINE$/i, reason: 'Controlled/restricted substance' },
    { pattern: /^RESERPINE$/i, reason: 'Prescription drug' },
    { pattern: /^EMETINE$/i, reason: 'Toxic emetic' },
    { pattern: /^DIGITOXIN$/i, reason: 'Cardiac glycoside - prescription' },
    { pattern: /^STROPHANTHIDIN$/i, reason: 'Cardiac glycoside - toxic' },
    { pattern: /^DIAZEPAM$/i, reason: 'Controlled substance (Valium)' },
    { pattern: /^IBOGAINE$/i, reason: 'Controlled psychoactive' },
    { pattern: /^YOHIMBINE$/i, reason: 'Prescription/controlled' },

    // Very obscure or research-only
    { pattern: /^BERBERASTINE$/i, reason: 'Obscure berberine derivative' },
    { pattern: /^CRYPTOLEPINE$/i, reason: 'Research compound only' },
    { pattern: /^TYLOPHORINE$/i, reason: 'Research compound only' },
    { pattern: /^CEPHARANTHINE$/i, reason: 'Research compound only' },
    { pattern: /^CYCLEANINE$/i, reason: 'Obscure alkaloid' },
    { pattern: /^ISOTETRANDRINE$/i, reason: 'Obscure alkaloid' },
    { pattern: /^OXYACANTHINE$/i, reason: 'Obscure alkaloid' },
    { pattern: /^AKUAMMIDINE$/i, reason: 'Obscure alkaloid' },
    { pattern: /^DAURICINE$/i, reason: 'Obscure alkaloid' },
    { pattern: /^CRYOGENINE$/i, reason: 'Obscure alkaloid' },
    { pattern: /^BULBOCAPNINE$/i, reason: 'Toxic alkaloid' },
  ];

  // Items to MAP to existing compounds
  const mapToExisting: Array<{ pattern: RegExp; mapTo: string; reason: string }> = [
    { pattern: /^FIBER$/i, mapTo: 'Dietary Fiber', reason: 'Name variation' },
    { pattern: /^TOCOPHEROL$/i, mapTo: 'Vitamin E', reason: 'Generic vitamin E' },
    { pattern: /^(-)?EPIGALLOCATECHIN-GALLATE$/i, mapTo: 'EGCG', reason: 'Name variation' },
    { pattern: /^GLYCYRRHETINIC-ACID$/i, mapTo: 'Glycyrrhetinic Acid', reason: 'Already exists' },
    { pattern: /^GLYCYRRHIZIC-ACID$/i, mapTo: 'Glycyrrhizin', reason: 'Same compound' },
    { pattern: /^GAMMA-LINOLENIC-ACID$/i, mapTo: 'Gamma-Linolenic Acid', reason: 'Check if exists' },
    { pattern: /^ALPHA-LINOLENIC-ACID$/i, mapTo: 'Alpha-Linolenic Acid', reason: 'Check if exists' },
    { pattern: /^DIALLYL-SULFIDE$/i, mapTo: 'Diallyl Sulfide', reason: 'Check if exists' },
    { pattern: /^L-GLUTATHIONE$/i, mapTo: 'Glutathione', reason: 'Name variation' },
    { pattern: /^S-ALLYL-L-CYSTEINE$/i, mapTo: 'S-Allyl Cysteine', reason: 'Garlic compound' },
  ];

  // Items to ADD as FORM of existing compound
  const addAsForms: Array<{ pattern: RegExp; parent: string; type: string }> = [
    { pattern: /^6-SHOGAOL$/i, parent: 'Gingerol', type: 'TERPENOID' },
    { pattern: /^6-GINGEROL$/i, parent: 'Gingerol', type: 'TERPENOID' },
    { pattern: /^ALPHA-AMYRIN$/i, parent: 'beta-Amyrin', type: 'TERPENOID' },
    { pattern: /^ALPHA-BISABOLOL$/i, parent: 'Bisabolol', type: 'TERPENOID' },
  ];

  // Compound type inference based on name patterns
  function inferType(name: string): string {
    const n = name.toUpperCase();
    if (/FLAVON|FLAVAN|CATECHIN|QUERCETIN|RUTIN|KAEMPFEROL|LUTEOLIN|APIGENIN|MYRICETIN/.test(n)) return 'POLYPHENOL';
    if (/CHALCONE/.test(n)) return 'POLYPHENOL';
    if (/TERPENE|TERPINENE|PINENE|LIMONENE|MENTHOL|CARVONE|CAMPHOR|BORNEOL|CINEOLE|MYRCENE/.test(n)) return 'TERPENOID';
    if (/SAPONIN/.test(n)) return 'TERPENOID';
    if (/INE$|IDINE$|ININE$/.test(n)) return 'ALKALOID';
    if (/ACID$|-ACID$/.test(n)) return 'ORGANIC_ACID';
    if (/PECTIN|FIBER|CELLULOSE|INULIN/.test(n)) return 'FIBER';
    if (/ASE$|ENZYME|BROMELAIN|PAPAIN/.test(n)) return 'ENZYME';
    if (/GLYCOSIDE|OSIDE$/.test(n)) return 'POLYPHENOL';
    if (/STEROL|STEROID/.test(n)) return 'STEROL';
    return 'OTHER';
  }

  // ============================================================
  // PROCESS NO_MATCH ITEMS
  // ============================================================

  // Read current tracker to get NO_MATCH items
  const tracker = fs.readFileSync('docs/DUKE_MAPPING_TRACKER.md', 'utf-8');
  const noMatchSection = tracker.split('## NO_MATCH - Needs Review')[1];
  const lines = noMatchSection.split('\n').filter(l => l.startsWith('|') && !l.includes('Duke ID'));

  interface Categorized {
    num: number;
    dukeId: string;
    healthActs: number;
    plants: number;
    action: 'SKIP' | 'MAP' | 'ADD' | 'FORM';
    nutriCompound: string;
    parent: string;
    type: string;
    reason: string;
  }

  const categorized: Categorized[] = [];

  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim()).filter(p => p);
    if (parts.length < 5) continue;

    const num = parseInt(parts[0]);
    const dukeId = parts[1];
    const healthActsMatch = parts[3].match(/^(\d+)/);
    const healthActs = healthActsMatch ? parseInt(healthActsMatch[1]) : 0;
    const plants = parseInt(parts[4]) || 0;

    let action: 'SKIP' | 'MAP' | 'ADD' | 'FORM' = 'ADD';
    let nutriCompound = '';
    let parent = '';
    let type = inferType(dukeId);
    let reason = '';

    // Check SKIP patterns
    for (const { pattern, reason: r } of skipPatterns) {
      if (pattern.test(dukeId)) {
        action = 'SKIP';
        reason = r;
        break;
      }
    }

    // Check MAP patterns
    if (action !== 'SKIP') {
      for (const { pattern, mapTo, reason: r } of mapToExisting) {
        if (pattern.test(dukeId)) {
          // Verify the target exists
          if (compoundNames.has(mapTo.toLowerCase())) {
            action = 'MAP';
            nutriCompound = mapTo;
            reason = r;
          }
          break;
        }
      }
    }

    // Check FORM patterns
    if (action === 'ADD') {
      for (const { pattern, parent: p, type: t } of addAsForms) {
        if (pattern.test(dukeId)) {
          if (compoundNames.has(p.toLowerCase())) {
            action = 'FORM';
            parent = p;
            type = t;
          }
          break;
        }
      }
    }

    // For remaining ADDs, set compound name
    if (action === 'ADD') {
      // Convert Duke name to proper compound name
      nutriCompound = dukeId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-')
        .replace(/-([a-z])/g, (_, c) => ' ' + c.toUpperCase())
        .replace(/^\(/, '(')
        .trim();

      // Clean up common patterns
      nutriCompound = nutriCompound
        .replace(/^(\d+),(\d+)/, '$1,$2') // Keep numbers
        .replace(/ Acid$/, ' Acid')
        .replace(/ Ol$/, 'ol')
        .replace(/ One$/, 'one')
        .replace(/ Ene$/, 'ene');
    }

    categorized.push({
      num,
      dukeId,
      healthActs,
      plants,
      action,
      nutriCompound,
      parent,
      type,
      reason,
    });
  }

  // ============================================================
  // GENERATE UPDATED TRACKER
  // ============================================================

  const skipped = categorized.filter(c => c.action === 'SKIP');
  const mapped = categorized.filter(c => c.action === 'MAP');
  const forms = categorized.filter(c => c.action === 'FORM');
  const toAdd = categorized.filter(c => c.action === 'ADD');

  console.log('Categorization Summary:');
  console.log('  SKIP: ' + skipped.length);
  console.log('  MAP to existing: ' + mapped.length);
  console.log('  ADD as FORM: ' + forms.length);
  console.log('  ADD as new: ' + toAdd.length);

  // Read the matched section from original tracker
  const matchedSection = tracker.split('## NO_MATCH')[0];

  let newTracker = matchedSection;

  // Add MAP section
  newTracker += `## MAP to Existing (${mapped.length} compounds)

These Duke compounds should map to existing Nutri compounds:

| # | Duke ID | Health Acts | Plants | Nutri Compound | Reason | Status |
|---|---------|-------------|--------|----------------|--------|--------|
`;
  for (const c of mapped) {
    newTracker += `| ${c.num} | ${c.dukeId} | ${c.healthActs} | ${c.plants} | ${c.nutriCompound} | ${c.reason} | ✅ |\n`;
  }

  // Add SKIP section
  newTracker += `
---

## SKIP (${skipped.length} compounds)

These compounds are skipped (aggregates, toxic, controlled, or obscure):

| # | Duke ID | Health Acts | Plants | Reason | Status |
|---|---------|-------------|--------|--------|--------|
`;
  for (const c of skipped) {
    newTracker += `| ${c.num} | ${c.dukeId} | ${c.healthActs} | ${c.plants} | ${c.reason} | ❌ |\n`;
  }

  // Add FORM section
  if (forms.length > 0) {
    newTracker += `
---

## ADD as FORM (${forms.length} compounds)

These should be added as variants of existing compounds:

| # | Duke ID | Health Acts | Plants | Parent Compound | Type | Status |
|---|---------|-------------|--------|-----------------|------|--------|
`;
    for (const c of forms) {
      newTracker += `| ${c.num} | ${c.dukeId} | ${c.healthActs} | ${c.plants} | ${c.parent} | ${c.type} | |\n`;
    }
  }

  // Add NEW compounds section
  newTracker += `
---

## ADD as New Compounds (${toAdd.length} compounds)

These are new compounds to add to Nutri:

| # | Duke ID | Nutri Name | Health Acts | Plants | Type | Status |
|---|---------|------------|-------------|--------|------|--------|
`;

  // Sort by health acts then plants
  toAdd.sort((a, b) => {
    if (b.healthActs !== a.healthActs) return b.healthActs - a.healthActs;
    return b.plants - a.plants;
  });

  for (const c of toAdd) {
    newTracker += `| ${c.num} | ${c.dukeId} | ${c.nutriCompound} | ${c.healthActs} | ${c.plants} | ${c.type} | |\n`;
  }

  // Add summary
  newTracker += `
---

## Summary

| Category | Count |
|----------|-------|
| Already Matched | 253 |
| MAP to existing | ${mapped.length} |
| SKIP | ${skipped.length} |
| ADD as FORM | ${forms.length} |
| ADD as new | ${toAdd.length} |
| **Total to add** | **${forms.length + toAdd.length}** |

## Next Steps

1. Review the ADD sections above
2. Run \`scripts/add-duke-missing-compounds.ts\` to add new compounds
3. Run \`scripts/insert-duke-mappings.ts\` to insert all mappings
4. Run verification
`;

  fs.writeFileSync('docs/DUKE_MAPPING_TRACKER.md', newTracker);
  console.log('\nUpdated docs/DUKE_MAPPING_TRACKER.md');

  // Also output the compounds to add as JSON for the script
  const compoundsToAdd = toAdd.map(c => ({
    dukeId: c.dukeId,
    name: c.nutriCompound,
    type: c.type,
    healthActs: c.healthActs,
    plants: c.plants,
  }));

  fs.writeFileSync('data/duke-compounds-to-add.json', JSON.stringify(compoundsToAdd, null, 2));
  console.log('Wrote data/duke-compounds-to-add.json (' + compoundsToAdd.length + ' compounds)');

  await sql.end();
}

main().catch(console.error);
