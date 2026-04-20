import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Properly categorize Duke compounds following SOURCE_MAPPING_GUIDE.md:
 *
 * 1. Already Matched (253) → need mapping insertion
 * 2. NO_MATCH items categorized into:
 *    - Category A: Skip (aggregates, duplicates)
 *    - Category B: Forms of existing compounds (with parent)
 *    - Category C: New standalone compounds
 */

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Load activities data
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
  const compoundByName = new Map<string, any>();
  const compoundByAltName = new Map<string, any>();

  for (const c of compounds) {
    compoundByName.set(c.name.toLowerCase(), c);
    compoundByName.set(c.name.toLowerCase().replace(/-/g, ' '), c);
    compoundByName.set(c.name.toLowerCase().replace(/\s+/g, '-'), c);
    if (c.alternate_names) {
      for (const alt of c.alternate_names) {
        compoundByAltName.set(alt.toLowerCase(), c);
      }
    }
  }

  // Health activities for filtering
  const healthActivities = new Set([
    'Antitumor', 'Antibacterial', 'Antiviral', 'Antifungal', 'Antiparasitic',
    'Antimalarial', 'AntiHIV', 'Anticancer', 'Antileukemic', 'Anticarcinomic',
    'Antioxidant', 'Hepatoprotective', 'Cardioprotective', 'Neuroprotective',
    'Gastroprotective', 'Nephroprotective', 'Radioprotective',
    'Antiinflammatory', 'Antiarthritic', 'Antirheumatic', 'Antiedemic',
    'Antidiabetic', 'Hypoglycemic', 'Antiobesity', 'Hypolipidemic', 'Hypocholesterolemic',
    'Hypotensive', 'Antihypertensive', 'Antiatherosclerotic', 'Vasodilator',
    'Antithrombotic', 'Antiaggregant', 'Cardiotonic',
    'Antidepressant', 'Anxiolytic', 'Sedative', 'Anticonvulsant', 'Antiepileptic',
    'Antidementia', 'Antialzheimeran', 'Antiparkinson',
    'Analgesic', 'Immunostimulant', 'Immunomodulator', 'Antiallergic',
    'Antiulcer', 'Antidiarrheal', 'Laxative', 'Carminative', 'Digestive',
    'Antiaging', 'Antimigraine', 'Antiasthmatic', 'Antiosteoporotic',
    'Cancer-Preventive', 'Chemopreventive', 'Antimutagenic', 'Antigenotoxic',
    'Vulnerary', 'Antieczemic', 'Antipsoriatic', 'Antiseptic',
  ]);

  // Exclude patterns (non-compounds)
  const excludePatterns = [
    /^EO$/i, /^RESIN$/i, /^GUM$/i, /^MUCILAGE$/i, /^ALKALOIDS$/i,
    /^TERPENES$/i, /^STEROIDS$/i, /^SAPONINS$/i, /^TANNINS$/i,
    /^FLAVONOIDS$/i, /^PHENOLICS$/i, /^LIGNANS$/i, /^COUMARINS$/i,
    /^ANTHRAQUINONES$/i, /^GLYCOSIDES$/i, /^ESSENTIAL-OIL$/i,
    /^PHYTOSTEROLS$/i, /^CAROTENOIDS$/i, /^ANTHOCYANINS$/i,
    /^PROANTHOCYANIDINS$/i, /^XANTHOPHYLLS$/i,
    /KILOCALORIES/i, /CALORIES/i, /^ASH$/i, /^WATER$/i,
  ];

  // Category A: Skip patterns (aggregates, duplicates only - NOT obscure compounds)
  const categoryA_Skip = [
    { pattern: /^POLYPHENOLS$/i, reason: 'Aggregate term - we track individual polyphenols' },
    { pattern: /^TANNIN$/i, reason: 'Aggregate - map to Tannic Acid instead' },
    { pattern: /^OPC$/i, reason: 'Abbreviation - use Proanthocyanidins' },
    { pattern: /^OPCS$/i, reason: 'Abbreviation - use Proanthocyanidins' },
    { pattern: /^VITAMIN-B$/i, reason: 'Aggregate - we have specific B vitamins' },
    { pattern: /^ANTHOCYANOSIDE$/i, reason: 'Aggregate term for anthocyanin glycosides' },
    { pattern: /^GINKGOLIDES$/i, reason: 'Plural aggregate - add specific ginkgolides' },
    { pattern: /^FLAVONE$/i, reason: 'Base structure - we track specific flavones' },
    { pattern: /^GLYCYRRHETIC-ACID$/i, reason: 'Duplicate of Glycyrrhetinic Acid' },
    { pattern: /^AESCIN$/i, reason: 'Duplicate spelling of Escin' },
    { pattern: /^AESCULIN$/i, reason: 'Duplicate spelling of Esculin' },
  ];

  // Category B: Forms of existing compounds (with parent mapping)
  const categoryB_Forms = [
    { pattern: /^TOCOPHEROL$/i, parent: 'Vitamin E', reason: 'Generic tocopherol form' },
    { pattern: /^6-SHOGAOL$/i, parent: 'Gingerol', reason: 'Dehydrated form of gingerol' },
    { pattern: /^ALPHA-AMYRIN$/i, parent: 'beta-Amyrin', reason: 'Isomer' },
    { pattern: /^GINKGOLIDE$/i, parent: 'Ginkgo biloba extract', reason: 'Specific ginkgolide' },
  ];

  // Special mappings (Duke name → existing Nutri compound)
  const specialMappings = [
    { pattern: /^FIBER$/i, mapTo: 'Dietary Fiber' },
    { pattern: /^(-)?EPIGALLOCATECHIN-GALLATE$/i, mapTo: 'EGCG' },
    { pattern: /^GLYCYRRHIZIC-ACID$/i, mapTo: 'Glycyrrhizin' },
    { pattern: /^L-GLUTATHIONE$/i, mapTo: 'Glutathione' },
  ];

  // Build full compound list from Duke
  interface DukeCompound {
    dukeId: string;
    healthActs: string[];
    plants: number;
    tier: 1 | 2;
  }

  const allDukeChems: DukeCompound[] = [];

  for (const [chem, acts] of chemActivities) {
    if (excludePatterns.some(p => p.test(chem))) continue;

    const healthActs = [...acts].filter(a => healthActivities.has(a));
    const plants = plantMap.get(chem) || 0;

    // Tier 1: 5+ health acts OR (2+ acts AND 50+ plants)
    // Tier 2: 3+ health acts OR (1+ act AND 30+ plants)
    const isTier1 = healthActs.length >= 5 || (healthActs.length >= 2 && plants >= 50);
    const isTier2 = healthActs.length >= 3 || (healthActs.length >= 1 && plants >= 30);

    if (isTier1 || isTier2) {
      allDukeChems.push({
        dukeId: chem,
        healthActs,
        plants,
        tier: isTier1 ? 1 : 2,
      });
    }
  }

  console.log('Total Duke compounds selected (Tier 1+2): ' + allDukeChems.length);

  // Categorize each compound
  interface Categorized {
    dukeId: string;
    healthActs: number;
    plants: number;
    tier: 1 | 2;
    category: 'MATCHED' | 'A_SKIP' | 'B_FORM' | 'C_NEW';
    nutriCompound: string;
    nutriCompoundId: string;
    parent: string;
    reason: string;
    type: string;
  }

  const results: Categorized[] = [];

  for (const dc of allDukeChems) {
    const normalized = dc.dukeId.toLowerCase();
    const normalizedSpaces = dc.dukeId.toLowerCase().replace(/-/g, ' ');

    // Check if already matches existing compound
    let matched = compoundByName.get(normalized) ||
                  compoundByName.get(normalizedSpaces) ||
                  compoundByAltName.get(normalized) ||
                  compoundByAltName.get(normalizedSpaces);

    // Check special mappings
    if (!matched) {
      for (const sm of specialMappings) {
        if (sm.pattern.test(dc.dukeId)) {
          matched = compoundByName.get(sm.mapTo.toLowerCase());
          break;
        }
      }
    }

    if (matched) {
      results.push({
        dukeId: dc.dukeId,
        healthActs: dc.healthActs.length,
        plants: dc.plants,
        tier: dc.tier,
        category: 'MATCHED',
        nutriCompound: matched.name,
        nutriCompoundId: matched.id,
        parent: '',
        reason: 'Direct match',
        type: matched.compound_type,
      });
      continue;
    }

    // Check Category A: Skip
    let isSkip = false;
    let skipReason = '';
    for (const skip of categoryA_Skip) {
      if (skip.pattern.test(dc.dukeId)) {
        isSkip = true;
        skipReason = skip.reason;
        break;
      }
    }

    if (isSkip) {
      results.push({
        dukeId: dc.dukeId,
        healthActs: dc.healthActs.length,
        plants: dc.plants,
        tier: dc.tier,
        category: 'A_SKIP',
        nutriCompound: '',
        nutriCompoundId: '',
        parent: '',
        reason: skipReason,
        type: '',
      });
      continue;
    }

    // Check Category B: Form of existing
    let isForm = false;
    let formParent = '';
    let formReason = '';
    for (const form of categoryB_Forms) {
      if (form.pattern.test(dc.dukeId)) {
        const parentCompound = compoundByName.get(form.parent.toLowerCase());
        if (parentCompound) {
          isForm = true;
          formParent = form.parent;
          formReason = form.reason;
        }
        break;
      }
    }

    if (isForm) {
      results.push({
        dukeId: dc.dukeId,
        healthActs: dc.healthActs.length,
        plants: dc.plants,
        tier: dc.tier,
        category: 'B_FORM',
        nutriCompound: formatCompoundName(dc.dukeId),
        nutriCompoundId: '',
        parent: formParent,
        reason: formReason,
        type: inferType(dc.dukeId),
      });
      continue;
    }

    // Category C: New standalone compound
    results.push({
      dukeId: dc.dukeId,
      healthActs: dc.healthActs.length,
      plants: dc.plants,
      tier: dc.tier,
      category: 'C_NEW',
      nutriCompound: formatCompoundName(dc.dukeId),
      nutriCompoundId: '',
      parent: '',
      reason: '',
      type: inferType(dc.dukeId),
    });
  }

  // Count by category
  const matched = results.filter(r => r.category === 'MATCHED');
  const catA = results.filter(r => r.category === 'A_SKIP');
  const catB = results.filter(r => r.category === 'B_FORM');
  const catC = results.filter(r => r.category === 'C_NEW');

  console.log('\nCategorization Results:');
  console.log('  MATCHED (existing compounds): ' + matched.length);
  console.log('  Category A (SKIP): ' + catA.length);
  console.log('  Category B (FORM): ' + catB.length);
  console.log('  Category C (NEW): ' + catC.length);
  console.log('  TOTAL TO MAP: ' + (matched.length + catB.length + catC.length));

  // Generate updated tracker
  let tracker = `# Duke to Nutri Compound Mapping Tracker

## Progress: ${matched.length}/${results.length} mapped | ${catA.length} skip | ${catB.length + catC.length} to add

## Overview

- **Source**: Dr. Duke's Phytochemical and Ethnobotanical Database
- **Total Duke chemicals**: 29,572
- **Selected for mapping**: ${results.length} (Tier 1 + Tier 2)
- **Selection criteria**:
  - Tier 1: 5+ health activities OR (2+ activities AND 50+ plants)
  - Tier 2: 3+ health activities OR (1+ activity AND 30+ plants)

---

## Already Matched (${matched.length} compounds)

These Duke compounds match existing Nutri compounds and need mapping insertion:

| # | Duke ID | Health Acts | Plants | Nutri Compound | Compound ID | Type | Status |
|---|---------|-------------|--------|----------------|-------------|------|--------|
`;

  let num = 1;
  for (const r of matched.sort((a, b) => b.healthActs - a.healthActs)) {
    tracker += `| ${num++} | ${r.dukeId} | ${r.healthActs} | ${r.plants} | ${r.nutriCompound} | ${r.nutriCompoundId.slice(0, 8)}... | ${r.type} | ✅ |\n`;
  }

  tracker += `
---

## Category A: Skip (${catA.length} compounds)

These are aggregates or duplicates - don't add:

| # | Duke ID | Health Acts | Plants | Reason |
|---|---------|-------------|--------|--------|
`;

  num = 1;
  for (const r of catA) {
    tracker += `| ${num++} | ${r.dukeId} | ${r.healthActs} | ${r.plants} | ${r.reason} |\n`;
  }

  if (catB.length > 0) {
    tracker += `
---

## Category B: Forms of Existing (${catB.length} compounds)

Add as new compounds with parent_compound_id:

| # | Duke ID | New Compound Name | Health Acts | Plants | Parent | Type |
|---|---------|-------------------|-------------|--------|--------|------|
`;

    num = 1;
    for (const r of catB) {
      tracker += `| ${num++} | ${r.dukeId} | ${r.nutriCompound} | ${r.healthActs} | ${r.plants} | ${r.parent} | ${r.type} |\n`;
    }
  }

  tracker += `
---

## Category C: New Standalone Compounds (${catC.length} compounds)

Add as independent compounds:

| # | Duke ID | New Compound Name | Health Acts | Plants | Type |
|---|---------|-------------------|-------------|--------|------|
`;

  num = 1;
  for (const r of catC.sort((a, b) => b.healthActs - a.healthActs || b.plants - a.plants)) {
    tracker += `| ${num++} | ${r.dukeId} | ${r.nutriCompound} | ${r.healthActs} | ${r.plants} | ${r.type} |\n`;
  }

  tracker += `
---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Already Matched | ${matched.length} | Insert mappings |
| Category A (Skip) | ${catA.length} | No action |
| Category B (Forms) | ${catB.length} | Add with parent, then map |
| Category C (New) | ${catC.length} | Add standalone, then map |
| **Total mappings** | **${matched.length + catB.length + catC.length}** | |
| **New compounds to add** | **${catB.length + catC.length}** | |

## Next Steps

1. ✅ Create tracker (this document)
2. ⬜ Run \`scripts/add-duke-compounds.ts\` to add ${catB.length + catC.length} new compounds
3. ⬜ Run \`scripts/insert-duke-mappings.ts\` to insert ${matched.length + catB.length + catC.length} mappings
4. ⬜ Run verification
`;

  fs.writeFileSync('docs/DUKE_MAPPING_TRACKER.md', tracker);
  console.log('\nWrote docs/DUKE_MAPPING_TRACKER.md');

  // Export data for scripts
  const exportData = {
    matched: matched.map(r => ({ dukeId: r.dukeId, compoundId: r.nutriCompoundId, compoundName: r.nutriCompound })),
    forms: catB.map(r => ({ dukeId: r.dukeId, name: r.nutriCompound, type: r.type, parent: r.parent })),
    newCompounds: catC.map(r => ({ dukeId: r.dukeId, name: r.nutriCompound, type: r.type, healthActs: r.healthActs, plants: r.plants })),
  };

  fs.writeFileSync('data/duke-mapping-data.json', JSON.stringify(exportData, null, 2));
  console.log('Wrote data/duke-mapping-data.json');

  await sql.end();
}

