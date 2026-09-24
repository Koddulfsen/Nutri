import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

// Map Phenol-Explorer classes to our compound_type enum
const classToType: Record<string, string> = {
  'Flavonoids': 'POLYPHENOL',
  'Lignans': 'POLYPHENOL',  // We could add LIGNAN type later
  'Phenolic acids': 'POLYPHENOL',
  'Stilbenes': 'POLYPHENOL',
  'Other polyphenols': 'POLYPHENOL',
  'Non-phenolic metabolites': 'OTHER',
};

async function main() {
  console.log('=== Phenol-Explorer Compound Import ===\n');

  // Parse CSV
  const csv = fs.readFileSync('data/phenol-explorer/compounds-classification.csv', 'utf-8');
  const lines = csv.split('\n').slice(1).filter(l => l.trim());

  interface PECompound {
    id: string;
    name: string;
    class: string;
    subclass: string;
  }

  const peCompounds: PECompound[] = [];

  for (const line of lines) {
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

  console.log(`Parsed ${peCompounds.length} Phenol-Explorer compounds\n`);

  // Get existing compounds
  const existing = await db.execute(sql`SELECT id, name FROM compounds`);
  const existingMap = new Map<string, string>();
  for (const c of existing as any[]) {
    existingMap.set(c.name.toLowerCase(), c.id);
  }

  // Check existing PE mappings
  const existingMappings = await db.execute(sql`
    SELECT external_id FROM compound_sources WHERE external_source = 'PHENOL_EXPLORER'
  `);
  const mappedIds = new Set((existingMappings as any[]).map(m => m.external_id));

  // Categorize compounds
  const matched: { pe: PECompound; nutriId: string }[] = [];
  const toAdd: PECompound[] = [];

  for (const pe of peCompounds) {
    const normalized = pe.name.toLowerCase();
    if (existingMap.has(normalized)) {
      matched.push({ pe, nutriId: existingMap.get(normalized)! });
    } else {
      toAdd.push(pe);
    }
  }

  console.log(`Already in Nutri: ${matched.length}`);
  console.log(`New to add: ${toAdd.length}\n`);

  // Add new compounds
  console.log('Adding new compounds...');
  let addedCount = 0;

  for (const pe of toAdd) {
    const type = classToType[pe.class] || 'OTHER';

    try {
      const result = await db.execute(sql`
        INSERT INTO compounds (name, compound_type, unit, description)
        VALUES (${pe.name}, ${type}, 'mg', ${`${pe.subclass} - from Phenol-Explorer`})
        RETURNING id
      `);

      const newId = (result as any)[0].id;

      // Create mapping
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${newId}, 'PHENOL_EXPLORER', ${pe.id}, ${pe.name}, true)
      `);

      addedCount++;
      if (addedCount % 50 === 0) {
        console.log(`  Added ${addedCount}/${toAdd.length}...`);
      }
    } catch (err: any) {
      console.log(`❌ Failed to add ${pe.name}: ${err.message}`);
    }
  }

  console.log(`✅ Added ${addedCount} new compounds\n`);

  // Create mappings for existing compounds
  console.log('Mapping existing compounds...');
  let mappingCount = 0;

  for (const { pe, nutriId } of matched) {
    if (mappedIds.has(pe.id)) continue;

    try {
      await db.execute(sql`
        INSERT INTO compound_sources (compound_id, external_source, external_id, source_name, is_canonical)
        VALUES (${nutriId}, 'PHENOL_EXPLORER', ${pe.id}, ${pe.name}, true)
      `);
      mappingCount++;
    } catch (err: any) {
      console.log(`❌ Failed to map ${pe.name}: ${err.message}`);
    }
  }

  console.log(`✅ Created ${mappingCount} mappings for existing compounds\n`);

  // Final summary
  const finalCounts = await db.execute(sql`
    SELECT external_source, COUNT(*) as count
    FROM compound_sources
    GROUP BY external_source
    ORDER BY external_source
  `);

  const totalCompounds = await db.execute(sql`SELECT COUNT(*) as count FROM compounds`);

  console.log('=== Summary ===');
  console.log(`New compounds added: ${addedCount}`);
  console.log(`Existing compounds mapped: ${mappingCount}`);
  console.log(`Total Phenol-Explorer mappings: ${addedCount + mappingCount}`);
  console.log(`\nTotal compounds: ${(totalCompounds as any)[0]?.count}`);
  console.log('\nMappings by source:');
  (finalCounts as any).forEach((r: any) => {
    console.log(`  ${r.external_source}: ${r.count}`);
  });
}

main().then(() => process.exit(0)).catch(console.error);
