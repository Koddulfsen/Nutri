/**
 * Generate SQL INSERT statements for manual execution in Supabase SQL Editor
 * This bypasses the IPv6 network connectivity issues
 */

import 'dotenv/config';
import { seedCompounds } from './compounds-sql';
import { seedCategories } from './categories-sql';
import { seedUsers } from './users-sql';
import { seedResearchCitations } from './research-sql';
import { seedInteractions } from './interactions-sql';
import { seedValidationRanges } from './validation-sql';
import * as fs from 'fs';

async function generateSeedSQL() {
  console.log('\n📝 Generating seed SQL statements...\n');
  console.log('═'.repeat(60));

  let allSQL = '-- Nutri Database Seed Data\n';
  allSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';
  allSQL += '-- Execute this file in Supabase SQL Editor to populate seed data\n\n';

  try {
    console.log('\n1️⃣  Generating Compounds SQL...');
    const compoundsSQL = await seedCompounds();
    allSQL += '\n-- ═══════════════════════════════════════════════════════════════\n';
    allSQL += '-- COMPOUNDS (280 entries)\n';
    allSQL += '-- ═══════════════════════════════════════════════════════════════\n\n';
    allSQL += compoundsSQL + '\n\n';

    console.log('\n2️⃣  Generating Food Categories SQL...');
    const categoriesSQL = await seedCategories();
    allSQL += '\n-- ═══════════════════════════════════════════════════════════════\n';
    allSQL += '-- FOOD CATEGORIES (~100 entries)\n';
    allSQL += '-- ═══════════════════════════════════════════════════════════════\n\n';
    allSQL += categoriesSQL + '\n\n';

    console.log('\n3️⃣  Generating Users SQL...');
    const usersSQL = await seedUsers();
    allSQL += '\n-- ═══════════════════════════════════════════════════════════════\n';
    allSQL += '-- USERS (22 test users)\n';
    allSQL += '-- ═══════════════════════════════════════════════════════════════\n\n';
    allSQL += usersSQL + '\n\n';

    console.log('\n4️⃣  Generating Research Citations SQL...');
    const researchSQL = await seedResearchCitations();
    allSQL += '\n-- ═══════════════════════════════════════════════════════════════\n';
    allSQL += '-- RESEARCH CITATIONS (41 entries)\n';
    allSQL += '-- ═══════════════════════════════════════════════════════════════\n\n';
    allSQL += researchSQL + '\n\n';

    console.log('\n5️⃣  Generating Medication Interactions SQL...');
    const interactionsSQL = await seedInteractions();
    allSQL += '\n-- ═══════════════════════════════════════════════════════════════\n';
    allSQL += '-- MEDICATION INTERACTIONS (18 entries)\n';
    allSQL += '-- ═══════════════════════════════════════════════════════════════\n\n';
    allSQL += interactionsSQL + '\n\n';

    console.log('\n6️⃣  Generating Validation Ranges SQL...');
    const validationSQL = await seedValidationRanges();
    allSQL += '\n-- ═══════════════════════════════════════════════════════════════\n';
    allSQL += '-- VALIDATION RANGES (280 entries)\n';
    allSQL += '-- ═══════════════════════════════════════════════════════════════\n\n';
    allSQL += validationSQL + '\n\n';

    // Write to file
    const outputPath = '/home/kodd/VibeWiz/Projects/Nutri/db/seed/seed-data.sql';
    fs.writeFileSync(outputPath, allSQL);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ SQL GENERATION COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`\n📄 Output file: ${outputPath}`);
    console.log(`\n📊 Contents:`);
    console.log('   • 280 compounds');
    console.log('   • ~100 food categories');
    console.log('   • 22 test users');
    console.log('   • 41 research citations');
    console.log('   • 18 medication interactions');
    console.log('   • 280 validation ranges');
    console.log(`\n📋 Next Steps:`);
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Create new query');
    console.log('   3. Copy contents of seed-data.sql');
    console.log('   4. Execute the query');
    console.log('\n✨ Your Nutri database will be fully populated!\n');

  } catch (error) {
    console.error('\n❌ SQL GENERATION FAILED:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  generateSeedSQL()
    .then(() => {
      console.log('👋 Exiting SQL generation script...\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default generateSeedSQL;
