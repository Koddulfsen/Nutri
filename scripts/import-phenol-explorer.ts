import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

const PHENOL_DIR = '/home/kodd/Nutri/data/phenol-explorer';
const BATCH_SIZE = 500;

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('🚀 Starting Phenol-Explorer import...\n');

  // Log the import
  const [importLog] = await sql`
    INSERT INTO external_data_imports (source, import_type, status)
    VALUES ('phenol_explorer', 'full', 'running')
    RETURNING id
  `;

  let totalProcessed = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  try {
    // 1. Import Compounds
    console.log('🧪 Importing Phenol-Explorer compounds...');
    const compoundsResult = await importCompounds(sql);
    totalImported += compoundsResult.imported;
    totalSkipped += compoundsResult.skipped;
    totalProcessed += compoundsResult.processed;
    console.log(`   ✅ Compounds: ${compoundsResult.imported} imported, ${compoundsResult.skipped} skipped\n`);

    // 2. Import Foods
    console.log('🍎 Importing Phenol-Explorer foods...');
    const foodsResult = await importFoods(sql);
    totalImported += foodsResult.imported;
    totalSkipped += foodsResult.skipped;
    totalProcessed += foodsResult.processed;
    console.log(`   ✅ Foods: ${foodsResult.imported} imported, ${foodsResult.skipped} skipped\n`);

    // 3. Import Content from Excel file
    console.log('📊 Importing Phenol-Explorer composition data...');
    const contentResult = await importContent(sql);
    totalImported += contentResult.imported;
    totalSkipped += contentResult.skipped;
    totalProcessed += contentResult.processed;
    console.log(`   ✅ Content: ${contentResult.imported} imported, ${contentResult.skipped} skipped\n`);

    // Update import log
    await sql`
      UPDATE external_data_imports
      SET status = 'completed',
          records_processed = ${totalProcessed},
          records_imported = ${totalImported},
          records_skipped = ${totalSkipped},
          records_failed = ${totalFailed},
          completed_at = NOW()
      WHERE id = ${importLog.id}
    `;

    console.log('✅ Phenol-Explorer import complete!');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Total imported: ${totalImported}`);
    console.log(`   Total skipped: ${totalSkipped}`);

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    await sql`
      UPDATE external_data_imports
      SET status = 'failed',
          records_processed = ${totalProcessed},
          records_imported = ${totalImported},
          records_failed = ${totalFailed},
          error_log = ${JSON.stringify({ error: error.message })}::jsonb,
          completed_at = NOW()
      WHERE id = ${importLog.id}
    `;
  }

  await sql.end();
}

async function importCompounds(sql: postgres.Sql) {
  const filePath = path.join(PHENOL_DIR, 'compounds.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r: any) => ({
      phenol_id: parseInt(r.id) || null,
      name: (r.name || 'Unknown').trim(),
      compound_class: (r.compound_class || '').trim() || null,
      compound_subclass: (r.compound_subclass || '').trim() || null,
      molecular_weight: parseFloat(r.molecular_weight) || null,
      cas_number: (r.cas_number || '').trim() || null,
      chebi_id: (r.chebi_id || '').trim() || null,
      pubchem_id: (r.pubchem_compound_id || '').trim() || null,
    })).filter((v: any) => v.phenol_id !== null);

    if (values.length === 0) {
      skipped += batch.length;
      continue;
    }

    try {
      await sql`
        INSERT INTO source_phenol_compounds ${sql(values)}
        ON CONFLICT (phenol_id) DO NOTHING
      `;
      imported += values.length;
    } catch (e: any) {
      console.error(`   Batch error at ${i}: ${e.message}`);
      skipped += values.length;
    }
  }

  return { imported, skipped, processed: records.length };
}

async function importFoods(sql: postgres.Sql) {
  const filePath = path.join(PHENOL_DIR, 'foods.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r: any) => ({
      phenol_id: parseInt(r.id) || null,
      name: (r.name || 'Unknown').trim(),
      food_group: (r.food_group || '').trim() || null,
      food_subgroup: (r.food_subgroup || '').trim() || null,
      scientific_name: (r.food_source_scientific_name || '').trim() || null,
    })).filter((v: any) => v.phenol_id !== null);

    if (values.length === 0) {
      skipped += batch.length;
      continue;
    }

    try {
      await sql`
        INSERT INTO source_phenol_foods ${sql(values)}
        ON CONFLICT (phenol_id) DO NOTHING
      `;
      imported += values.length;
    } catch (e: any) {
      console.error(`   Batch error at ${i}: ${e.message}`);
      skipped += values.length;
    }
  }

  return { imported, skipped, processed: records.length };
}

async function importContent(sql: postgres.Sql) {
  const filePath = path.join(PHENOL_DIR, 'composition-data.xlsx');

  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`   Found ${records.length} records in Excel file`);

  let imported = 0;
  let skipped = 0;

  // First, get the compound and food ID mappings
  const compoundMap = new Map<string, number>();
  const foodMap = new Map<string, number>();

  // Try to map by name since we may not have direct IDs in composition data
  const compoundRows = await sql`SELECT phenol_id, name FROM source_phenol_compounds`;
  for (const row of compoundRows) {
    compoundMap.set(row.name.toLowerCase(), row.phenol_id);
  }

  const foodRows = await sql`SELECT phenol_id, name FROM source_phenol_foods`;
  for (const row of foodRows) {
    foodMap.set(row.name.toLowerCase(), row.phenol_id);
  }

  // Parse composition data - structure depends on Excel format
  // Typically: food_name, compound_name, mean, min, max, unit, n_publications
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values: any[] = [];

    for (const r of batch) {
      // Try to find food and compound IDs
      const foodName = (r.food || r.Food || r.food_name || '').toString().toLowerCase();
      const compoundName = (r.compound || r.Compound || r.compound_name || r.polyphenol || '').toString().toLowerCase();

      const foodId = foodMap.get(foodName) || parseInt(r.food_id) || null;
      const compoundId = compoundMap.get(compoundName) || parseInt(r.compound_id) || null;

      if (!foodId || !compoundId) {
        skipped++;
        continue;
      }

      values.push({
        phenol_food_id: foodId,
        phenol_compound_id: compoundId,
        content_mean: parseFloat(r.mean || r.Mean || r.content) || null,
        content_min: parseFloat(r.min || r.Min) || null,
        content_max: parseFloat(r.max || r.Max) || null,
        unit: (r.unit || r.Unit || 'mg/100g').toString(),
        publication_count: parseInt(r.n || r.publications || r.n_publications) || null,
      });
    }

    if (values.length === 0) continue;

    try {
      await sql`
        INSERT INTO source_phenol_content ${sql(values)}
        ON CONFLICT (phenol_food_id, phenol_compound_id) DO NOTHING
      `;
      imported += values.length;
    } catch (e: any) {
      console.error(`   Batch error at ${i}: ${e.message}`);
      skipped += values.length;
    }

    if ((i + BATCH_SIZE) % 5000 === 0) {
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
    }
  }

  return { imported, skipped, processed: records.length };
}

main().catch(console.error);
