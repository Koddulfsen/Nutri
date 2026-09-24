import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DUKE_DIR = '/home/kodd/Nutri/data/duke';
const BATCH_SIZE = 1000;

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('🚀 Starting Dr. Duke\'s import...\n');

  // Log the import
  const [importLog] = await sql`
    INSERT INTO external_data_imports (source, import_type, status)
    VALUES ('duke', 'full', 'running')
    RETURNING id
  `;

  let totalProcessed = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  try {
    // 1. Import Chemicals
    console.log('🧪 Importing Duke chemicals...');
    const chemicalsResult = await importChemicals(sql);
    totalImported += chemicalsResult.imported;
    totalSkipped += chemicalsResult.skipped;
    totalProcessed += chemicalsResult.processed;
    console.log(`   ✅ Chemicals: ${chemicalsResult.imported} imported, ${chemicalsResult.skipped} skipped\n`);

    // 2. Import Plants (from FNFTAX and COMMON_NAMES)
    console.log('🌿 Importing Duke plants...');
    const plantsResult = await importPlants(sql);
    totalImported += plantsResult.imported;
    totalSkipped += plantsResult.skipped;
    totalProcessed += plantsResult.processed;
    console.log(`   ✅ Plants: ${plantsResult.imported} imported, ${plantsResult.skipped} skipped\n`);

    // 3. Import Farmacy (phytochemical content)
    console.log('📊 Importing Duke farmacy data...');
    const farmacyResult = await importFarmacy(sql);
    totalImported += farmacyResult.imported;
    totalSkipped += farmacyResult.skipped;
    totalProcessed += farmacyResult.processed;
    console.log(`   ✅ Farmacy: ${farmacyResult.imported} imported, ${farmacyResult.skipped} skipped\n`);

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

    console.log('✅ Duke import complete!');
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

async function importChemicals(sql: postgres.Sql) {
  const filePath = path.join(DUKE_DIR, 'CHEMICALS.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r: any) => ({
      chem_id: (r.CHEMID || r.CHEM || '').trim(),
      name: (r.CHEM || r.CHEMID || 'Unknown').trim(),
      cas_number: (r.CASNUM || '').trim() || null,
    })).filter((v: any) => v.chem_id && v.chem_id.length > 0);

    if (values.length === 0) {
      skipped += batch.length;
      continue;
    }

    try {
      await sql`
        INSERT INTO source_duke_chemicals ${sql(values)}
        ON CONFLICT (chem_id) DO NOTHING
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

async function importPlants(sql: postgres.Sql) {
  // First read taxonomy file
  const taxPath = path.join(DUKE_DIR, 'FNFTAX.csv');
  const taxContent = fs.readFileSync(taxPath, 'utf-8');
  const taxRecords = parse(taxContent, { columns: true, skip_empty_lines: true, relax_column_count: true });

  // Build taxonomy map
  const plantMap = new Map<string, { latinName: string; family: string }>();
  for (const r of taxRecords) {
    const fnfNum = (r.FNFNUM || '').trim();
    if (fnfNum) {
      plantMap.set(fnfNum, {
        latinName: (r.TAXON || '').trim(),
        family: (r.FAMILY || '').trim(),
      });
    }
  }

  // Then read common names
  const commonPath = path.join(DUKE_DIR, 'COMMON_NAMES.csv');
  const commonContent = fs.readFileSync(commonPath, 'utf-8');
  const commonRecords = parse(commonContent, { columns: true, skip_empty_lines: true, relax_column_count: true });

  // Build common name map (first common name per plant)
  const commonMap = new Map<string, string>();
  for (const r of commonRecords) {
    const fnfNum = (r.FNFNUM || '').trim();
    const commonName = (r.CNNAM || '').trim();
    if (fnfNum && commonName && !commonMap.has(fnfNum)) {
      commonMap.set(fnfNum, commonName);
    }
  }

  // Combine and import
  const values: any[] = [];
  for (const [fnfNum, plant] of plantMap) {
    if (plant.latinName) {
      values.push({
        fnf_num: fnfNum,
        latin_name: plant.latinName,
        common_name: commonMap.get(fnfNum) || null,
        family: plant.family || null,
      });
    }
  }

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);

    try {
      await sql`
        INSERT INTO source_duke_plants ${sql(batch)}
        ON CONFLICT (fnf_num) DO NOTHING
      `;
      imported += batch.length;
    } catch (e: any) {
      console.error(`   Batch error at ${i}: ${e.message}`);
      skipped += batch.length;
    }
  }

  return { imported, skipped, processed: taxRecords.length };
}

async function importFarmacy(sql: postgres.Sql) {
  // Use FARMACY_NEW as it's more comprehensive
  const filePath = path.join(DUKE_DIR, 'FARMACY_NEW.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch.map((r: any) => ({
      fnf_num: (r.FNFNUM || '').trim(),
      chem_id: (r.CHEMID || r.CHEM || '').trim(),
      plant_part: (r.PPCO || r.PLCO || '').trim() || null,
      amount_low: parseFloat(r.AMT_LO || r.AMT_OR_LO) || null,
      amount_high: parseFloat(r.AMT_HI || r.AMT_OR_HI) || null,
      unit: (r.QUANT_UNIT || 'ppm').trim(),
      reference: (r.REFERENCE || r.NAPREF || '').trim() || null,
    })).filter((v: any) => v.fnf_num && v.chem_id);

    if (values.length === 0) {
      skipped += batch.length;
      continue;
    }

    try {
      await sql`
        INSERT INTO source_duke_farmacy ${sql(values)}
      `;
      imported += values.length;
    } catch (e: any) {
      // Silently skip errors (duplicates, etc)
      skipped += values.length;
    }

    if ((i + BATCH_SIZE) % 20000 === 0) {
      console.log(`   Progress: ${Math.min(i + BATCH_SIZE, records.length).toLocaleString()}/${records.length.toLocaleString()}`);
    }
  }

  return { imported, skipped, processed: records.length };
}

main().catch(console.error);
