/**
 * Main Seed Script - Nutri Database
 *
 * Orchestrates all seed data population in correct dependency order:
 * 1. Compounds (foundation - no dependencies)
 * 2. Food Categories (independent)
 * 3. Users (independent)
 * 4. Research Citations (needs compounds for junction table)
 * 5. Medication Interactions (needs compounds)
 * 6. Validation Ranges (needs compounds)
 */

import 'dotenv/config';
import { seedCompounds } from './compounds';
import { seedCategories } from './categories';
import { seedUsers } from './users';
import seedResearchCitations from './research';
import { seedInteractions } from './interactions';
import { seedValidationRanges } from './validation';

async function seedDatabase() {
  console.log('\n🌱 Starting Nutri Database Seeding...\n');
  console.log('═'.repeat(60));

  const startTime = Date.now();

  try {
    // Wave 1: Foundation data (can run in parallel, but we'll do sequential for clarity)
    console.log('\n📦 WAVE 1: Foundation Data');
    console.log('─'.repeat(60));

    console.log('\n1️⃣  Seeding Compounds...');
    const compoundMap = await seedCompounds();
    console.log(`✅ Compounds seeded: ${compoundMap.size} compounds`);

    console.log('\n2️⃣  Seeding Food Categories...');
    await seedCategories();
    console.log('✅ Food categories seeded');

    console.log('\n3️⃣  Seeding Users...');
    await seedUsers();
    console.log('✅ Test users seeded');

    // Wave 2: Dependent data (needs compounds)
    console.log('\n📦 WAVE 2: Dependent Data');
    console.log('─'.repeat(60));

    console.log('\n4️⃣  Seeding Research Citations...');
    await seedResearchCitations();
    console.log('✅ Research citations seeded');

    console.log('\n5️⃣  Seeding Medication Interactions...');
    await seedInteractions();
    console.log('✅ Medication interactions seeded');

    console.log('\n6️⃣  Seeding Validation Ranges...');
    await seedValidationRanges();
    console.log('✅ Validation ranges seeded');

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`⏱️  Total time: ${duration}s`);
    console.log('\n📊 Summary:');
    console.log('   • 280 compounds');
    console.log('   • ~100 food categories (5-level hierarchy)');
    console.log('   • 22 test users with profiles, consent, API keys');
    console.log('   • 41 research citations with compound links');
    console.log('   • 18 medication-nutrient interactions');
    console.log('   • 280 compound validation ranges');
    console.log('\n✨ Your Nutri database is now populated and ready!\n');

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('👋 Exiting seed script...\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default seedDatabase;
