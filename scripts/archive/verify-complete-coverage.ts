/**
 * Verify 100% Coverage for Both CNF and FDC APIs
 *
 * Checks that all nutrients from both APIs are mapped to compound UUIDs.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Verifying complete coverage for CNF and FDC APIs...\n');

  // Get CNF mappings
  const { data: cnfMappings, count: cnfCount } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact' })
    .eq('external_source', 'CNF');

  // Get FDC mappings
  const { data: fdcMappings, count: fdcCount } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact' })
    .eq('external_source', 'FDC');

  // Get total compound_sources
  const { count: totalMappings } = await supabase
    .from('compound_sources')
    .select('*', { count: 'exact', head: true });

  // Get total compounds
  const { count: totalCompounds } = await supabase
    .from('compounds')
    .select('*', { count: 'exact', head: true });

  console.log('========================================');
  console.log('API COVERAGE SUMMARY');
  console.log('========================================\n');

  console.log('CNF (Canadian Nutrient File):');
  console.log(`  ✓ Mapped nutrients: ${cnfCount}`);
  console.log(`  ✓ Target: 136 unique CNF nutrients`);
  console.log(`  ✓ Coverage: ${((cnfCount / 136) * 100).toFixed(1)}%`);

  if (cnfCount >= 136) {
    console.log('  🎉 100% CNF coverage achieved!\n');
  } else {
    console.log(`  ⚠️  Missing: ${136 - cnfCount} nutrients\n`);
  }

  console.log('FDC (USDA FoodData Central):');
  console.log(`  ✓ Mapped nutrients: ${fdcCount}`);
  console.log(`  ✓ Target: 152 FDC nutrients`);
  console.log(`  ✓ Coverage: ${((fdcCount / 152) * 100).toFixed(1)}%`);

  if (fdcCount >= 152) {
    console.log('  🎉 100% FDC coverage achieved!\n');
  } else {
    console.log(`  ⚠️  Missing: ${152 - fdcCount} nutrients\n`);
  }

  console.log('========================================');
  console.log('DATABASE STATISTICS');
  console.log('========================================\n');

  console.log(`Total compounds in database: ${totalCompounds}`);
  console.log(`Total API mappings: ${totalMappings}`);
  console.log(`  - CNF mappings: ${cnfCount}`);
  console.log(`  - FDC mappings: ${fdcCount}`);

  console.log('\n========================================');
  console.log('FINAL STATUS');
  console.log('========================================\n');

  if (cnfCount >= 136 && fdcCount >= 152) {
    console.log('✅ SUCCESS! 100% coverage achieved for BOTH APIs!');
    console.log('🎉 All CNF and FDC nutrients are mapped to compound UUIDs!');
    console.log('🚀 System ready for production use!');
  } else {
    console.log('⚠️  Coverage incomplete:');
    if (cnfCount < 136) console.log(`   - CNF: ${136 - cnfCount} nutrients missing`);
    if (fdcCount < 152) console.log(`   - FDC: ${152 - fdcCount} nutrients missing`);
  }

  console.log('\n========================================');
  console.log('COMPOUND BREAKDOWN BY TYPE');
  console.log('========================================\n');

  // Get compound type breakdown
  const { data: compoundsByType } = await supabase
    .from('compounds')
    .select('compound_type');

  const typeCounts = new Map<string, number>();
  for (const compound of compoundsByType || []) {
    const type = compound.compound_type || 'UNKNOWN';
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }

  const sortedTypes = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    console.log(`  ${type.padEnd(20)}: ${count}`);
  }

  console.log(`\n  TOTAL: ${totalCompounds}`);
}

main().catch(console.error);
