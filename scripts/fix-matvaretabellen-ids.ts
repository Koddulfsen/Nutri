/**
 * fix-matvaretabellen-ids.ts
 *
 * Validates all MATVARETABELLEN compound_sources mappings against the actual
 * food constituent IDs in foods-en.json, then fixes any mappings using dead
 * euroFirIds by replacing them with the correct nutrientId from nutrients.json.
 *
 * Run with --fix to apply changes. Without --fix, prints a report only.
 *
 * Usage:
 *   npx tsx scripts/fix-matvaretabellen-ids.ts          # report only
 *   npx tsx scripts/fix-matvaretabellen-ids.ts --fix    # apply fixes
 */

import * as fs from 'fs';
import * as path from 'path';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

const DATA_DIR = path.join(process.cwd(), 'data/matvaretabellen');
const FIX_MODE = process.argv.includes('--fix');

// ── Load ground-truth IDs from food data ──────────────────────────────────────

function loadValidFoodIds(): Set<string> {
  const foods = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'foods-en.json'), 'utf8')
  ).foods as Array<{ constituents?: Array<{ nutrientId: string }> }>;

  const ids = new Set<string>();
  for (const food of foods) {
    for (const c of food.constituents ?? []) {
      if (c.nutrientId) ids.add(c.nutrientId);
    }
  }
  return ids;
}

// ── Load euroFirId → nutrientId map from nutrients.json ───────────────────────

function loadEuroFirMap(): Map<string, string> {
  const nutrients = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'nutrients.json'), 'utf8')
  ).nutrients as Array<{ nutrientId: string; euroFirId?: string }>;

  const map = new Map<string, string>();
  for (const n of nutrients) {
    if (n.euroFirId && n.euroFirId !== n.nutrientId) {
      map.set(n.euroFirId, n.nutrientId);
    }
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const validIds   = loadValidFoodIds();
  const euroFirMap = loadEuroFirMap();

  console.log(`\nGround-truth food constituent IDs: ${validIds.size}`);
  console.log(`euroFirId → nutrientId mappings:   ${euroFirMap.size}`);

  // Fetch all MATVARETABELLEN compound_sources
  const rows = await db.execute(sql`
    SELECT cs.id, cs.external_id, c.name AS compound_name
    FROM compound_sources cs
    JOIN compounds c ON c.id = cs.compound_id
    WHERE cs.external_source = 'MATVARETABELLEN'
    ORDER BY c.name
  `);

  const allRows = ((rows as any).rows ?? rows) as Array<{
    id: string;
    external_id: string;
    compound_name: string;
  }>;

  console.log(`\nTotal MATVARETABELLEN mappings: ${allRows.length}\n`);

  const ok:      typeof allRows = [];
  const fixable: Array<{ row: typeof allRows[0]; replacement: string }> = [];
  const dead:    typeof allRows = [];

  for (const row of allRows) {
    const id = row.external_id;

    if (validIds.has(id)) {
      ok.push(row);
    } else if (euroFirMap.has(id)) {
      const replacement = euroFirMap.get(id)!;
      if (validIds.has(replacement)) {
        fixable.push({ row, replacement });
      } else {
        // euroFirId maps to a nutrientId but that nutrientId also isn't in food data
        dead.push(row);
      }
    } else {
      dead.push(row);
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────────

  console.log(`✅ Valid (${ok.length}):`);
  for (const r of ok) {
    console.log(`   ${r.compound_name.padEnd(35)} ${r.external_id}`);
  }

  console.log(`\n🔧 Fixable — euroFirId → nutrientId (${fixable.length}):`);
  for (const { row, replacement } of fixable) {
    console.log(`   ${row.compound_name.padEnd(35)} ${row.external_id.padEnd(15)} → ${replacement}`);
  }

  console.log(`\n❌ Dead — no fix available (${dead.length}):`);
  for (const r of dead) {
    console.log(`   ${r.compound_name.padEnd(35)} ${r.external_id}`);
  }

  // ── Fix ─────────────────────────────────────────────────────────────────────

  if (!FIX_MODE) {
    console.log('\nRun with --fix to apply the fixes above.');
    return;
  }

  if (fixable.length === 0) {
    console.log('\nNothing to fix.');
    return;
  }

  // Fetch existing external_ids per compound to detect conflicts
  const existing = await db.execute(sql`
    SELECT id, external_id, compound_id
    FROM compound_sources
    WHERE external_source = 'MATVARETABELLEN'
  `);
  const existingRows = ((existing as any).rows ?? existing) as Array<{
    id: string; external_id: string; compound_id: string;
  }>;
  // Build set of (compound_id, external_id) that already exist
  const existingSet = new Set(existingRows.map(r => `${r.compound_id}::${r.external_id}`));

  // Also fetch compound_id for each fixable row
  const idRows = await db.execute(sql`
    SELECT cs.id, cs.compound_id
    FROM compound_sources cs
    WHERE cs.external_source = 'MATVARETABELLEN'
  `);
  const idMap = new Map(
    (((idRows as any).rows ?? idRows) as Array<{ id: string; compound_id: string }>)
      .map(r => [r.id, r.compound_id])
  );

  console.log(`\nApplying ${fixable.length} fixes...`);
  let updated = 0;
  let deleted = 0;

  for (const { row, replacement } of fixable) {
    const compoundId = idMap.get(row.id);
    const conflictKey = `${compoundId}::${replacement}`;

    if (existingSet.has(conflictKey)) {
      // Target nutrientId already exists — just delete the dead euroFirId row
      await db.execute(sql`DELETE FROM compound_source_verifications WHERE compound_source_id = ${row.id}`);
      await db.execute(sql`DELETE FROM compound_sources WHERE id = ${row.id}`);
      deleted++;
      console.log(`   🗑  ${row.compound_name}: deleted ${row.external_id} (${replacement} already exists)`);
    } else {
      await db.execute(sql`
        UPDATE compound_sources SET external_id = ${replacement} WHERE id = ${row.id}
      `);
      updated++;
      console.log(`   ✓  ${row.compound_name}: ${row.external_id} → ${replacement}`);
    }
  }

  console.log(`\nDone. ${updated} updated, ${deleted} deleted (target already existed).`);
}

main().catch(console.error).finally(() => process.exit(0));
