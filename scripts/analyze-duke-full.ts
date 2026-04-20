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

  // Get our existing compounds
  const ourCompounds = await sql`
    SELECT LOWER(name) as name FROM compounds
    UNION
    SELECT LOWER(unnest(alternate_names)) FROM compounds WHERE alternate_names IS NOT NULL
  `;
  const ourNames = new Set(ourCompounds.map(r => r.name));

  // Get plant counts for all Duke chemicals
  const allPlantCounts = await sql`
    SELECT chem_id, COUNT(DISTINCT fnf_num) as plant_count
    FROM source_duke_farmacy
    GROUP BY chem_id
  `;
  const plantMap = new Map(allPlantCounts.map(r => [r.chem_id, Number(r.plant_count)]));

  // Health-relevant activities (expanded list)
  const healthActivities = new Set([
    // Anti-disease
    'Antitumor', 'Antibacterial', 'Antiviral', 'Antifungal', 'Antiparasitic',
    'Antimalarial', 'AntiHIV', 'Anticancer', 'Antileukemic', 'Anticarcinomic',
    // Protective
    'Antioxidant', 'Hepatoprotective', 'Cardioprotective', 'Neuroprotective',
    'Gastroprotective', 'Nephroprotective', 'Radioprotective',
    // Anti-inflammatory family
    'Antiinflammatory', 'Antiarthritic', 'Antirheumatic', 'Antiedemic',
    // Metabolic
    'Antidiabetic', 'Hypoglycemic', 'Antiobesity', 'Hypolipidemic', 'Hypocholesterolemic',
    // Cardiovascular
    'Hypotensive', 'Antihypertensive', 'Antiatherosclerotic', 'Vasodilator',
    'Antithrombotic', 'Antiaggregant', 'Cardiotonic',
    // Neurological
    'Antidepressant', 'Anxiolytic', 'Sedative', 'Anticonvulsant', 'Antiepileptic',
    'Antidementia', 'Antialzheimeran', 'Antiparkinson', 'Neuroprotective',
    // Pain/Immune
    'Analgesic', 'Immunostimulant', 'Immunomodulator', 'Antiallergic',
    // GI
    'Antiulcer', 'Antidiarrheal', 'Laxative', 'Carminative', 'Digestive',
    // Other therapeutic
    'Antiaging', 'Antimigraine', 'Antiasthmatic', 'Antiosteoporotic',
    'Cancer-Preventive', 'Chemopreventive', 'Antimutagenic', 'Antigenotoxic',
    // Skin
    'Vulnerary', 'Antieczemic', 'Antipsoriatic', 'Antiseptic',
  ]);

  // Categorize all Duke chemicals
  interface ChemData {
    chem: string;
    healthActs: string[];
    allActs: number;
    plants: number;
    inNutri: boolean;
  }

  const allChems: ChemData[] = [];

  for (const [chem, acts] of chemActivities) {
    const normalized = chem.toLowerCase().replace(/-/g, ' ').trim();
    const normalizedDash = chem.toLowerCase();
    const inNutri = ourNames.has(normalized) || ourNames.has(normalizedDash) || ourNames.has(chem.toLowerCase());

    const healthActs = [...acts].filter(a => healthActivities.has(a));
    const plants = plantMap.get(chem) || 0;

    allChems.push({
      chem,
      healthActs,
      allActs: acts.size,
      plants,
      inNutri
    });
  }

  // Also add chemicals WITHOUT activities but found in many plants
  const allDukeChems = await sql`SELECT chem_id, name FROM source_duke_chemicals`;
  for (const row of allDukeChems) {
    if (!chemActivities.has(row.chem_id)) {
      const normalized = row.name.toLowerCase().replace(/-/g, ' ').trim();
      const inNutri = ourNames.has(normalized) || ourNames.has(row.name.toLowerCase());
      const plants = plantMap.get(row.chem_id) || 0;

      if (plants >= 10) { // Only include if found in at least 10 plants
        allChems.push({
          chem: row.chem_id,
          healthActs: [],
          allActs: 0,
          plants,
          inNutri
        });
      }
    }
  }

  // Filter out obvious non-compounds (aggregates, categories)
  const excludePatterns = [
    /^EO$/i, /^RESIN$/i, /^GUM$/i, /^MUCILAGE$/i, /^ALKALOIDS$/i,
    /^TERPENES$/i, /^STEROIDS$/i, /^SAPONINS$/i, /^TANNINS$/i,
    /^FLAVONOIDS$/i, /^PHENOLICS$/i, /^LIGNANS$/i, /^COUMARINS$/i,
    /^ANTHRAQUINONES$/i, /^GLYCOSIDES$/i, /^ESSENTIAL-OIL$/i,
    /^PHYTOSTEROLS$/i, /^CAROTENOIDS$/i, /^ANTHOCYANINS$/i,
    /^PROANTHOCYANIDINS$/i, /^XANTHOPHYLLS$/i,
    /KILOCALORIES/i, /CALORIES/i, /^ASH$/i, /^WATER$/i,
  ];

  const filtered = allChems.filter(c => {
    return !excludePatterns.some(p => p.test(c.chem));
  });

  // Separate into categories
  const notInNutri = filtered.filter(c => !c.inNutri);
  const inNutri = filtered.filter(c => c.inNutri);

  // Score not-in-nutri compounds
  // Score = health activities * 3 + log(plants + 1) * 2
  const scored = notInNutri.map(c => ({
    ...c,
    score: c.healthActs.length * 3 + Math.log(c.plants + 1) * 2
  })).sort((a, b) => b.score - a.score);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('DUKE COMPOUND ANALYSIS - FULL BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Total Duke chemicals: ' + allDukeChems.length);
  console.log('With health activities: ' + chemActivities.size);
  console.log('Already in Nutri: ' + inNutri.length);
  console.log('NOT in Nutri (potential adds): ' + notInNutri.length);

  // Breakdown by tier
  const tier1 = scored.filter(c => c.healthActs.length >= 5 || (c.healthActs.length >= 2 && c.plants >= 50));
  const tier2 = scored.filter(c => !tier1.includes(c) && (c.healthActs.length >= 3 || (c.healthActs.length >= 1 && c.plants >= 30)));
  const tier3 = scored.filter(c => !tier1.includes(c) && !tier2.includes(c) && (c.healthActs.length >= 1 || c.plants >= 20));

  console.log('\n--- Tiers ---');
  console.log('Tier 1 (5+ health acts OR 2+ acts & 50+ plants): ' + tier1.length);
  console.log('Tier 2 (3+ health acts OR 1+ acts & 30+ plants): ' + tier2.length);
  console.log('Tier 3 (1+ health acts OR 20+ plants): ' + tier3.length);
  console.log('Lower priority: ' + (scored.length - tier1.length - tier2.length - tier3.length));

  // Group by compound type (based on naming patterns)
  const categories = {
    flavonoids: [] as typeof scored,
    terpenes: [] as typeof scored,
    alkaloids: [] as typeof scored,
    phenolics: [] as typeof scored,
    acids: [] as typeof scored,
    vitamins: [] as typeof scored,
    minerals: [] as typeof scored,
    fiber: [] as typeof scored,
    enzymes: [] as typeof scored,
    other: [] as typeof scored,
  };

  for (const c of scored) {
    const name = c.chem.toUpperCase();
    if (/FLAVON|FLAVAN|CATECHIN|QUERCETIN|RUTIN|HESPERIDIN|NARINGIN|LUTEOLIN|APIGENIN|KAEMPFEROL|MYRICETIN|ISORHAMNETIN|CYANIDIN|DELPHINIDIN|PEONIDIN|PETUNIDIN|MALVIDIN/.test(name)) {
      categories.flavonoids.push(c);
    } else if (/TERPENE|TERPINENE|PINENE|LIMONENE|LINALOOL|MENTHOL|CARVONE|THUJONE|CAMPHOR|BORNEOL|CINEOLE|MYRCENE|OCIMENE|PHELLANDRENE|SABINENE|CYMENE|CARYOPHYLLENE|HUMULENE|FARNESENE|BISABOLENE|CADINENE|ELEMENE|GERMACRENE|SELINENE|EUDESMOL|GUAIOL|SPATHULENOL|NEROLIDOL|SQUALENE|PHYTOL/.test(name)) {
      categories.terpenes.push(c);
    } else if (/INE$|ININE$|IDINE$|BETAINE|CHOLINE|ALKALOID/.test(name)) {
      categories.alkaloids.push(c);
    } else if (/PHENOL|CRESOL|CATECHOL|HYDROQUINONE|EUGENOL|THYMOL|CARVACROL|GUAIACOL/.test(name)) {
      categories.phenolics.push(c);
    } else if (/ACID$|-ACID$|ACIDIC/.test(name)) {
      categories.acids.push(c);
    } else if (/VITAMIN|VIT-|RETINOL|TOCOPHEROL|THIAMIN|RIBOFLAVIN|NIACIN|PYRIDOXINE|FOLATE|COBALAMIN|BIOTIN|PANTOTHENIC|ASCORB/.test(name)) {
      categories.vitamins.push(c);
    } else if (/CALCIUM|MAGNESIUM|POTASSIUM|SODIUM|IRON|ZINC|COPPER|MANGANESE|SELENIUM|IODINE|CHROMIUM|MOLYBDENUM|PHOSPHORUS|SULFUR/.test(name)) {
      categories.minerals.push(c);
    } else if (/FIBER|PECTIN|CELLULOSE|HEMICELLULOSE|LIGNIN|INULIN|FOS|GOS/.test(name)) {
      categories.fiber.push(c);
    } else if (/ASE$|ENZYME|BROMELAIN|PAPAIN|FICIN/.test(name)) {
      categories.enzymes.push(c);
    } else {
      categories.other.push(c);
    }
  }

  console.log('\n--- By Category (NOT in Nutri) ---');
  for (const [cat, items] of Object.entries(categories)) {
    if (items.length > 0) {
      console.log(cat + ': ' + items.length);
    }
  }

  // Print Tier 1 compounds
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('TIER 1 COMPOUNDS - HIGH VALUE (' + tier1.length + ' compounds)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const c of tier1.slice(0, 100)) {
    const acts = c.healthActs.length > 0 ? c.healthActs.slice(0, 5).join(', ') : 'none';
    const more = c.healthActs.length > 5 ? ' +' + (c.healthActs.length - 5) + ' more' : '';
    console.log(c.chem + ' | ' + c.healthActs.length + ' health acts | ' + c.plants + ' plants | ' + acts + more);
  }

  // Print Tier 2 sample
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('TIER 2 COMPOUNDS - GOOD VALUE (' + tier2.length + ' compounds)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const c of tier2.slice(0, 50)) {
    const acts = c.healthActs.length > 0 ? c.healthActs.slice(0, 4).join(', ') : 'none';
    console.log(c.chem + ' | ' + c.healthActs.length + ' health acts | ' + c.plants + ' plants | ' + acts);
  }

  // Summary recommendation
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('RECOMMENDATION');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Suggested adds to Nutri:');
  console.log('  Tier 1: ' + tier1.length + ' compounds (5+ health activities or 2+ acts with 50+ plant appearances)');
  console.log('  Tier 2: ' + tier2.length + ' compounds (3+ health activities or 1+ acts with 30+ plant appearances)');
  console.log('  TOTAL: ' + (tier1.length + tier2.length) + ' compounds');
  console.log('\nThis would give good coverage of health-relevant phytochemicals without adding everything.');

  await sql.end();
}

main().catch(console.error);
