import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Load activities data
  const content = fs.readFileSync('data/duke/AGGREGAC.csv', 'utf-8');
  const activities = parse(content, { columns: true, skip_empty_lines: true });

  // Count activities per chemical
  const chemActivities = new Map<string, Set<string>>();

  for (const row of activities) {
    const chem = row.CHEM?.trim();
    const activity = row.ACTIVITY?.trim();
    if (!chem || !activity) continue;

    if (!chemActivities.has(chem)) {
      chemActivities.set(chem, new Set());
    }
    chemActivities.get(chem)!.add(activity);
  }

  // Get plant counts
  const allPlantCounts = await sql`
    SELECT chem_id, COUNT(DISTINCT fnf_num) as plant_count
    FROM source_duke_farmacy
    GROUP BY chem_id
  `;
  const plantMap = new Map(allPlantCounts.map(r => [r.chem_id, Number(r.plant_count)]));

  // Health activities
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

  // Exclude patterns
  const excludePatterns = [
    /^EO$/i, /^RESIN$/i, /^GUM$/i, /^MUCILAGE$/i, /^ALKALOIDS$/i,
    /^TERPENES$/i, /^STEROIDS$/i, /^SAPONINS$/i, /^TANNINS$/i,
    /^FLAVONOIDS$/i, /^PHENOLICS$/i, /^LIGNANS$/i, /^COUMARINS$/i,
    /^ANTHRAQUINONES$/i, /^GLYCOSIDES$/i, /^ESSENTIAL-OIL$/i,
    /^PHYTOSTEROLS$/i, /^CAROTENOIDS$/i, /^ANTHOCYANINS$/i,
    /^PROANTHOCYANIDINS$/i, /^XANTHOPHYLLS$/i,
    /KILOCALORIES/i, /CALORIES/i, /^ASH$/i, /^WATER$/i,
  ];

  // Get our compounds for matching
  const ourCompounds = await sql`
    SELECT id, name, compound_type, alternate_names
    FROM compounds
  `;

  // Build lookup maps
  const compoundByName = new Map<string, any>();
  const compoundByAltName = new Map<string, any>();

  for (const c of ourCompounds) {
    compoundByName.set(c.name.toLowerCase(), c);
    compoundByName.set(c.name.toLowerCase().replace(/-/g, ' '), c);
    compoundByName.set(c.name.toLowerCase().replace(/\s+/g, '-'), c);

    if (c.alternate_names) {
      for (const alt of c.alternate_names) {
        compoundByAltName.set(alt.toLowerCase(), c);
      }
    }
  }

  // Build compound list
  interface ChemData {
    chem: string;
    healthActs: string[];
    allActs: number;
    plants: number;
    matchedCompound: any | null;
    matchType: 'exact' | 'alternate' | 'none';
  }

  const allChems: ChemData[] = [];

  for (const [chem, acts] of chemActivities) {
    if (excludePatterns.some(p => p.test(chem))) continue;

    const healthActs = [...acts].filter(a => healthActivities.has(a));
    const plants = plantMap.get(chem) || 0;

    // Try to match
    const normalizedName = chem.toLowerCase();
    const normalizedSpaces = chem.toLowerCase().replace(/-/g, ' ');

    let matchedCompound = compoundByName.get(normalizedName) ||
                          compoundByName.get(normalizedSpaces) ||
                          compoundByAltName.get(normalizedName) ||
                          compoundByAltName.get(normalizedSpaces);

    let matchType: 'exact' | 'alternate' | 'none' = 'none';
    if (compoundByName.get(normalizedName) || compoundByName.get(normalizedSpaces)) {
      matchType = 'exact';
    } else if (matchedCompound) {
      matchType = 'alternate';
    }

    allChems.push({
      chem,
      healthActs,
      allActs: acts.size,
      plants,
      matchedCompound,
      matchType,
    });
  }

  // Filter to Tier 1 and Tier 2
  const tier1 = allChems.filter(c =>
    c.healthActs.length >= 5 || (c.healthActs.length >= 2 && c.plants >= 50)
  );
  const tier2 = allChems.filter(c =>
    !tier1.includes(c) &&
    (c.healthActs.length >= 3 || (c.healthActs.length >= 1 && c.plants >= 30))
  );

  const selected = [...tier1, ...tier2].sort((a, b) => {
    // Sort by: matched first, then by health acts, then by plants
    if (a.matchType !== 'none' && b.matchType === 'none') return -1;
    if (a.matchType === 'none' && b.matchType !== 'none') return 1;
    if (b.healthActs.length !== a.healthActs.length) return b.healthActs.length - a.healthActs.length;
    return b.plants - a.plants;
  });

  // Count stats
  const matched = selected.filter(c => c.matchType !== 'none').length;
  const noMatch = selected.filter(c => c.matchType === 'none').length;

  // Generate markdown
  let md = `# Duke to Nutri Compound Mapping Tracker

## Progress: ${matched}/${selected.length} mapped (${noMatch} NO_MATCH)

## Overview

- **Source**: Dr. Duke's Phytochemical and Ethnobotanical Database
- **Total Duke chemicals**: 29,572
- **Selected for mapping**: ${selected.length} (Tier 1 + Tier 2)
- **Selection criteria**:
  - Tier 1: 5+ health activities OR (2+ activities AND 50+ plants)
  - Tier 2: 3+ health activities OR (1+ activity AND 30+ plants)

## Instructions

For each Duke compound:
1. If **Nutri Compound** shows a match, verify it's correct
2. If **NO_MATCH**, categorize as:
   - **SKIP**: Aggregate terms, duplicates, or not useful
   - **ADD**: New compound worth tracking
   - **FORM**: Variant of existing compound (set parent)
3. Mark status when reviewed: ✅ (done) or ❌ (skip)

---

## Already Matched (${matched} compounds)

| # | Duke ID | Duke Name | Health Acts | Plants | Nutri Compound | Type | Status |
|---|---------|-----------|-------------|--------|----------------|------|--------|
`;

  let num = 1;
  for (const c of selected.filter(c => c.matchType !== 'none')) {
    const nutriName = c.matchedCompound?.name || 'ERROR';
    const nutriType = c.matchedCompound?.compound_type || '-';
    md += `| ${num++} | ${c.chem} | ${c.chem} | ${c.healthActs.length} | ${c.plants} | ${nutriName} | ${nutriType} | ✅ |\n`;
  }

  md += `
---

## NO_MATCH - Needs Review (${noMatch} compounds)

| # | Duke ID | Duke Name | Health Acts | Plants | Action | Nutri Compound | Parent | Status |
|---|---------|-----------|-------------|--------|--------|----------------|--------|--------|
`;

  num = 1;
  for (const c of selected.filter(c => c.matchType === 'none')) {
    const topActs = c.healthActs.slice(0, 3).join(', ');
    md += `| ${num++} | ${c.chem} | ${c.chem} | ${c.healthActs.length} (${topActs}) | ${c.plants} | | | | |\n`;
  }

  md += `
---

## Action Legend

- **SKIP**: Don't add (aggregate term, duplicate, not useful)
- **ADD**: Add as new compound
- **FORM**: Add as form/variant of existing compound (specify parent)

## Compound Types Reference

- MACRONUTRIENT, MINERAL, VITAMIN, AMINO_ACID, FATTY_ACID
- POLYPHENOL, FLAVONOID, CAROTENOID, TERPENOID
- ALKALOID, ORGANIC_ACID, STEROL, FIBER
- OTHER

---

## Summary Stats

- Tier 1 compounds: ${tier1.length}
- Tier 2 compounds: ${tier2.length}
- Already in Nutri: ${matched}
- Need to add: ${noMatch}
`;

  // Write file
  fs.writeFileSync('docs/DUKE_MAPPING_TRACKER.md', md);
  console.log('Generated docs/DUKE_MAPPING_TRACKER.md');
  console.log('  Total compounds: ' + selected.length);
  console.log('  Already matched: ' + matched);
  console.log('  NO_MATCH: ' + noMatch);

  await sql.end();
}

main().catch(console.error);
