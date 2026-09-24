import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  // Get compound types with DV coverage
  const result = await sql`
    SELECT
      c.compound_type,
      COUNT(DISTINCT c.id) as total_compounds,
      COUNT(DISTINCT rdv.compound_id) as has_dv
    FROM compounds c
    LEFT JOIN reference_daily_values rdv ON rdv.compound_id = c.id
    GROUP BY c.compound_type
    ORDER BY total_compounds DESC
  `;

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║           COMPOUND TYPES WITH DV COVERAGE              ║');
  console.log('╠═════════════════════════════╦════════════╦═════════════╣');
  console.log('║ Type                        ║   Total    ║   Has DV    ║');
  console.log('╠═════════════════════════════╬════════════╬═════════════╣');

  result.forEach(r => {
    const type = (r.compound_type || 'NULL').padEnd(27);
    const total = String(r.total_compounds).padStart(8);
    const dv = String(r.has_dv).padStart(9);
    console.log(`║ ${type} ║ ${total}   ║ ${dv}   ║`);
  });
  console.log('╚═════════════════════════════╩════════════╩═════════════╝');

  // Get totals
  const totals = await sql`
    SELECT
      COUNT(DISTINCT c.id) as total,
      COUNT(DISTINCT rdv.compound_id) as with_dv
    FROM compounds c
    LEFT JOIN reference_daily_values rdv ON rdv.compound_id = c.id
  `;

  const t = totals[0];
  console.log(`\n📊 TOTALS: ${t.total} compounds | ${t.with_dv} have Daily Values`);

  // List compounds WITH daily values (show one example value per compound)
  const withDV = await sql`
    SELECT DISTINCT ON (c.id)
      c.name,
      c.compound_type,
      rdv.value,
      rdv.unit,
      rdv.value_type,
      rdv.source_region
    FROM compounds c
    JOIN reference_daily_values rdv ON rdv.compound_id = c.id
    ORDER BY c.id, rdv.source_region
  `;

  console.log('\n\n=== COMPOUNDS WITH DAILY VALUES ===\n');

  // Group by type
  const byType = {};
  withDV.forEach(r => {
    if (!byType[r.compound_type]) byType[r.compound_type] = [];
    byType[r.compound_type].push(r);
  });

  Object.keys(byType).sort().forEach(type => {
    console.log(`\n📁 ${type} (${byType[type].length})`);
    byType[type].sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
      console.log(`   • ${r.name}: ${r.value} ${r.unit} (${r.value_type})`);
    });
  });

  // Check compound_validation_ranges for upper limits
  const validationRanges = await sql`
    SELECT
      c.name,
      c.compound_type,
      cvr.max_safe_value,
      cvr.unit
    FROM compound_validation_ranges cvr
    JOIN compounds c ON c.id = cvr.compound_id
    WHERE cvr.max_safe_value IS NOT NULL
    ORDER BY c.compound_type, c.name
  `;

  if (validationRanges.length > 0) {
    console.log('\n\n=== COMPOUNDS WITH UPPER LIMITS (validation_ranges) ===\n');
    validationRanges.forEach(r => {
      console.log(`   • ${r.name} (${r.compound_type}): max ${r.max_safe_value} ${r.unit}`);
    });
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
