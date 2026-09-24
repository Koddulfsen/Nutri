/**
 * Test CNF API endpoints to see all available data
 */
import axios from 'axios';

const BASE_URL = 'https://food-nutrition.canada.ca/api/canadian-nutrient-file';

async function testEndpoints() {
  console.log('🔍 Testing CNF API Endpoints\n');

  // Test 1: Get a specific food (chicken breast example - code 141)
  console.log('1️⃣ FOOD DETAILS (chicken breast - code 141):');
  console.log('='.repeat(80));
  try {
    const foodResponse = await axios.get(`${BASE_URL}/food/`, {
      params: { id: 141, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(foodResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n2️⃣ NUTRIENT AMOUNTS (chicken breast - code 141):');
  console.log('='.repeat(80));
  try {
    const nutrientResponse = await axios.get(`${BASE_URL}/nutrientamount/`, {
      params: { id: 141, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(nutrientResponse.data.slice(0, 10), null, 2)); // First 10 nutrients
    console.log(`\n... (${nutrientResponse.data.length} total nutrients)`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n3️⃣ SERVING SIZES (chicken breast - code 141):');
  console.log('='.repeat(80));
  try {
    const servingResponse = await axios.get(`${BASE_URL}/servingsize/`, {
      params: { id: 141, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(servingResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n4️⃣ FOOD GROUP (checking if food group endpoint exists):');
  console.log('='.repeat(80));
  try {
    const groupResponse = await axios.get(`${BASE_URL}/foodgroup/`, {
      params: { lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(groupResponse.data.slice(0, 10), null, 2)); // First 10 groups
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n5️⃣ NUTRIENT NAME LIST (all nutrient definitions):');
  console.log('='.repeat(80));
  try {
    const nutrientNamesResponse = await axios.get(`${BASE_URL}/nutrientname/`, {
      params: { lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(nutrientNamesResponse.data.slice(0, 15), null, 2)); // First 15 nutrients
    console.log(`\n... (${nutrientNamesResponse.data.length} total nutrient definitions)`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n6️⃣ NUTRIENT GROUPS (nutrient categorization):');
  console.log('='.repeat(80));
  try {
    const nutrientGroupsResponse = await axios.get(`${BASE_URL}/nutrientgroup/`, {
      params: { lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(nutrientGroupsResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n7️⃣ REFUSE AMOUNT (inedible portions for chicken - code 141):');
  console.log('='.repeat(80));
  try {
    const refuseResponse = await axios.get(`${BASE_URL}/refuseamount/`, {
      params: { id: 141, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(refuseResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n\n8️⃣ YIELD AMOUNT (cooking loss/gain for chicken - code 141):');
  console.log('='.repeat(80));
  try {
    const yieldResponse = await axios.get(`${BASE_URL}/yieldamount/`, {
      params: { id: 141, lang: 'en', type: 'json' }
    });
    console.log(JSON.stringify(yieldResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

testEndpoints().catch(console.error);
