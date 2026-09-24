/**
 * Setup Compound ID Mapping System
 *
 * This script:
 * 1. Adds basic macronutrient compounds to the compounds table
 * 2. Populates compound_sources with CNF/FDC nutrient ID mappings
 *
 * Run after applying migration 0008_dear_the_watchers.sql
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Basic macronutrient compounds to add
 */
const BASIC_COMPOUNDS = [
  { name: 'Protein', unit: 'g', type: 'MACRONUTRIENT', alternateNames: ['Total Protein'] },
  { name: 'Total Fat', unit: 'g', type: 'MACRONUTRIENT', alternateNames: ['Fat', 'Total Lipid'] },
  { name: 'Total Carbohydrate', unit: 'g', type: 'MACRONUTRIENT', alternateNames: ['Carbohydrate', 'Carbs'] },
  { name: 'Energy', unit: 'kcal', type: 'MACRONUTRIENT', alternateNames: ['Calories', 'Caloric Value'] },
  { name: 'Water', unit: 'g', type: 'MACRONUTRIENT', alternateNames: ['Moisture', 'H2O'] },
  { name: 'Ash', unit: 'g', type: 'MACRONUTRIENT', alternateNames: ['Mineral Ash'] },
];

/**
 * CNF to Compound mapping
 * Maps CNF nutrient_id to standardized nutrient name
 *
 * Source: CNF 2015 nutrient_id values from API responses
 */
const CNF_NUTRIENT_IDS: Record<string, string> = {
  // Macronutrients
  '203': 'Protein',
  '204': 'Total Fat',
  '205': 'Total Carbohydrate',
  '208': 'Energy',
  '255': 'Water',
  '207': 'Ash',

  // Fiber
  '291': 'Dietary Fiber',  // Will map to "Total Fiber" compound

  // Vitamins
  '401': 'Vitamin C',
  '404': 'Vitamin B1 (Thiamin)',
  '405': 'Vitamin B2 (Riboflavin)',
  '406': 'Vitamin B3 (Niacin)',
  '410': 'Vitamin B5 (Pantothenic Acid)',
  '415': 'Vitamin B6',
  '417': 'Folate (Total)',
  '418': 'Vitamin B12',
  '320': 'Vitamin A (RAE)',
  '319': 'Retinol',
  '321': 'Beta Carotene',
  '324': 'Vitamin D',
  '323': 'Vitamin E',
  '430': 'Vitamin K',

  // Minerals
  '301': 'Calcium',
  '303': 'Iron',
  '304': 'Magnesium',
  '305': 'Phosphorus',
  '306': 'Potassium',
  '307': 'Sodium',
  '309': 'Zinc',
  '312': 'Copper',
  '315': 'Manganese',
  '317': 'Selenium',

  // Lipids
  '601': 'Cholesterol',
  '606': 'Saturated Fat',
  '645': 'Monounsaturated Fat',
  '646': 'Polyunsaturated Fat',
};

/**
 * USDA FDC to Compound mapping
 * Maps FDC nutrient_number to standardized nutrient name
 *
 * Source: USDA FDC API nutrient_number values
 */
const FDC_NUTRIENT_IDS: Record<string, string> = {
  // Macronutrients
  '1003': 'Protein',
  '1004': 'Total Fat',
  '1005': 'Total Carbohydrate',
  '1008': 'Energy',
  '1051': 'Water',
  '1007': 'Ash',

  // Fiber
  '1079': 'Dietary Fiber',  // Will map to "Total Fiber" compound

  // Vitamins
  '1162': 'Vitamin C',
  '1165': 'Vitamin B1 (Thiamin)',
  '1166': 'Vitamin B2 (Riboflavin)',
  '1167': 'Vitamin B3 (Niacin)',
  '1170': 'Vitamin B5 (Pantothenic Acid)',
  '1175': 'Vitamin B6',
  '1177': 'Folate (Total)',
  '1178': 'Vitamin B12',
  '1106': 'Vitamin A (RAE)',
  '1105': 'Retinol',
  '1107': 'Beta Carotene',
  '1114': 'Vitamin D',
  '1109': 'Vitamin E',
  '1183': 'Vitamin K',

  // Minerals
  '1087': 'Calcium',
  '1089': 'Iron',
  '1090': 'Magnesium',
  '1091': 'Phosphorus',
  '1092': 'Potassium',
  '1093': 'Sodium',
  '1095': 'Zinc',
  '1098': 'Copper',
  '1101': 'Manganese',
  '1103': 'Selenium',

  // Lipids
  '1253': 'Cholesterol',
  '1258': 'Saturated Fat',
  '1292': 'Monounsaturated Fat',
  '1293': 'Polyunsaturated Fat',
};

