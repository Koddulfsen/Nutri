/**
 * Display Settings Seed (groups only)
 *
 * Compounds no longer have a has_dv flag — their progress bar is gated by
 * whether they have rows in reference_daily_values. Groups still carry the
 * flag because they are aggregation buckets, not individual nutrients.
 */

import 'dotenv/config';
import { db } from '@/db';
import { compoundGroups } from '@/db/schema';
import { eq } from 'drizzle-orm';

const GROUPS_WITH_DV: string[] = [
  'Macronutrients',
  'Carbohydrates',
  'Fats',
  'Vitamins',
  'Proteins',
];

export async function seedDisplaySettings() {
  console.log('\n🌱 Seeding group has_dv flags...\n');

  await db.update(compoundGroups).set({ hasDv: false });

  let groupCount = 0;
  for (const groupName of GROUPS_WITH_DV) {
    const updated = await db
      .update(compoundGroups)
      .set({ hasDv: true })
      .where(eq(compoundGroups.name, groupName))
      .returning({ id: compoundGroups.id });

    if (updated.length === 0) {
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
