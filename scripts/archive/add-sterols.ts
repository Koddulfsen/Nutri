/**
 * Add 4 new sterol compounds to core, with source mappings.
 *
 *   Beta-Sitosterol     UK_COFID(BSITPHYTO, mg, cf=1.0)
 *   Campesterol         UK_COFID(CAMPHYTO, mg, cf=1.0)
 *   Stigmasterol        UK_COFID(STIGPHYTO, mg, cf=1.0)
 *   Total Phytosterols  UK_COFID(Total PHYTO, mg, cf=1.0) + FOODFILES(PHYSTR, mg, cf=1.0)
 *
 * Marks each new mapping as 'verified' in compound_source_verifications and
 * adds the new compounds to the Sterols compound_group.
 *
 * Idempotent: safe to re-run. Skips if compound already exists.
 *
 * Dry-run by default; pass --apply to write.
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const APPLY = process.argv.includes('--apply');

interface NewSterol {
  name: string;
  unit: string;
  mappings: Array<{ source: string; externalId: string; sourceUnit: string; cf: string; sourceName: string }>;
}

const STEROLS: NewSterol[] = [
  {
    name: 'Beta-Sitosterol', unit: 'mg',
    mappings: [
      { source: 'UK_COFID', externalId: 'BSITPHYTO', sourceUnit: 'mg', cf: '1.0', sourceName: 'Beta-sitosterol' },
    ],
  },
  {
    name: 'Campesterol', unit: 'mg',
    mappings: [
      { source: 'UK_COFID', externalId: 'CAMPHYTO', sourceUnit: 'mg', cf: '1.0', sourceName: 'Campesterol' },
    ],
  },
  {
    name: 'Stigmasterol', unit: 'mg',
    mappings: [
      { source: 'UK_COFID', externalId: 'STIGPHYTO', sourceUnit: 'mg', cf: '1.0', sourceName: 'Stigmasterol' },
    ],
  },
  {
    // "Total Plant Sterols" already exists at advanced tier with FOODFILES mapping.
    // We promote it to core and add the UK_COFID mapping.
    name: 'Total Plant Sterols', unit: 'mg',
    mappings: [
      { source: 'UK_COFID', externalId: 'Total PHYTO', sourceUnit: 'mg', cf: '1.0', sourceName: 'Total Phytosterols' },
    ],
  },
];

function parsePgArray(v: any): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string' || !v.startsWith('{') || !v.endsWith('}')) return [];
  const inner = v.slice(1, -1);
  if (inner === '') return [];
  const out: string[] = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === '"') {
      const end = inner.indexOf('"', i + 1);
      out.push(inner.slice(i + 1, end));
      i = end + 2;
    } else {
      const end = inner.indexOf(',', i);
      const stop = end === -1 ? inner.length : end;
      out.push(inner.slice(i, stop));
      i = stop + 1;
    }
  }
  return out;
}
const toPgArray = (a: string[]) => `{${a.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`;

async function main() {
  console.log(APPLY ? 'APPLY MODE' : 'DRY RUN');

  for (const sterol of STEROLS) {
    console.log(`\n=== ${sterol.name} ===`);

    // 1. Check / create compound
    const existing = await db.execute(sql`SELECT id, tier FROM compounds WHERE name = ${sterol.name}`);
    let compoundId: string;
    const existingRow = ((existing as any).rows ?? existing)[0] as any;
    if (existingRow) {
      compoundId = existingRow.id;
      console.log(`  Compound already exists (id=${compoundId}, tier=${existingRow.tier})`);
      if (existingRow.tier !== 'core') {
        console.log(`  Will PROMOTE tier "${existingRow.tier}" → "core"`);
        if (APPLY) {
          await db.execute(sql`UPDATE compounds SET tier = 'core' WHERE id = ${compoundId}`);
        }
      }
    } else {
      console.log(`  Will INSERT compound: name="${sterol.name}", type=MACRONUTRIENT, unit=${sterol.unit}, tier=core`);
      if (APPLY) {
        const inserted = await db.execute(sql`
          INSERT INTO compounds (name, compound_type, unit, tier)
          VALUES (${sterol.name}, 'MACRONUTRIENT', ${sterol.unit}, 'core')
          RETURNING id
        `);
        compoundId = ((inserted as any).rows ?? inserted)[0].id;
        console.log(`    inserted id=${compoundId}`);
      } else {
        compoundId = '<new>';
      }
    }

    // 2. Mappings
    for (const m of sterol.mappings) {
      const existingMap = await db.execute(sql`
        SELECT id FROM compound_sources WHERE external_source = ${m.source} AND external_id = ${m.externalId}
      `);
      const existingMapRow = ((existingMap as any).rows ?? existingMap)[0];
      if (existingMapRow) {
        console.log(`  Mapping ${m.source}/${m.externalId} already exists (cs_id=${existingMapRow.id}) — skip`);
        continue;
      }
      console.log(`  Will INSERT mapping: ${m.source} ${m.externalId} unit=${m.sourceUnit} cf=${m.cf}`);
      if (APPLY && compoundId !== '<new>') {
        const csInserted = await db.execute(sql`
          INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, source_unit, conversion_factor, is_canonical)
          VALUES (${compoundId}, ${m.source}, ${m.externalId}, ${m.sourceName}, ${m.sourceUnit}, ${m.cf}, false)
          RETURNING id
        `);
        const csId = ((csInserted as any).rows ?? csInserted)[0].id;
        await db.execute(sql`
          INSERT INTO compound_source_verifications (compound_source_id, status, notes, verified_at)
          VALUES (${csId}, 'verified', ${'Initial mapping (added via add-sterols.ts script)'}, NOW())
        `);
        console.log(`    inserted cs_id=${csId} and verified`);
      }
    }
  }

  // 3. Update Sterols group's compound_names
  console.log('\n=== Sterols compound_group ===');
  const g = await db.execute(sql`SELECT id, compound_names FROM compound_groups WHERE slug = 'sterols'`);
  const groupRow = ((g as any).rows ?? g)[0];
  if (groupRow) {
    const before = parsePgArray(groupRow.compound_names);
    const newNames = STEROLS.map(s => s.name); // 'Total Plant Sterols' included
    const after = [...new Set([...before, ...newNames])];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      console.log(`  before: ${JSON.stringify(before)}`);
      console.log(`  after:  ${JSON.stringify(after)}`);
      if (APPLY) {
        await db.execute(sql`UPDATE compound_groups SET compound_names = ${toPgArray(after)}::text[] WHERE id = ${groupRow.id}`);
      }
    } else {
      console.log('  no change needed');
    }
  } else {
    console.log('  Sterols group not found — manual setup needed');
  }

  if (!APPLY) console.log('\nDry run. Re-run with --apply.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
