import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Load activities data
  const content = fs.readFileSync('data/duke/AGGREGAC.csv', 'utf-8');
  const activities = parse(content, { columns: true, skip_empty_lines: true });

  // Count activities per chemical
  const chemActivities = new Map<string, Set<string>>();
  const activityCounts = new Map<string, number>();

  for (const row of activities) {
    const chem = row.CHEM?.trim();
    const activity = row.ACTIVITY?.trim();
    if (!chem || !activity) continue;

    if (!chemActivities.has(chem)) {
      chemActivities.set(chem, new Set());
    }
    chemActivities.get(chem)!.add(activity);

    activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);
  }

  console.log('Total chemicals with activities: ' + chemActivities.size);
  console.log('Total unique activities: ' + activityCounts.size + '\n');

  // Get our existing compounds
  const ourCompounds = await sql`
    SELECT LOWER(name) as name FROM compounds
    UNION
    SELECT LOWER(unnest(alternate_names)) FROM compounds WHERE alternate_names IS NOT NULL
  `;
  const ourNames = new Set(ourCompounds.map(r => r.name));
  console.log('Our compound names: ' + ourNames.size + '\n');

  // Categorize Duke chemicals
  const inNutri: string[] = [];
  const notInNutri: string[] = [];

  for (const [chem, acts] of chemActivities) {
    const normalized = chem.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ');
    const normalizedDash = chem.toLowerCase();

    if (ourNames.has(normalized) || ourNames.has(normalizedDash) || ourNames.has(chem.toLowerCase())) {
      inNutri.push(chem);
    } else {
      notInNutri.push(chem);
    }
  }

  console.log('Duke chemicals with activities ALREADY in Nutri: ' + inNutri.length);
  console.log('Duke chemicals with activities NOT in Nutri: ' + notInNutri.length + '\n');

  // Health-relevant activities
  const healthActivities = new Set([
    'Antitumor', 'Antibacterial', 'Antioxidant', 'Antiinflammatory', 'Antiviral',
    'Cancer-Preventive', 'Hepatoprotective', 'Immunostimulant', 'AntiHIV', 'Antidiabetic',
    'Hypoglycemic', 'Hypotensive', 'Cardioprotective', 'Neuroprotective', 'Antiaging',
    'Antidepressant', 'Anxiolytic', 'Analgesic', 'Antiarthritic', 'Antiatherosclerotic',
    'Antidementia', 'Antiobesity', 'Antiosteoporotic', 'Antiparkinson', 'Antialzheimeran',
    'Antiulcer', 'Antiasthmatic', 'Antiallergic', 'Antimigraine', 'Antifatigue'
  ]);

  // Score chemicals by health relevance
  const chemScores: Array<{chem: string, healthActs: string[], allActs: number, plants: number}> = [];

  for (const chem of notInNutri) {
    const acts = chemActivities.get(chem)!;
    const healthActs = [...acts].filter(a => healthActivities.has(a));
    if (healthActs.length > 0) {
      chemScores.push({
        chem,
        healthActs,
        allActs: acts.size,
        plants: 0
      });
    }
  }

  // Get plant counts for top candidates
  const topCandidates = chemScores
    .sort((a, b) => b.healthActs.length - a.healthActs.length)
    .slice(0, 100);

  const chemIds = topCandidates.map(c => c.chem);
  const plantCounts = await sql`
    SELECT chem_id, COUNT(DISTINCT fnf_num) as plant_count
    FROM source_duke_farmacy
    WHERE chem_id = ANY(${chemIds})
    GROUP BY chem_id
  `;

  const plantMap = new Map(plantCounts.map(r => [r.chem_id, Number(r.plant_count)]));
  for (const c of topCandidates) {
    c.plants = plantMap.get(c.chem) || 0;
  }

  // Sort by health acts then plants
  topCandidates.sort((a, b) => {
    if (b.healthActs.length !== a.healthActs.length) return b.healthActs.length - a.healthActs.length;
    return b.plants - a.plants;
  });

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('TOP DUKE COMPOUNDS NOT IN NUTRI (by health activities)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const c of topCandidates.slice(0, 50)) {
    console.log(c.chem);
    console.log('  Health activities (' + c.healthActs.length + '): ' + c.healthActs.join(', '));
    console.log('  Total activities: ' + c.allActs + ', Found in ' + c.plants + ' plants\n');
  }

  // Also show what's already in Nutri with most activities
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('DUKE COMPOUNDS ALREADY IN NUTRI (sample with health activities)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const inNutriScores = inNutri.map(chem => {
    const acts = chemActivities.get(chem)!;
    const healthActs = [...acts].filter(a => healthActivities.has(a));
    return { chem, healthActs, allActs: acts.size };
  }).filter(c => c.healthActs.length > 0)
    .sort((a, b) => b.healthActs.length - a.healthActs.length)
    .slice(0, 20);

  for (const c of inNutriScores) {
    console.log(c.chem + ' (' + c.healthActs.length + ' health activities)');
  }

  await sql.end();
}

main().catch(console.error);