function formatCompoundName(dukeId: string): string {
  // Convert DUKE-NAME to Proper Compound Name
  return dukeId
    .split('-')
    .map((word, i) => {
      // Keep numbers and special prefixes lowercase
      if (/^\d/.test(word)) return word;
      if (/^[a-z]$/.test(word)) return word; // Single letters like 'p' in p-Coumaric
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('-')
    .replace(/-([A-Z])/g, ' $1') // Convert -X to space X for readability
    .replace(/\s+/g, ' ')
    .trim();
}

function inferType(name: string): string {
  const n = name.toUpperCase();
  if (/FLAVON|FLAVAN|CATECHIN|QUERCETIN|RUTIN|KAEMPFEROL|LUTEOLIN|APIGENIN|MYRICETIN|CHALCONE/.test(n)) return 'POLYPHENOL';
  if (/TERPENE|TERPINENE|PINENE|LIMONENE|MENTHOL|CARVONE|CAMPHOR|BORNEOL|CINEOLE|MYRCENE|LINALOOL|GERANIOL/.test(n)) return 'TERPENOID';
  if (/SAPONIN|GLYCOSIDE|OSIDE$/.test(n)) return 'POLYPHENOL';
  if (/INE$|IDINE$|ININE$/.test(n) && !/SERINE|GLYCINE|ALANINE|VALINE|LEUCINE|ISOLEUCINE|PROLINE|METHIONINE|CYSTEINE|PHENYLALANINE|TYROSINE|TRYPTOPHAN|HISTIDINE|LYSINE|ARGININE|ASPARAGINE|GLUTAMINE|THREONINE/.test(n)) return 'ALKALOID';
  if (/-ACID$|ACID$/.test(n)) return 'ORGANIC_ACID';
  if (/PECTIN|FIBER|CELLULOSE|INULIN/.test(n)) return 'FIBER';
  if (/ASE$|BROMELAIN|PAPAIN|FICIN/.test(n)) return 'ENZYME';
  if (/STEROL/.test(n)) return 'STEROL';
  if (/AMINE$|CHOLINE|BETAINE/.test(n)) return 'AMINE';
  return 'OTHER';
}

main().catch(console.error);
