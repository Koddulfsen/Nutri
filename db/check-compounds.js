const postgres = require('postgres');
require('dotenv').config();

const client = postgres(process.env.DATABASE_URL);

async function check() {
  try {
    const result = await client`
      SELECT compound_type, COUNT(*) as count
      FROM compounds
      GROUP BY compound_type
      ORDER BY compound_type
    `;

    console.log('\n📊 Compound Count by Category:\n');
    let total = 0;
    result.forEach(row => {
      console.log(`  ${row.compound_type.padEnd(20)} ${row.count}`);
      total += parseInt(row.count);
    });
    console.log(`\n  ${'TOTAL'.padEnd(20)} ${total}`);
    console.log();
  } finally {
    await client.end();
  }
}

check();
