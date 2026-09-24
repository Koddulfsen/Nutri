import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const FOODB_DIR = '/home/kodd/Nutri/data/foodb/foodb_2020_04_07_csv';
const BATCH_SIZE = 1000;

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('🚀 Starting FooDB import...\n');

  // Log the import
  const [importLog] = await sql`
    INSERT INTO external_data_imports (source, import_type, status)
    VALUES ('foodb', 'full', 'running')
    RETURNING id
  `;

  let totalProcessed = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  try {
    // 1. Import Compounds
    console.log('📦 Importing FooDB compounds...');
    const compoundsResult = await importCompounds(sql);
    totalImported += compoundsResult.imported;
    totalSkipped += compoundsResult.skipped;
    totalProcessed += compoundsResult.processed;
    console.log(`   ✅ Compounds: ${compoundsResult.imported} imported, ${compoundsResult.skipped} skipped\n`);

    // 2. Import Foods
    console.log('🍎 Importing FooDB foods...');
    const foodsResult = await importFoods(sql);
    totalImported += foodsResult.imported;
    totalSkipped += foodsResult.skipped;
    totalProcessed += foodsResult.processed;
    console.log(`   ✅ Foods: ${foodsResult.imported} imported, ${foodsResult.skipped} skipped\n`);

    // 3. Import Content (food-compound mappings)
    console.log('📊 Importing FooDB content (this may take a while)...');
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

    console.log('✅ FooDB import complete!');
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
  const filePath = path.join(FOODB_DIR, 'Compound.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r: any) => ({
      foodb_id: parseInt(r.id) || null,
      public_id: r.public_id || null,
      name: r.name || 'Unknown',
      cas_number: r.cas_number || null,
      moldb_inchikey: r.moldb_inchikey || null,
      moldb_smiles: r.moldb_smiles || null,
      kingdom: r.kingdom || null,
      superclass: r.superklass || null,
      klass: r.klass || null,
      subclass: r.subklass || null,
    })).filter((v: any) => v.foodb_id !== null);

    if (values.length === 0) continue;

    try {
      await sql`
        INSERT INTO source_foodb_compounds ${sql(values)}
        ON CONFLICT (foodb_id) DO NOTHING
      `;
      imported += values.length;
    } catch (e: any) {
      console.error(`   Batch error at ${i}: ${e.message}`);
      skipped += values.length;
    }

    if ((i + BATCH_SIZE) % 10000 === 0) {
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
    }
  }

  return { imported, skipped, processed: records.length };
}

async function importFoods(sql: postgres.Sql) {
  const filePath = path.join(FOODB_DIR, 'Food.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r: any) => ({
      foodb_id: parseInt(r.id) || null,
      name: r.name || 'Unknown',
      name_scientific: r.name_scientific || null,
      description: r.description?.substring(0, 10000) || null,
      food_group: r.food_group || null,
      food_subgroup: r.food_subgroup || null,
    })).filter((v: any) => v.foodb_id !== null);

    if (values.length === 0) continue;

    try {
      await sql`
        INSERT INTO source_foodb_foods ${sql(values)}
        ON CONFLICT (foodb_id) DO NOTHING
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
  const filePath = path.join(FOODB_DIR, 'Content.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;
  const CONTENT_BATCH = 5000; // Larger batches for content

  for (let i = 0; i < records.length; i += CONTENT_BATCH) {
    const batch = records.slice(i, i + CONTENT_BATCH);
    const values = batch.map((r: any) => ({
      foodb_id: parseInt(r.id) || null,
      foodb_food_id: parseInt(r.food_id) || null,
      foodb_compound_id: parseInt(r.source_id) || null,
      source_type: r.source_type || null,
      orig_food_name: r.orig_food_common_name?.substring(0, 500) || null,
      orig_content: parseFloat(r.orig_content) || null,
      orig_unit: r.orig_unit || null,
      standard_content: parseFloat(r.standard_content) || null,
      preparation_type: r.preparation_type || 'raw',
      citation: r.citation?.substring(0, 500) || null,
    })).filter((v: any) => v.foodb_id !== null && v.foodb_food_id !== null && v.foodb_compound_id !== null);

    if (values.length === 0) {
      skipped += batch.length;
      continue;
    }

    try {
      await sql`
        INSERT INTO source_foodb_content ${sql(values)}
        ON CONFLICT (foodb_food_id, foodb_compound_id, preparation_type) DO NOTHING
      `;
      imported += values.length;
    } catch (e: any) {
      // Silently skip duplicates
      skipped += values.length;
    }

    if ((i + CONTENT_BATCH) % 100000 === 0) {
      console.log(`   Progress: ${Math.min(i + CONTENT_BATCH, records.length).toLocaleString()}/${records.length.toLocaleString()}`);
    }
  }

  return { imported, skipped, processed: records.length };
}

main().catch(console.error);
