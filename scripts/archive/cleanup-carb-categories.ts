/**
 * One-shot cleanup of the Carbohydrates category in compound_groups + compounds.
 *
 * Changes:
 *   1. Resistant Starch — remove from "Starches" group, keep in "Fiber"
 *   2. Sugar Alcohols → renamed to "Polyols"
 *   3. Maltitol, Lactitol — demoted from core tier (no whole-food signal)
 *      and removed from the Polyols group's compound_names list
 *
 * Dry-run by default; pass --apply to write.
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const APPLY = process.argv.includes('--apply');

// PG array literals come back as strings like `{a,b,"c d"}` — parse to string[]
function parsePgArray(v: any): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string') return [];
  if (!v.startsWith('{') || !v.endsWith('}')) return [];
  const inner = v.slice(1, -1);
  if (inner === '') return [];
  // Handle quoted elements with commas/spaces
  const out: string[] = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === '"') {
      const end = inner.indexOf('"', i + 1);
      out.push(inner.slice(i + 1, end));
      i = end + 2; // skip closing " and comma
    } else {
      const end = inner.indexOf(',', i);
      const stop = end === -1 ? inner.length : end;
      out.push(inner.slice(i, stop));
      i = stop + 1;
    }
  }
  return out;
}

async function main() {
  console.log(APPLY ? 'APPLY MODE — writing changes' : 'DRY RUN');

  // 1. Find the relevant groups
  const groups = await db.execute(sql`
    SELECT id, name, slug, compound_names FROM compound_groups
    WHERE slug IN ('starches', 'sugar-alcohols', 'fiber')
       OR name ILIKE 'starches' OR name ILIKE 'sugar alcohols' OR name ILIKE 'fiber'
  `);
  const groupRows = ((groups as any).rows ?? groups) as any[];
  console.log('\nFound groups:');
  for (const g of groupRows) {
    console.log(`  ${g.name} (slug=${g.slug})  compound_names=${JSON.stringify(g.compound_names)}`);
  }

  const starches = groupRows.find(g => g.slug === 'starches' || g.name.toLowerCase() === 'starches');
  const sugarAlcohols = groupRows.find(g => g.slug === 'sugar-alcohols' || g.name.toLowerCase() === 'sugar alcohols');

  // 1. Remove Resistant Starch from Starches group
  if (starches) {
    const before: string[] = parsePgArray(starches.compound_names);
    const after = before.filter(n => n.toLowerCase() !== 'resistant starch');
    if (before.length !== after.length) {
      console.log(`\n[Starches] Removing "Resistant Starch" from compound_names`);
      console.log(`  before: ${JSON.stringify(before)}`);
      console.log(`  after:  ${JSON.stringify(after)}`);
      if (APPLY) {
        const arrLiteral = `{${after.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`;
        await db.execute(sql`UPDATE compound_groups SET compound_names = ${arrLiteral}::text[] WHERE id = ${starches.id}`);
      }
    }
  }

  // 2 + 3. Rename Sugar Alcohols → Polyols, drop Maltitol + Lactitol from its compound_names
  if (sugarAlcohols) {
    const before: string[] = parsePgArray(sugarAlcohols.compound_names);
    const after = before.filter(n => !['maltitol', 'lactitol'].includes(n.toLowerCase()));
    console.log(`\n[Sugar Alcohols → Polyols]`);
    console.log(`  rename: name "Sugar Alcohols" → "Polyols", slug "sugar-alcohols" → "polyols"`);
    console.log(`  compound_names before: ${JSON.stringify(before)}`);
    console.log(`  compound_names after:  ${JSON.stringify(after)}`);
    if (APPLY) {
      const arrLiteral = `{${after.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`;
      await db.execute(sql`
        UPDATE compound_groups
        SET name = 'Polyols', slug = 'polyols', compound_names = ${arrLiteral}::text[]
        WHERE id = ${sugarAlcohols.id}
      `);
    }
  }

  // 4. Demote Maltitol and Lactitol from core tier (so they don't show in default UI)
  console.log(`\n[Compounds tier]`);
  for (const name of ['Maltitol', 'Lactitol']) {
    const r = await db.execute(sql`SELECT id, name, tier FROM compounds WHERE name = ${name}`);
    const row = ((r as any).rows ?? r)[0];
    if (!row) { console.log(`  ${name}: not in compounds table`); continue; }
    console.log(`  ${name}: currently tier="${row.tier}" → "advanced"`);
    if (APPLY) {
      await db.execute(sql`UPDATE compounds SET tier = 'advanced' WHERE id = ${row.id}`);
    }
  }

  if (!APPLY) console.log('\nDry run complete. Re-run with --apply.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
