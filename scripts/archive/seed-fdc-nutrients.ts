/**
 * Seed source_fdc_nutrients catalog from USDA SR Legacy CSV bulk download.
 *
 * One-shot. Idempotent: ON CONFLICT (nutrient_id) DO UPDATE.
 *
 * Usage: npx tsx scripts/seed-fdc-nutrients.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ZIP_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip';

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'fdc-seed-'));
  const zipPath = join(dir, 'sr.zip');

  console.log('Downloading SR Legacy zip (~6MB)...');
  execSync(`curl -sL "${ZIP_URL}" -o "${zipPath}"`);

  console.log('Extracting nutrient.csv...');
  execSync(`unzip -o -j "${zipPath}" "*nutrient.csv" -d "${dir}"`, { stdio: 'pipe' });

  const csvPath = join(dir, 'nutrient.csv');
  if (!existsSync(csvPath)) {
    throw new Error('nutrient.csv not found in zip');
  }

  const text = readFileSync(csvPath, 'utf-8');
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  const header = parseCsvLine(lines[0]).map(h => h.replace(/"/g, ''));
  console.log('CSV columns:', header.join(', '));

  // Expected: id, name, unit_name, nutrient_nbr, rank
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const unitIdx = header.indexOf('unit_name');
  const nbrIdx = header.indexOf('nutrient_nbr');
  const rankIdx = header.indexOf('rank');

  if (idIdx < 0 || nameIdx < 0 || unitIdx < 0) {
    throw new Error('CSV missing expected columns');
  }

  let inserted = 0;
  let updated = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const nutrientId = parseInt(cells[idIdx], 10);
    if (!Number.isFinite(nutrientId)) continue;
    const name = cells[nameIdx];
    const unit = cells[unitIdx];
    const nbr = nbrIdx >= 0 ? cells[nbrIdx] || null : null;
    const rank = rankIdx >= 0 && cells[rankIdx] ? parseInt(cells[rankIdx], 10) : null;

    const r = await db.execute(sql`
      INSERT INTO source_fdc_nutrients (nutrient_id, name, unit, nutrient_nbr, rank)
      VALUES (${nutrientId}, ${name}, ${unit}, ${nbr}, ${rank})
      ON CONFLICT (nutrient_id) DO UPDATE SET
        name = EXCLUDED.name,
        unit = EXCLUDED.unit,
        nutrient_nbr = EXCLUDED.nutrient_nbr,
        rank = EXCLUDED.rank
      RETURNING (xmax = 0) AS inserted
    `);
    const row = ((r as any).rows ?? r)[0];
    if (row?.inserted) inserted++;
    else updated++;
  }

  rmSync(dir, { recursive: true, force: true });
  console.log(`Done. Inserted: ${inserted}, Updated: ${updated}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
