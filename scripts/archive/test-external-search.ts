/**
 * Test External Search Endpoint
 *
 * Quick test to verify CNF and USDA APIs are responding
 * Run: npx tsx scripts/test-external-search.ts
 */

async function testExternalSearch() {
  console.log('🔍 Testing /api/foods/external-search endpoint...\n');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const testQuery = 'chicken';

    console.log(`Calling: ${baseUrl}/api/foods/external-search?q=${testQuery}&limit=5`);
    console.log('Waiting for response...\n');

    const startTime = Date.now();

    const res = await fetch(`${baseUrl}/api/foods/external-search?q=${testQuery}&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Response received in ${duration}ms`);
    console.log(`Status: ${res.status} ${res.statusText}\n`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await res.json();

    console.log('📊 Results:');
    console.log(`  CNF results: ${data.cnf?.length || 0}`);
    console.log(`  USDA results: ${data.fdc?.length || 0}`);
    console.log(`  Duration: ${data.metadata?.durationMs}ms`);

    if (data.metadata?.errors) {
      console.warn('\n⚠️  API Errors:');
      data.metadata.errors.forEach((error: string) => console.warn(`  - ${error}`));
    }

    console.log('\n📋 Sample CNF Results:');
    data.cnf?.slice(0, 3).forEach((food: any) => {
      console.log(`  - ${food.name} (ID: ${food.apiId})`);
    });

    console.log('\n📋 Sample USDA Results:');
    data.fdc?.slice(0, 3).forEach((food: any) => {
      console.log(`  - ${food.name} (ID: ${food.apiId})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testExternalSearch();
