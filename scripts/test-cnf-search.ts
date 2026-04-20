/**
 * Test CNF Search Quality
 *
 * Compares search results between USDA and CNF for common queries
 * Run with: npx tsx scripts/test-cnf-search.ts
 */

import { cnfClient } from '../lib/services/cnf-client';
import { usdaClient } from '../lib/services/usda-client';

const TEST_QUERIES = ['chicken', 'beef', 'salmon', 'broccoli', 'apple'];

async function testSearch(query: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`QUERY: "${query}"`);
  console.log('='.repeat(80));

  // Test CNF
  console.log('\n📊 CNF RESULTS (Canadian Nutrient File):');
  console.log('-'.repeat(80));
  try {
    const cnfResults = await cnfClient.searchFoods(query, 10);
    console.log(`Total: ${cnfResults.length} results\n`);
    cnfResults.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.name} (score: ${result.relevanceScore})`);
    });
  } catch (error) {
    console.error('CNF Error:', error instanceof Error ? error.message : String(error));
  }

  // Test USDA
  console.log('\n📊 USDA RESULTS (FoodData Central):');
  console.log('-'.repeat(80));
  try {
    const usdaResponse = await usdaClient.searchFoods(query, 10);
    console.log(`Total: ${usdaResponse.foods?.length || 0} results\n`);
    usdaResponse.foods?.slice(0, 10).forEach((food, idx) => {
      const brand = food.brandOwner ? ` [${food.brandOwner}]` : '';
      console.log(`${idx + 1}. ${food.description}${brand} (${food.dataType})`);
    });
  } catch (error) {
    console.error('USDA Error:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('\n🔬 CNF vs USDA Search Quality Comparison');
  console.log('Testing whole foods search results...\n');

  for (const query of TEST_QUERIES) {
    await testSearch(query);
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n\n✅ Test completed!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
