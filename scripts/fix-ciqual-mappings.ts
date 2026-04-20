import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Fix CIQUAL compound mappings where compound names in the original script
 * didn't match the actual names in the compounds table.
 *
 * These are name-mismatch fixes — the CIQUAL codes are correct,
 * but compound names need to use the canonical Nutri database names.
 */
const nameFixes: { code: string; infoods: string; wrongName: string; correctName: string; isCanonical: boolean }[] = [
  // Proximates
  { code: '10000', infoods: 'ASH', wrongName: 'Ash', correctName: 'Ash', isCanonical: true },
  { code: '31000', infoods: 'CHOAVL', wrongName: 'Total Carbohydrate', correctName: 'Carbohydrates', isCanonical: true },
  { code: '60000', infoods: 'ALC', wrongName: 'Alcohol', correctName: 'Ethanol', isCanonical: true },
  { code: '34100', infoods: 'FIB-', wrongName: 'Total Fiber', correctName: 'Dietary Fiber', isCanonical: true },

  // Fatty Acids
  { code: '40304', infoods: 'FAPU', wrongName: 'Polyunsaturated Fat', correctName: 'Polyunsaturated Fat', isCanonical: true },
  { code: '41819', infoods: 'F18D1CN9', wrongName: 'Oleic Acid (cis)', correctName: 'Oleic Acid', isCanonical: true },
  { code: '41826', infoods: 'F18D2CN6', wrongName: 'Linoleic Acid (cis,cis)', correctName: 'Linoleic Acid', isCanonical: true },
  { code: '41833', infoods: 'F18D3N3', wrongName: 'Alpha-Linolenic Acid', correctName: 'ALA', isCanonical: true },
  { code: '42046', infoods: 'F20D4N6', wrongName: 'Arachidonic Acid', correctName: 'Arachidonic Acid', isCanonical: true },
  { code: '42053', infoods: 'F20D5N3', wrongName: 'Eicosapentaenoic Acid', correctName: 'EPA', isCanonical: true },
  { code: '42263', infoods: 'F22D6N3', wrongName: 'Docosahexaenoic Acid', correctName: 'DHA', isCanonical: true },

  // Minerals (Total variants)
  { code: '10110', infoods: 'NA', wrongName: 'Sodium', correctName: 'Sodium (Total)', isCanonical: true },
  { code: '10120', infoods: 'MG', wrongName: 'Magnesium', correctName: 'Magnesium (Total)', isCanonical: true },
  { code: '10150', infoods: 'P', wrongName: 'Phosphorus', correctName: 'Phosphorus (Total)', isCanonical: true },
  { code: '10190', infoods: 'K', wrongName: 'Potassium', correctName: 'Potassium (Total)', isCanonical: true },
  { code: '10200', infoods: 'CA', wrongName: 'Calcium', correctName: 'Calcium (Total)', isCanonical: true },
  { code: '10251', infoods: 'MN', wrongName: 'Manganese', correctName: 'Manganese (Total)', isCanonical: true },
  { code: '10260', infoods: 'FE', wrongName: 'Iron', correctName: 'Iron (Total)', isCanonical: true },
  { code: '10290', infoods: 'CU', wrongName: 'Copper', correctName: 'Copper (Total)', isCanonical: true },
  { code: '10300', infoods: 'ZN', wrongName: 'Zinc', correctName: 'Zinc (Total)', isCanonical: true },
  { code: '10340', infoods: 'SE', wrongName: 'Selenium', correctName: 'Selenium (Total)', isCanonical: true },
  { code: '10530', infoods: 'ID', wrongName: 'Iodine', correctName: 'Iodine (Total)', isCanonical: true },

  // Vitamins
  { code: '51104', infoods: 'RAE', wrongName: 'Vitamin A', correctName: 'Vitamin A (RAE)', isCanonical: true },
  { code: '52100', infoods: 'VITD-', wrongName: 'Vitamin D', correctName: 'Vitamin D (Total)', isCanonical: true },
  { code: '52200', infoods: 'ERGCAL', wrongName: 'Vitamin D2', correctName: 'Vitamin D2 (Ergocalciferol)', isCanonical: true },
  { code: '52300', infoods: 'CHOCAL', wrongName: 'Vitamin D3', correctName: 'Vitamin D3 (Cholecalciferol)', isCanonical: true },
  { code: '53100', infoods: 'VITE-', wrongName: 'Vitamin E', correctName: 'Vitamin E (Total)', isCanonical: true },
  { code: '54101', infoods: 'VITK1', wrongName: 'Vitamin K', correctName: 'Vitamin K1 (Phylloquinone)', isCanonical: true },
  { code: '54104', infoods: 'VITK2', wrongName: 'Vitamin K2', correctName: 'Vitamin K2 (Menaquinone)', isCanonical: true },
  { code: '55100', infoods: 'VITC', wrongName: 'Vitamin C', correctName: 'Vitamin C (Total)', isCanonical: true },
  { code: '56100', infoods: 'THIA', wrongName: 'Thiamin', correctName: 'Thiamin (B1)', isCanonical: true },
  { code: '56200', infoods: 'RIBF', wrongName: 'Riboflavin', correctName: 'Riboflavin (B2)', isCanonical: true },
  { code: '56310', infoods: 'NIA', wrongName: 'Niacin', correctName: 'Niacin (B3)', isCanonical: true },
  { code: '56400', infoods: 'PANTAC', wrongName: 'Pantothenic Acid', correctName: 'Pantothenic Acid (B5)', isCanonical: true },
  { code: '56600', infoods: 'VITB12', wrongName: 'Vitamin B12', correctName: 'Vitamin B12 (Total)', isCanonical: true },
  { code: '56700', infoods: 'FOL', wrongName: 'Folate', correctName: 'Folate (Total)', isCanonical: true },
  { code: '56708', infoods: 'FOLAC', wrongName: 'Folic Acid', correctName: 'Folic Acid', isCanonical: true },
];

async function main() {
  console.log('=== Fix CIQUAL Compound Mappings ===\n');

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const fix of nameFixes) {
    // Check if mapping already exists for this code
    const existingMapping = await db.execute(sql`
      SELECT id FROM compound_sources
      WHERE external_source = 'CIQUAL' AND external_id = ${fix.code}
    `);

    if ((existingMapping.rows || existingMapping).length > 0) {
      skipped++;
      continue;
    }

    // Find the compound by correct name
    const compound = await db.execute(sql`
      SELECT id, name FROM compounds WHERE LOWER(name) = LOWER(${fix.correctName})
    `);

    const rows = compound.rows || compound;
    if (rows.length === 0) {
      console.log(`  ❌ Compound not found: "${fix.correctName}" (for ${fix.code}/${fix.infoods})`);
      notFound++;
      continue;
    }

    const compoundId = rows[0].id;

    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${compoundId}, 'CIQUAL', ${fix.code}, ${`${fix.correctName} (${fix.infoods})`}, ${fix.isCanonical})
      `);
      console.log(`  ✅ ${fix.code} → ${fix.correctName}`);
      created++;
    } catch (err: any) {
      console.log(`  ❌ Failed: ${fix.code} → ${fix.correctName} - ${err.message}`);
    }
  }

  console.log(`\nCreated: ${created}`);
  console.log(`Already existed: ${skipped}`);
  console.log(`Not found: ${notFound}`);

  // Show final CIQUAL mapping count
  const totalResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM compound_sources WHERE external_source = 'CIQUAL'
  `);
  const total = (totalResult.rows || totalResult)[0].count;
  console.log(`\nTotal CIQUAL mappings: ${total}`);
}

main().catch(console.error).finally(() => process.exit());
