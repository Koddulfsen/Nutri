/**
 * Display Settings Seed (groups only)
 *
 * Compounds no longer have a has_dv flag — their progress bar is gated by
 * whether they have rows in reference_daily_values. Groups still carry the
 * flag because they are aggregation buckets, not individual nutrients.
 */

import 'dotenv/config';
import { supabase } from '../supabase-client';

const GROUPS_WITH_DV: string[] = [
  'Macronutrients',
  'Carbohydrates',
  'Fats',
  'Vitamins',
  'Proteins',
];

export async function seedDisplaySettings() {
  console.log('\n🌱 Seeding group has_dv flags...\n');

  await supabase
    .from('compound_groups')
    .update({ has_dv: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  let groupCount = 0;
  for (const groupName of GROUPS_WITH_DV) {
    const { data, error } = await supabase
      .from('compound_groups')
      .update({ has_dv: true })
      .eq('name', groupName)
      .select('id');

    if (error) {
      console.log(`   ⚠️  Failed to update: ${groupName} - ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`   ⚠️  Group not found: ${groupName}`);
    } else {
      groupCount++;
    }
  }

  console.log(`\n✅ Set has_dv=true for ${groupCount} groups\n`);
  return groupCount;
}

if (require.main === module) {
  seedDisplaySettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}

export default seedDisplaySettings;
