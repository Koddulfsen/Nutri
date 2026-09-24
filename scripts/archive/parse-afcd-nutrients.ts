import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = '/home/kodd/Nutri/data/afcd';

interface AFCDNutrient {
  category: string;
  name: string;
  unit: string;
  infoods_tag: string;
  eurofir_name: string;
  is_core: boolean;
}

function parseNutrientSheet(sheet: XLSX.WorkSheet, category: string): AFCDNutrient[] {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const nutrients: AFCDNutrient[] = [];

  // Find header row (contains 'Component' or similar)
  let headerRowIdx = -1;
  let componentCol = -1;
  let unitCol = -1;
  let infoodsCol = -1;
  let eurofirCol = -1;
  let coreCol = -1;

  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;

    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase();
      if (cell === 'component') {
        headerRowIdx = i;
        componentCol = j;
      }
      if (cell === 'units' || cell === 'unit') unitCol = j;
      if (cell.includes('infoods')) infoodsCol = j;
      if (cell.includes('eurofir')) eurofirCol = j;
      if (cell.includes('core')) coreCol = j;
    }
    if (headerRowIdx >= 0) break;
  }

  if (headerRowIdx < 0) {
    console.log(`  No header found in ${category}`);
    return nutrients;
  }

  // Parse nutrient rows
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[componentCol]) continue;

    const name = String(row[componentCol] || '').trim();

    // Skip category headers (usually single word in all caps or contain commas)
    if (!name || name === 'Component') continue;

    // Skip rows that look like section headers
    if (['Proximates', 'Vitamins', 'Minerals', 'Carbohydrates', 'Energy'].includes(name)) continue;

    const unit = String(row[unitCol] || '').trim();
    const infoods = String(row[infoodsCol] || '').trim();
    const eurofir = String(row[eurofirCol] || '').trim();
    const isCore = row[coreCol] === 'ü' || row[coreCol] === 'Y' || row[coreCol] === 'Yes';

    nutrients.push({
      category,
      name,
      unit,
      infoods_tag: infoods,
      eurofir_name: eurofir,
      is_core: isCore,
    });
  }

  return nutrients;
}

async function main() {
  console.log('=== Extracting AFCD Nutrients ===\n');

  const filePath = path.join(DATA_DIR, 'nutrient-details.xlsx');
  const workbook = XLSX.readFile(filePath);

  const allNutrients: AFCDNutrient[] = [];
  const sheetsToProcess = ['Core nutrients', 'Proximates', 'Vitamins', 'Minerals', 'Fatty acids', 'Amino acids', 'Other'];

  for (const sheetName of sheetsToProcess) {
    if (!workbook.Sheets[sheetName]) {
      console.log(`Sheet not found: ${sheetName}`);
      continue;
    }

    const nutrients = parseNutrientSheet(workbook.Sheets[sheetName], sheetName);
    console.log(`${sheetName}: ${nutrients.length} nutrients`);
    allNutrients.push(...nutrients);
  }

  // Deduplicate by name (some may appear in multiple sheets)
  const uniqueMap = new Map<string, AFCDNutrient>();
  for (const n of allNutrients) {
    const key = n.name.toLowerCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, n);
    }
  }
  const uniqueNutrients = Array.from(uniqueMap.values());

  console.log(`\n=== Summary ===`);
  console.log(`Total nutrients (all sheets): ${allNutrients.length}`);
  console.log(`Unique nutrients: ${uniqueNutrients.length}`);
  console.log(`Core nutrients: ${uniqueNutrients.filter(n => n.is_core).length}`);

  // Group by category
  const byCategory: Record<string, AFCDNutrient[]> = {};
  for (const n of uniqueNutrients) {
    if (!byCategory[n.category]) byCategory[n.category] = [];
    byCategory[n.category].push(n);
  }

  console.log('\n=== By Category ===');
  for (const [cat, nuts] of Object.entries(byCategory)) {
    console.log(`${cat}: ${nuts.length}`);
  }

  // Print all nutrients for review
  console.log('\n=== Full Nutrient List ===\n');
  let idx = 1;
  for (const [cat, nuts] of Object.entries(byCategory)) {
    console.log(`\n## ${cat}\n`);
    for (const n of nuts) {
      const coreFlag = n.is_core ? ' [CORE]' : '';
      console.log(`${idx}. ${n.name} (${n.unit})${coreFlag} - INFOODS: ${n.infoods_tag}`);
      idx++;
    }
  }

  // Save to JSON
  const outputPath = path.join(DATA_DIR, 'nutrient-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueNutrients, null, 2));
  console.log(`\nSaved to: ${outputPath}`);
}

main().catch(console.error);
