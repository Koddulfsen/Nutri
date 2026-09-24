/**
 * Fetch FDC Nutrient List from USDA API
 */
import 'dotenv/config';

const key = process.env.USDA_API_KEY;

if (!key) {
  console.log('No USDA_API_KEY found in environment');
  process.exit(1);
}

console.log('Fetching FDC nutrients...\n');

fetch(`https://api.nal.usda.gov/fdc/v1/nutrients/list?api_key=${key}`)
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.log('API Error:', data.error);
      return;
    }

    if (Array.isArray(data)) {
      console.log(`Total FDC nutrients: ${data.length}\n`);

      // Print all nutrients with ID, name, unit
      data.forEach((n: any) => {
        console.log(`${n.id}|${n.name}|${n.unitName}`);
      });
    } else {
      console.log('Unexpected response:', JSON.stringify(data).slice(0, 500));
    }
  })
  .catch(err => console.log('Fetch error:', err.message));
