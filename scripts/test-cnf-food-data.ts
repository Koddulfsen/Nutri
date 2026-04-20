/**
 * Test CNF API with actual food codes from search results
 */
import { cnfClient } from '../lib/services/cnf-client';
import axios from 'axios';

const BASE_URL = 'https://food-nutrition.canada.ca/api/canadian-nutrient-file';

async function testRealFood() {
  // First, search for chicken to get real food codes
  console.log('🔍 Getting real food codes from chicken search...\n');
  const searchResults = await cnfClient.searchFoods('chicken breast', 5);
  
  if (searchResults.length === 0) {
    console.log('No results found');
    return;
  }

  const testFood = searchResults[0];
  console.log(`Testing with: ${testFood.name} (code: ${testFood.foodCode})\n`);

  // Test all endpoints with this real food code
  console.log('1️⃣ FOOD DETAILS:');
  console.log('='.repeat(80));
  try {
    const foodResponse = await axios.get(`${BASE_URL}/food/`, {
      params: { id: testFood.foodCode, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(foodResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('\n\n2️⃣ NUTRIENT AMOUNTS (first 20):');
  console.log('='.repeat(80));
  try {
    const nutrientResponse = await axios.get(`${BASE_URL}/nutrientamount/`, {
      params: { id: testFood.foodCode, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(nutrientResponse.data.slice(0, 20), null, 2));
    console.log(`\n... (${nutrientResponse.data.length} total nutrients)`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('\n\n3️⃣ SERVING SIZES:');
  console.log('='.repeat(80));
  try {
    const servingResponse = await axios.get(`${BASE_URL}/servingsize/`, {
      params: { id: testFood.foodCode, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(servingResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('\n\n4️⃣ REFUSE AMOUNT:');
  console.log('='.repeat(80));
  try {
    const refuseResponse = await axios.get(`${BASE_URL}/refuseamount/`, {
      params: { id: testFood.foodCode, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(refuseResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('\n\n5️⃣ YIELD AMOUNT:');
  console.log('='.repeat(80));
  try {
    const yieldResponse = await axios.get(`${BASE_URL}/yieldamount/`, {
      params: { id: testFood.foodCode, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(yieldResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testRealFood().catch(console.error);
