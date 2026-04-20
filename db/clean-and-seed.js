const postgres = require('postgres');
require('dotenv').config();

const client = postgres(process.env.DATABASE_URL);

async function cleanAndSeed() {
  try {
    console.log('🧹 Cleaning database...\n');

    // Truncate all tables in correct order (respecting foreign keys)
    console.log('  → Truncating compound_citations...');
    await client`TRUNCATE TABLE compound_citations CASCADE`;

    console.log('  → Truncating medication_interactions...');
    await client`TRUNCATE TABLE medication_interactions CASCADE`;

    console.log('  → Truncating compound_validation_ranges...');
    await client`TRUNCATE TABLE compound_validation_ranges CASCADE`;

    console.log('  → Truncating compound_sources...');
    await client`TRUNCATE TABLE compound_sources CASCADE`;

    console.log('  → Truncating food_compound_flags...');
    await client`TRUNCATE TABLE food_compound_flags CASCADE`;

    console.log('  → Truncating food_nutrient_values...');
    await client`TRUNCATE TABLE food_nutrient_values CASCADE`;

    console.log('  → Truncating food_compound_value_versions...');
    await client`TRUNCATE TABLE food_compound_value_versions CASCADE`;

    console.log('  → Truncating compounds...');
    await client`TRUNCATE TABLE compounds CASCADE`;

    console.log('\n✅ Database cleaned!\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanAndSeed();
