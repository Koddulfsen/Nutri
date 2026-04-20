import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function check() {
  // Manual mapping for Duke names that don't exact-match Nutri compounds
  // Duke uses UPPERCASE-HYPHEN, Nutri uses Title Case with spaces or specific names
  const manualMap: Record<string, string> = {
    // Minerals with "(Total)" suffix
    'CALCIUM': 'Calcium (Total)',
    'IRON': 'Iron (Total)',
    'ZINC': 'Zinc (Total)',
    'MAGNESIUM': 'Magnesium (Total)',
    'SELENIUM': 'Selenium (Total)',
    'CHROMIUM': 'Chromium (Total)',
    // Minerals with element symbol suffix
    'COBALT': 'Cobalt (Co)',
    'ALUMINUM': 'Aluminum (Al)',
    'ARSENIC': 'Arsenic (As) - Total',
    'CADMIUM': 'Cadmium (Cd)',
    'LEAD': 'Lead (Pb)',
    'MERCURY': 'Mercury (Hg) - Total',
    'NICKEL': 'Nickel (Ni)',
    'TIN': 'Tin (Sn)',
    // Vitamins with different names
    'NIACIN': 'Niacin (B3)',
    'THIAMIN': 'Thiamin (B1)',
    'RIBOFLAVIN': 'Riboflavin (B2)',
    'BIOTIN': 'Biotin (B7)',
    'CHOLINE': 'Choline (Total)',
    'FOLATE': 'Folate (Total)',
    // Macros with different names
    'FAT': 'Total Fat',
    'FIBER': 'Dietary Fiber',
    'KILOCALORIES': 'Energy',
    // Sterols
    'PHYTOSTEROLS': 'Total Plant Sterols',
  };

  // 1. Exact name matches
  const exact = await db.execute(sql`
    SELECT sdc.chem_id, sdc.name as duke_name, c.name as nutri_name, c.id as compound_id, c.compound_type
    FROM source_duke_chemicals sdc
    JOIN compounds c ON LOWER(c.name) = LOWER(sdc.name)
    ORDER BY c.compound_type, sdc.name
  `);
  const exactRows = (exact as any).rows ?? exact;

  // 2. Hyphen-to-space matches (OLEIC-ACID -> Oleic Acid)
  const hyphen = await db.execute(sql`
    SELECT sdc.chem_id, sdc.name as duke_name, c.name as nutri_name, c.id as compound_id, c.compound_type
    FROM source_duke_chemicals sdc
    JOIN compounds c ON LOWER(REPLACE(c.name, ' ', '-')) = LOWER(sdc.name)
    WHERE LOWER(c.name) <> LOWER(sdc.name)
    ORDER BY c.compound_type, sdc.name
  `);
  const hyphenRows = (hyphen as any).rows ?? hyphen;

  // 3. Manual mappings
  const manualResults: Array<{chem_id: string; duke_name: string; nutri_name: string; compound_id: string; compound_type: string}> = [];
  for (const [dukeName, nutriName] of Object.entries(manualMap)) {
    const r = await db.execute(sql`
      SELECT sdc.chem_id, sdc.name as duke_name, c.name as nutri_name, c.id as compound_id, c.compound_type
      FROM source_duke_chemicals sdc
      JOIN compounds c ON c.name = ${nutriName}
      WHERE sdc.name = ${dukeName}
    `);
    const rows = (r as any).rows ?? r;
    if (rows.length > 0) {
      manualResults.push(rows[0]);
    } else {
      console.log('WARNING: No match for manual mapping ' + dukeName + ' -> ' + nutriName);
    }
  }

  // Combine and dedupe
  const seen = new Set<string>();
  const all: typeof exactRows = [];
  for (const row of [...exactRows, ...hyphenRows, ...manualResults]) {
    if (!seen.has(row.chem_id)) {
      seen.add(row.chem_id);
      all.push(row);
    }
  }

  // Sort by type then name
  all.sort((a: any, b: any) => {
    if (a.compound_type < b.compound_type) return -1;
    if (a.compound_type > b.compound_type) return 1;
    return a.duke_name.localeCompare(b.duke_name);
  });

  console.log('============================================');
  console.log('COMPLETE DUKE -> NUTRI COMPOUND MAPPING');
  console.log('============================================');
  console.log('Total mappable: ' + all.length);
  console.log('  Exact name match: ' + exactRows.length);
  console.log('  Hyphen-to-space: ' + hyphenRows.length);
  console.log('  Manual mapping: ' + manualResults.length);
  console.log('');

  let currentType = '';
  const typeCounts: Record<string, number> = {};
  for (const r of all) {
    if (r.compound_type !== currentType) {
      currentType = r.compound_type;
      console.log('');
      console.log('--- ' + currentType + ' ---');
      typeCounts[currentType] = 0;
    }
    typeCounts[currentType]++;
    console.log('  ' + r.chem_id + ' -> ' + r.nutri_name);
  }

  console.log('');
  console.log('--- Summary by type ---');
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log('  ' + type + ': ' + count);
  }

  process.exit(0);
}
check();
