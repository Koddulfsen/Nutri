/**
 * Migrate Existing Chicken Breast Data to Compound IDs
 *
 * This script updates the existing chicken breast food entry to use compound IDs
 * instead of string-based nutrient names.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🧙‍♂️ Migrating chicken breast data to compound IDs...\n');

  // Step 1: Get all merged_nutrients with NULL compound_id
  const { data: nutrientsToMigrate, error: fetchError } = await supabase
    .from('merged_nutrients')
    .select('id, food_id, nutrient_name')
    .is('compound_id', null);

  if (fetchError) {
    console.error('Failed to fetch nutrients:', fetchError);
    return;
  }

  console.log(`Found ${nutrientsToMigrate.length} nutrients to migrate\n`);

  // Step 2: Create mapping of nutrient names to compound IDs
  const { data: compounds, error: compoundsError } = await supabase
    .from('compounds')
    .select('id, name, alternate_names');

  if (compoundsError) {
    console.error('Failed to fetch compounds:', compoundsError);
    return;
  }

  // Build lookup map (case-insensitive)
  const nameToCompoundId: Record<string, string> = {};

  for (const compound of compounds) {
    // Add main name
    nameToCompoundId[compound.name.toLowerCase()] = compound.id;

    // Add alternate names
    if (compound.alternate_names) {
      for (const altName of compound.alternate_names) {
        nameToCompoundId[altName.toLowerCase()] = compound.id;
      }
    }
  }

  // Add manual mappings for common variations
  const manualMappings: Record<string, string> = {
    'carbohydrate': nameToCompoundId['total carbohydrate'],
    'dietary fiber': nameToCompoundId['total fiber'],
    'vitamin a (rae)': nameToCompoundId['vitamin a'],
    'vitamin b1 (thiamin)': nameToCompoundId['thiamin'],
    'vitamin b2 (riboflavin)': nameToCompoundId['riboflavin'],
    'vitamin b3 (niacin)': nameToCompoundId['niacin'],
    'vitamin b5 (pantothenic acid)': nameToCompoundId['pantothenic acid'],
    'folate (total)': nameToCompoundId['folate'],
    'folate (natural)': nameToCompoundId['folate'],
    'folic acid (synthetic)': nameToCompoundId['folate'],
    'beta carotene': nameToCompoundId['beta-carotene'],
    'calories': nameToCompoundId['energy'],
  };

  Object.assign(nameToCompoundId, manualMappings);

  // Step 3: Update each nutrient with compound_id
  let updated = 0;
  let skipped = 0;

  for (const nutrient of nutrientsToMigrate) {
    const compoundId = nameToCompoundId[nutrient.nutrient_name.toLowerCase()];

    if (!compoundId) {
      console.warn(`⚠️  No compound found for "${nutrient.nutrient_name}" - skipping`);
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('merged_nutrients')
      .update({ compound_id: compoundId })
      .eq('id', nutrient.id);

    if (updateError) {
      console.error(`✗ Failed to update "${nutrient.nutrient_name}":`, updateError.message);
    } else {
      console.log(`✓ Updated "${nutrient.nutrient_name}" → ${compoundId}`);
      updated++;
    }
  }

  console.log('\n✨ Migration complete!');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
}

main().catch(console.error);
