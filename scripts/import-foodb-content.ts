import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

const FOODB_DIR = '/home/kodd/Nutri/data/foodb/foodb_2020_04_07_csv';
const BATCH_SIZE = 5000;

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  console.log('🚀 Starting FooDB content import (streaming)...\n');

  // Log the import
  const [importLog] = await sql`
    INSERT INTO external_data_imports (source, import_type, status)
    VALUES ('foodb', 'incremental', 'running')
    RETURNING id
  `;

  let imported = 0;
  let skipped = 0;
  let processed = 0;
  let batch: any[] = [];

  const filePath = path.join(FOODB_DIR, 'Content.csv');

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    })
  );

  console.log('📊 Streaming Content.csv...');

  for await (const record of parser) {
    processed++;

    const value = {
      foodb_id: parseInt(record.id) || null,
      foodb_food_id: parseInt(record.food_id) || null,
      foodb_compound_id: parseInt(record.source_id) || null,
      source_type: record.source_type || null,
      orig_food_name: record.orig_food_common_name?.substring(0, 500) || null,
      orig_content: parseFloat(record.orig_content) || null,
      orig_unit: record.orig_unit || null,
      standard_content: parseFloat(record.standard_content) || null,
      preparation_type: record.preparation_type || 'raw',
      citation: record.citation?.substring(0, 500) || null,
    };

    if (value.foodb_id && value.foodb_food_id && value.foodb_compound_id) {
      batch.push(value);
    } else {
      skipped++;
    }

    if (batch.length >= BATCH_SIZE) {
      try {
        await sql`
          INSERT INTO source_foodb_content ${sql(batch)}
          ON CONFLICT (foodb_food_id, foodb_compound_id, preparation_type) DO NOTHING
        `;
        imported += batch.length;
      } catch (e: any) {
        skipped += batch.length;
      }
      batch = [];

      if (processed % 100000 === 0) {
        console.log(`   Progress: ${processed.toLocaleString()} rows processed, ${imported.toLocaleString()} imported`);
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    try {
      await sql`
        INSERT INTO source_foodb_content ${sql(batch)}
        ON CONFLICT (foodb_food_id, foodb_compound_id, preparation_type) DO NOTHING
      `;
      imported += batch.length;
    } catch (e: any) {
      skipped += batch.length;
    }
  }

  // Update import log
  await sql`
    UPDATE external_data_imports
    SET status = 'completed',
        records_processed = ${processed},
        records_imported = ${imported},
        records_skipped = ${skipped},
        completed_at = NOW()
    WHERE id = ${importLog.id}
  `;

  console.log(`\n✅ FooDB content import complete!`);
  console.log(`   Total processed: ${processed.toLocaleString()}`);
  console.log(`   Total imported: ${imported.toLocaleString()}`);
  console.log(`   Total skipped: ${skipped.toLocaleString()}`);

  await sql.end();
}

main().catch(console.error);
