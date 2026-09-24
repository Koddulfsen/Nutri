import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';

interface CoFIDNutrient {
  sheet: string;
  code: string;
  name: string;
  unit: string;
}

async function main() {
  // Load CoFID Excel
  const wb = XLSX.readFile('data/uk-cofid/cofid-2021.xlsx');

  const allNutrients: CoFIDNutrient[] = [];

  const dataSheets = [
    '1.3 Proximates',
    '1.4 Inorganics',
    '1.5 Vitamins',
    '1.6 Vitamin Fractions',
    '1.8 (SFA per 100gFood)',
    '1.10 (MUFA per 100gFood)',
    '1.12 (PUFA per 100gFood)',
    '1.13 Phytosterols',
    '1.14 Organic Acids'
  ];

  for (const sheetName of dataSheets) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    const headerRow = data[0];
    const codeRow = data[1];

    if (!headerRow) continue;

    for (let i = 7; i < headerRow.length; i++) {
      const fullName = headerRow[i];
      const code = codeRow ? codeRow[i] : '';

      if (fullName && fullName.toString().trim()) {
        // Extract unit from name like "Water (g)" -> g
        const match = fullName.toString().match(/\(([^)]+)\)\s*$/);
        const unit = match ? match[1] : '';
        const cleanName = fullName.toString().replace(/\s*\([^)]+\)\s*$/, '').trim();

        allNutrients.push({
          sheet: sheetName.replace(/^1\.\d+\s*/, '').replace(/\s*\([^)]+\)$/, ''),
          code: code || '',
          name: cleanName,
          unit
        });
      }
    }
  }

  console.log(`CoFID nutrients: ${allNutrients.length}`);

  // Get existing compounds
  const result = await db.execute(sql`
    SELECT id, name, compound_type, unit FROM compounds
  `);

  const compounds = result.rows || result;
  console.log(`Nutri compounds: ${compounds.length}`);

  // Normalize names for matching
  const normalize = (s: string) => s.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/vitamin/g, 'vit')
    .replace(/acid/g, '')
    .replace(/total/g, '');

  const compoundMap = new Map<string, any>();
  for (const c of compounds) {
    compoundMap.set(normalize(c.name as string), c);
  }

  // Match CoFID nutrients to Nutri compounds
  const matched: { cofid: CoFIDNutrient; nutri: any }[] = [];
  const unmatched: CoFIDNutrient[] = [];

  for (const n of allNutrients) {
    const normalized = normalize(n.name);

    // Try direct match
    let found = compoundMap.get(normalized);

    // Try common variations
    if (!found) {
      // Try without "cis" prefix
      const noCis = normalized.replace(/^cis/, '').replace(/^trans/, '');
      found = compoundMap.get(noCis);
    }

    // Try mapping common names
    const nameMap: Record<string, string> = {
      'water': 'water',
      'protein': 'protein',
      'fat': 'totalfat',
      'carbohydrate': 'carbohydrate',
      'energykcal': 'energy',
      'energykj': 'energy',
      'sodium': 'sodium',
      'potassium': 'potassium',
      'calcium': 'calcium',
      'magnesium': 'magnesium',
      'phosphorus': 'phosphorus',
      'iron': 'iron',
      'copper': 'copper',
      'zinc': 'zinc',
      'chloride': 'chloride',
      'manganese': 'manganese',
      'selenium': 'selenium',
      'iodine': 'iodine',
      'retinol': 'retinol',
      'carotene': 'betacarotene',
      'cholecalciferol': 'vitamind3',
      'thiamin': 'thiamine',
      'riboflavin': 'riboflavin',
      'niacin': 'niacin',
      'pantothenate': 'pantothenicvitb5',
      'biotin': 'biotin',
      'folate': 'folate',
      'alphatocopherol': 'alphatocopherol',
      'betacarotene': 'betacarotene',
      'alphacarotene': 'alphacarotene',
      'lycopene': 'lycopene',
      'lutein': 'lutein',
      'cholesterol': 'cholesterol',
      'betasitosterol': 'betasitosterol',
      'campesterol': 'campesterol',
      'stigmasterol': 'stigmasterol',
      'starch': 'starch',
      'glucose': 'glucose',
      'fructose': 'fructose',
      'sucrose': 'sucrose',
      'maltose': 'maltose',
      'lactose': 'lactose',
      'galactose': 'galactose',
    };

    if (!found && nameMap[normalized]) {
      found = compoundMap.get(nameMap[normalized]);
    }

    if (found) {
      matched.push({ cofid: n, nutri: found });
    } else {
      unmatched.push(n);
    }
  }

  console.log(`\nDirect matches: ${matched.length}`);
  console.log(`Unmatched: ${unmatched.length}`);

  // Group unmatched by category
  console.log('\n=== UNMATCHED BY CATEGORY ===');
  const bySheet: Record<string, CoFIDNutrient[]> = {};
  for (const n of unmatched) {
    if (!bySheet[n.sheet]) bySheet[n.sheet] = [];
    bySheet[n.sheet].push(n);
  }

  for (const [sheet, items] of Object.entries(bySheet)) {
    console.log(`\n${sheet} (${items.length}):`);
    for (const item of items) {
      console.log(`  - ${item.code}: ${item.name} (${item.unit})`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`CoFID total: ${allNutrients.length}`);
  console.log(`Matched to existing compounds: ${matched.length}`);
  console.log(`New/unmatched: ${unmatched.length}`);
  console.log(`\nBreakdown:`);
  for (const [sheet, items] of Object.entries(bySheet)) {
    console.log(`  ${sheet}: ${items.length} unmatched`);
  }
}

main().catch(console.error).finally(() => process.exit());
