import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  // Load FooDB Nutrient.csv (the actual nutrient definitions)
  const nutrientCsv = readFileSync('/home/kodd/Nutri/data/foodb/foodb_2020_04_07_csv/Nutrient.csv', 'utf-8');
  const lines = nutrientCsv.split('\n').slice(1);

  const foodbNutrients = new Map<string, string>();
  for (const line of lines) {
    if (!line.trim()) continue;
    // id is column 0, name is column 4
    const match = line.match(/^(\d+),/);
    if (match) {
      const id = match[1];
      // Get name (column 4) - need proper CSV parsing
      const parts = line.split(',');
      // name might be in quotes
      let name = parts[4]?.replace(/^"|"$/g, '') || 'unknown';
      foodbNutrients.set(id, name);
    }
  }

  console.log(`Loaded ${foodbNutrients.size} nutrients from FooDB Nutrient.csv`);

  // Get our FooDB mappings
  const ourMappings = await sql`
    SELECT c.name as compound, cs.external_id, cs.source_name
    FROM compound_sources cs
    JOIN compounds c ON cs.compound_id = c.id
    WHERE cs.external_source = 'FooDB'
    ORDER BY LENGTH(cs.external_id), cs.external_id
  `;

  // Find which of our mappings are for Nutrient.csv (IDs 1-~150) vs Compound.csv (larger IDs)
  const nutrientMappings: typeof ourMappings = [];
  const compoundMappings: typeof ourMappings = [];

  for (const m of ourMappings) {
    const id = parseInt(m.external_id);
    if (id <= 150) {
      nutrientMappings.push(m);
    } else {
      compoundMappings.push(m);
    }
  }

  console.log(`\nOur FooDB mappings breakdown:`);
  console.log(`  Nutrient-range IDs (1-150): ${nutrientMappings.length}`);
  console.log(`  Compound-range IDs (>150): ${compoundMappings.length}`);

  // Check which nutrients we map
  console.log(`\n${'═'.repeat(60)}`);
  console.log('OUR NUTRIENT MAPPINGS vs FooDB Nutrient.csv');
  console.log('═'.repeat(60));

  const mappedNutrientIds = new Set<string>();
  for (const m of nutrientMappings) {
    const foodbName = foodbNutrients.get(m.external_id) || '?';
    mappedNutrientIds.add(m.external_id);

    const matches = foodbName.toLowerCase().includes(m.compound.toLowerCase().slice(0, 4)) ||
                    m.compound.toLowerCase().includes(foodbName.toLowerCase().slice(0, 4));
    const status = matches ? '✓' : '⚠';

    console.log(`ID ${m.external_id.padStart(3)}: ${status} Our "${m.compound}" = FooDB "${foodbName}"`);
  }

  // Show unmapped nutrients (first 50)
  console.log(`\n${'═'.repeat(60)}`);
  console.log('UNMAPPED NUTRIENTS IN FooDB Nutrient.csv (first 50)');
  console.log('═'.repeat(60));

  let unmappedCount = 0;
  for (const [id, name] of foodbNutrients) {
    if (parseInt(id) > 150) continue; // Skip compound-range
    if (!mappedNutrientIds.has(id)) {
      if (unmappedCount < 50) {
        console.log(`ID ${id.padStart(3)}: ${name}`);
      }
      unmappedCount++;
    }
  }

  console.log(`\nTotal unmapped nutrients: ${unmappedCount}`);

  await sql.end();
}

main().catch(console.error);
