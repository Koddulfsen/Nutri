import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function main() {
  const csv = fs.readFileSync('data/phenol-explorer/compounds-classification.csv', 'utf-8');
  const lines = csv.split('\n').slice(1).filter(l => l.trim());

  // Get Phenol-Explorer names
  const peCompounds: { name: string; id: string; class: string; subclass: string }[] = [];

  for (const line of lines) {
    // Parse CSV carefully - compound names can have commas
    const match = line.match(/^([^,]+),([^,]+),(.+),(\d+)$/);
    if (match) {
      peCompounds.push({
        class: match[1],
        subclass: match[2],
        name: match[3].replace(/"/g, '').trim(),
        id: match[4]
      });
    }
  }

  // Get Nutri compound names
  const compounds = await db.execute(sql`SELECT name FROM compounds`);
  const nutriNames = new Map<string, string>();
  for (const c of compounds as any[]) {
    nutriNames.set(c.name.toLowerCase(), c.name);
  }

  // Find matches
  const matched: typeof peCompounds = [];
  const unmatched: typeof peCompounds = [];

  for (const pe of peCompounds) {
    const normalized = pe.name.toLowerCase();
    if (nutriNames.has(normalized)) {
      matched.push(pe);
    } else {
      unmatched.push(pe);
    }
  }

  console.log(`=== Phenol-Explorer Analysis ===\n`);
  console.log(`Phenol-Explorer: ${peCompounds.length} compounds`);
  console.log(`Nutri DB: ${nutriNames.size} compounds`);
  console.log(`Direct matches: ${matched.length}`);
  console.log(`New to add: ${unmatched.length}`);

  // Group unmatched by class
  const byClass: Record<string, number> = {};
  for (const u of unmatched) {
    byClass[u.class] = (byClass[u.class] || 0) + 1;
  }

  console.log(`\nNew compounds by class:`);
  for (const [cls, count] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cls}: ${count}`);
  }

  console.log(`\nSample matched (${matched.length}):`);
  matched.slice(0, 15).forEach(m => console.log(`  ✓ ${m.name}`));

  console.log(`\nSample new compounds:`);
  unmatched.slice(0, 20).forEach(u => console.log(`  + ${u.name} (${u.subclass})`));
}

main().then(() => process.exit(0)).catch(console.error);
