import 'dotenv/config';

async function main() {
  const fdcId = 171287; // Egg, whole, raw, fresh
  const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${process.env.USDA_API_KEY}`;

  console.log('Testing FDC ID:', fdcId);
  console.log('API Key present:', !!process.env.USDA_API_KEY);
  console.log('API Key prefix:', process.env.USDA_API_KEY?.slice(0, 8) + '...');

  try {
    const res = await fetch(url);
    console.log('Status:', res.status);

    if (res.ok) {
      const data = await res.json();
      console.log('Food found:', data.description);
      console.log('Nutrients:', data.foodNutrients?.length || 0);
    } else {
      const text = await res.text();
      console.log('Error response:', text.slice(0, 500));
    }
  } catch (e: any) {
    console.error('Fetch error:', e.message);
  }
}

main();
