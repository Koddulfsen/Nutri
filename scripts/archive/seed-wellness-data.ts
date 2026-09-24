/**
 * Seed Wellness Log Data
 *
 * Generates realistic symptom log data over the past 90 days for a user.
 *
 * Usage:
 *   USER_ID=<uuid> npx tsx scripts/seed-wellness-data.ts
 *
 * Or by email:
 *   USER_EMAIL=user@example.com npx tsx scripts/seed-wellness-data.ts
 *
 * Convention: higher intensity = better (applies across all symptoms).
 */

import 'dotenv/config';
import { db } from '@/db';
import { symptomLogs, symptomDefinitions } from '@/db/schema/symptoms';
import { userProfiles } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

// Subset of symptoms a "typical" user would actually track
const TRACKED_SLUGS = [
  'energy-level',
  'focus',
  'mood',
  'sleep-quality',
  'motivation',
  'anxiety',
  'stress',
  'bloating',
  'headache',
  'fatigue',
];

// Per-symptom base scores (1-10, higher = better) and daily noise amplitude
const PROFILES: Record<string, { base: number; noise: number; trend: number }> = {
  'energy-level':  { base: 6.5, noise: 1.5, trend: 0.01 },   // slight improvement
  'focus':         { base: 6.0, noise: 1.8, trend: 0.0 },
  'mood':          { base: 7.0, noise: 1.2, trend: 0.005 },
  'sleep-quality': { base: 6.2, noise: 1.8, trend: 0.02 },   // improving
  'motivation':    { base: 6.5, noise: 1.7, trend: 0.0 },
  'anxiety':       { base: 7.0, noise: 1.5, trend: 0.01 },
  'stress':        { base: 6.0, noise: 2.0, trend: 0.015 },
  'bloating':      { base: 7.5, noise: 1.2, trend: 0.0 },
  'headache':      { base: 8.0, noise: 1.5, trend: 0.0 },
  'fatigue':       { base: 6.5, noise: 1.8, trend: 0.01 },
};

const DAYS = 90;
const SKIP_PROBABILITY = 0.25;     // some days are skipped entirely
const SYMPTOM_LOG_RATE = 0.75;     // per symptom per day chance of being logged

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function resolveUserId(): Promise<string> {
  if (process.env.USER_ID) return process.env.USER_ID;

  const email = process.env.USER_EMAIL;
  if (!email) {
    throw new Error('Set USER_ID=<uuid> or USER_EMAIL=<email> before running.');
  }

  // Look up via userProfiles.email — if that column exists
  const rows = await db.select({ userId: userProfiles.userId }).from(userProfiles).limit(1);
  if (rows.length === 0) {
    throw new Error(`No user found for email ${email}. Pass USER_ID directly.`);
  }
  return rows[0].userId;
}

async function main() {
  const userId = await resolveUserId();
  console.log(`🌱 Seeding wellness data for user: ${userId}`);

  // Load symptom definitions (system-defined)
  const definitions = await db
    .select({ id: symptomDefinitions.id, slug: symptomDefinitions.slug, name: symptomDefinitions.name })
    .from(symptomDefinitions)
    .where(eq(symptomDefinitions.isSystemDefined, true));

  const bySlug = new Map(definitions.map((d) => [d.slug, d]));
  const tracked = TRACKED_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean) as Array<{ id: string; slug: string; name: string }>;

  if (tracked.length === 0) {
    throw new Error('No tracked symptom definitions found. Did you run the symptoms seed?');
  }

  console.log(`  → Tracking ${tracked.length} symptoms: ${tracked.map((t) => t.name).join(', ')}`);

  const today = new Date();
  const rows: Array<{ userId: string; symptomDefinitionId: string; date: string; intensity: number; notes: string | null }> = [];

  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Some full days are skipped
    if (Math.random() < SKIP_PROBABILITY) continue;

    const daysFromEarliest = DAYS - 1 - dayOffset;

    for (const sym of tracked) {
      if (Math.random() > SYMPTOM_LOG_RATE) continue;

      const profile = PROFILES[sym.slug] || { base: 6, noise: 1.5, trend: 0 };
      const trendValue = profile.trend * daysFromEarliest;
      const noise = (Math.random() * 2 - 1) * profile.noise;
      const intensity = Math.round(clamp(profile.base + trendValue + noise, 1, 10));

      rows.push({
        userId,
        symptomDefinitionId: sym.id,
        date: dateStr,
        intensity,
        notes: null,
      });
    }
  }

  console.log(`  → Generated ${rows.length} log entries`);

  // Clear existing logs for this user in the range (so we get a clean seed)
  console.log('  → Clearing existing logs for this user...');
  await db.delete(symptomLogs).where(eq(symptomLogs.userId, userId));

  // Batch insert
  const BATCH_SIZE = 200;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(symptomLogs).values(rows.slice(i, i + BATCH_SIZE));
    console.log(`  → Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log(`✅ Seeded ${rows.length} wellness logs for ${userId}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
