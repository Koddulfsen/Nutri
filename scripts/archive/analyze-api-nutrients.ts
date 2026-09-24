/**
 * Analyze All Available Nutrients from CNF and FDC APIs
 */

import { cnfClient } from '../lib/services/cnf-client';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Discovering all available nutrients from APIs...\n');

  // Fetch CNF nutrients
  console.log('Fetching CNF nutrients (Chicken Breast, food_code: 841)...');
  const cnfNutrients = await cnfClient.getNutrients(841);
  console.log(`Found ${cnfNutrients.length} CNF nutrients\n`);

  // Get FDC nutrients from database (from previous chicken breast entry)
  console.log('Fetching FDC nutrients from existing chicken breast entry...');
  const { data: fdcNutrients } = await supabase
    .from('nutrient_source_values')
    .select('*')
    .eq('api_source', 'FDC')
    .limit(200);

  console.log(`Found ${fdcNutrients?.length || 0} FDC nutrients in database\n`);

  // Display CNF nutrients
  console.log('=== CNF NUTRIENTS (Total: ' + cnfNutrients.length + ') ===');
  const cnfMap = new Map();
  cnfNutrients.forEach((n: any) => {
    if (!cnfMap.has(n.nutrient_name_id)) {
      cnfMap.set(n.nutrient_name_id, n.nutrient_web_name);
    }
  });

  const sortedCnf = Array.from(cnfMap.entries()).sort((a, b) => parseInt(String(a[0])) - parseInt(String(b[0])));
  sortedCnf.forEach(([id, name]) => {
    const paddedId = String(id).padStart(4, ' ');
    console.log(paddedId + ': ' + name);
  });

  console.log(`\nTotal unique CNF nutrients: ${cnfMap.size}`);

  // Save to file
  const cnfData = sortedCnf.map(([id, name]) => ({ id, name }));
  writeFileSync('/tmp/cnf-nutrients.json', JSON.stringify(cnfData, null, 2));
  console.log('\n✅ Saved CNF nutrients to /tmp/cnf-nutrients.json');
}

main().catch(console.error);
