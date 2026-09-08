/**
 * Seed source_cnf_nutrients catalog from Health Canada CNF 2015 CSV bulk download.
 *
 * One-shot. Idempotent: ON CONFLICT (nutrient_id) DO UPDATE.
 *
 * Usage: npx tsx scripts/seed-cnf-nutrients.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ZIP_URL = 'https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/fn-an/alt_formats/zip/nutrition/fiche-nutri-data/cnf-fcen-csv.zip';

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
  const dir = mkdtempSync(join(tmpdir(), 'cnf-seed-'));
  const zipPath = join(dir, 'cnf.zip');

  console.log('Downloading CNF zip (~30MB)...');
  execSync(`curl -sL "${ZIP_URL}" -o "${zipPath}"`);

  console.log('Extracting NUTRIENT NAME.csv...');
  execSync(`unzip -o -j "${zipPath}" "NUTRIENT NAME.csv" -d "${dir}"`, { stdio: 'pipe' });

  const csvPath = join(dir, 'NUTRIENT NAME.csv');
  if (!existsSync(csvPath)) {
    throw new Error('NUTRIENT NAME.csv not found in zip');
  }

  // CNF uses Latin-1 encoding for French names — read as latin1 then we'll only
  // store English column anyway, but be safe.
  const text = readFileSync(csvPath, 'latin1');
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  const header = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
  console.log('CSV columns:', header.join(', '));

  // Expected: NutrientID, NutrientCode, NutrientSymbol, NutrientUnit, NutrientName, NutrientNameF, Tagname, NutrientDecimals
  const idIdx = header.indexOf('NutrientID');
  const symbolIdx = header.indexOf('NutrientSymbol');
  const unitIdx = header.indexOf('NutrientUnit');
  const nameIdx = header.indexOf('NutrientName');
  const tagIdx = header.indexOf('Tagname');

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
    const symbol = symbolIdx >= 0 ? cells[symbolIdx] || null : null;
    const tagname = tagIdx >= 0 ? cells[tagIdx] || null : null;

    const r = await db.execute(sql`
      INSERT INTO source_cnf_nutrients (nutrient_id, name, unit, symbol, tagname)
      VALUES (${nutrientId}, ${name}, ${unit}, ${symbol}, ${tagname})
      ON CONFLICT (nutrient_id) DO UPDATE SET
        name = EXCLUDED.name,
        unit = EXCLUDED.unit,
        symbol = EXCLUDED.symbol,
        tagname = EXCLUDED.tagname
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