async function main() {
  console.log('🧙‍♂️ Setting up Compound ID Mapping System...\n');

  // Step 1: Add basic macronutrient compounds
  console.log('Step 1: Adding basic macronutrient compounds...');
  const compoundIds: Record<string, string> = {};

  for (const compound of BASIC_COMPOUNDS) {
    const { data, error } = await supabase
      .from('compounds')
      .insert({
        name: compound.name,
        unit: compound.unit,
        compound_type: compound.type,
        alternate_names: compound.alternateNames,
        description: `Basic macronutrient: ${compound.name}`,
      })
      .select('id, name')
      .single();

    if (error) {
      console.error(`  ✗ Failed to add ${compound.name}:`, error.message);
    } else {
      compoundIds[compound.name] = data.id;
      console.log(`  ✓ Added ${compound.name}: ${data.id}`);
    }
  }

  // Step 2: Get existing compound IDs for vitamins, minerals, etc.
  console.log('\nStep 2: Fetching existing compound IDs...');
  const allCompoundNames = [
    ...new Set([
      ...Object.values(CNF_NUTRIENT_IDS),
      ...Object.values(FDC_NUTRIENT_IDS),
    ])
  ];

  for (const name of allCompoundNames) {
    if (!compoundIds[name]) {
      // Try exact match first
      let { data } = await supabase
        .from('compounds')
        .select('id, name')
        .eq('name', name)
        .single();

      // If not found, try case-insensitive match
      if (!data) {
        const result = await supabase
          .from('compounds')
          .select('id, name')
          .ilike('name', name)
          .limit(1);

        data = result.data?.[0];
      }

      if (data) {
        compoundIds[name] = data.id;
        console.log(`  ✓ Found ${name}: ${data.id}`);
      } else {
        console.warn(`  ⚠️  Compound not found: ${name}`);
      }
    }
  }

  // Step 3: Populate compound_sources for CNF
  console.log('\nStep 3: Populating compound_sources for CNF...');
  let cnfCount = 0;

  for (const [nutrientId, compoundName] of Object.entries(CNF_NUTRIENT_IDS)) {
    const compoundId = compoundIds[compoundName];

    if (!compoundId) {
      console.warn(`  ⚠️  Skipping CNF ${nutrientId} - compound "${compoundName}" not found`);
      continue;
    }

    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compoundId,
        external_source: 'CNF',
        external_id: nutrientId,
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`  - CNF ${nutrientId} → ${compoundName} (already exists)`);
      } else {
        console.error(`  ✗ Failed CNF ${nutrientId}:`, error.message);
      }
    } else {
      console.log(`  ✓ CNF ${nutrientId} → ${compoundName}`);
      cnfCount++;
    }
  }

  // Step 4: Populate compound_sources for FDC
  console.log('\nStep 4: Populating compound_sources for FDC...');
  let fdcCount = 0;

  for (const [nutrientId, compoundName] of Object.entries(FDC_NUTRIENT_IDS)) {
    const compoundId = compoundIds[compoundName];

    if (!compoundId) {
      console.warn(`  ⚠️  Skipping FDC ${nutrientId} - compound "${compoundName}" not found`);
      continue;
    }

    const { error } = await supabase
      .from('compound_sources')
      .insert({
        compound_id: compoundId,
        external_source: 'FDC',
        external_id: nutrientId,
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`  - FDC ${nutrientId} → ${compoundName} (already exists)`);
      } else {
        console.error(`  ✗ Failed FDC ${nutrientId}:`, error.message);
      }
    } else {
      console.log(`  ✓ FDC ${nutrientId} → ${compoundName}`);
      fdcCount++;
    }
  }

  console.log('\n✨ Setup complete!');
  console.log(`  Added ${cnfCount} CNF mappings`);
  console.log(`  Added ${fdcCount} FDC mappings`);
}

main().catch(console.error);
