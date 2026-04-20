import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
  const foodId = '4157f37d-6a6d-4902-ad01-ebf06ae12ca9'; // Broccoli

  // Get all merged nutrients with their source values
  const { data: merged } = await supabase
    .from('merged_nutrients')
    .select('id, nutrient_name, average_value, unit, source_count')
    .eq('food_id', foodId)
    .order('nutrient_name');

  // Get all source values
  const { data: sourceValues } = await supabase
    .from('nutrient_source_values')
    .select('merged_nutrient_id, api_source, value')
    .in('merged_nutrient_id', merged.map(m => m.id));

  // Group source values by merged nutrient
  const sourceMap = {};
  sourceValues?.forEach(sv => {
    if (!sourceMap[sv.merged_nutrient_id]) {
      sourceMap[sv.merged_nutrient_id] = [];
    }
    sourceMap[sv.merged_nutrient_id].push(sv);
  });

  // Categorize nutrients
  const bothSources = [];
  const cnfOnly = [];
  const fdcOnly = [];

  merged?.forEach(m => {
    const sources = sourceMap[m.id] || [];
    const hasCNF = sources.some(s => s.api_source === 'CNF');
    const hasFDC = sources.some(s => s.api_source === 'FDC');

    const entry = {
      name: m.nutrient_name,
      unit: m.unit,
      avg: parseFloat(m.average_value).toFixed(3),
      cnf: sources.find(s => s.api_source === 'CNF')?.value,
      fdc: sources.find(s => s.api_source === 'FDC')?.value,
    };

    if (hasCNF && hasFDC) {
      bothSources.push(entry);
    } else if (hasCNF) {
      cnfOnly.push(entry);
    } else if (hasFDC) {
      fdcOnly.push(entry);
    }
  });

  console.log('=== OVERLAPPING (Both CNF & USDA) ===');
  console.log('Count:', bothSources.length);
  console.log('');
  bothSources.forEach(n => {
    console.log(`  ${n.name}: CNF=${n.cnf} | USDA=${n.fdc} | Avg=${n.avg} ${n.unit}`);
  });

  console.log('');
  console.log('=== CNF ONLY ===');
  console.log('Count:', cnfOnly.length);
  cnfOnly.forEach(n => {
    console.log(`  ${n.name}: ${n.cnf} ${n.unit}`);
  });

  console.log('');
  console.log('=== USDA ONLY ===');
  console.log('Count:', fdcOnly.length);
  fdcOnly.forEach(n => {
    console.log(`  ${n.name}: ${n.fdc} ${n.unit}`);
  });

  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Both sources:', bothSources.length);
  console.log('CNF only:', cnfOnly.length);
  console.log('USDA only:', fdcOnly.length);
  console.log('Total unique:', bothSources.length + cnfOnly.length + fdcOnly.length);
}

analyze();
