/**
 * Integration test: body weight encryption round-trip, and its erasure.
 *
 * Body weight is health data — a measurement of the person's body, and beside biological sex and birth
 * year/month it sharpens an already-identifying set — so it gets the same treatment as life_stage:
 * AES-256-GCM at rest, with the key in a separate table. This proves the real read/write path does that,
 * rather than proving the crypto primitive works in isolation.
 *
 * Hits the real database (DATABASE_URL) and cleans up its own throwaway rows.
 */
import 'dotenv/config';
import { describe, expect, it, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { userProfiles, userEncryptionKeys } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { generateDEK, encryptPHI } from '@/lib/security/encryption';
import { getUserDemographics, updateUserDemographics } from './daily-value-service';

const rawWeight = async (userId: string) => {
  const raw = await db.execute<{ body_weight_kg_encrypted: string | null }>(
    sql`SELECT body_weight_kg_encrypted FROM user_profiles WHERE user_id = ${userId}`
  );
  return (raw as unknown as Array<{ body_weight_kg_encrypted: string | null }>)[0]?.body_weight_kg_encrypted ?? null;
};

describe('body weight encryption round-trip', () => {
  // A fresh id per test, because getUserDemographics keeps an in-memory cache keyed by user id.
  // updateUserDemographics invalidates it (daily-value-service.ts:297), so real callers are fine — but a
  // test that plants ciphertext directly in the database bypasses that and would read a stale value.
  let testUserId = randomUUID();

  afterEach(async () => {
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(userEncryptionKeys).where(eq(userEncryptionKeys.userId, testUserId));
  });

  const seed = async () => {
    testUserId = randomUUID();
    const dek = await generateDEK();
    await db.insert(userEncryptionKeys).values({ userId: testUserId, dataEncryptionKey: dek });
    await db.insert(userProfiles).values({ userId: testUserId });
    return dek;
  };

  it('stores ciphertext, never the number, and reads it back through the real path', async () => {
    await seed();
    await updateUserDemographics(testUserId, { bodyWeightKg: 72 });

    const ciphertext = await rawWeight(testUserId);
    expect(ciphertext).toBeTruthy();
    expect(ciphertext).not.toContain('72');          // a raw SQL read must not see the value
    expect(ciphertext!.length).toBeGreaterThan(20);

    const demographics = await getUserDemographics(testUserId);
    expect(demographics?.bodyWeightKg).toBe(72);
  });

  it('rounds to whole kilograms, because nothing reads finer', async () => {
    await seed();
    await updateUserDemographics(testUserId, { bodyWeightKg: 72.4 });
    expect((await getUserDemographics(testUserId))?.bodyWeightKg).toBe(72);
  });

  it('clears the value on null, rather than leaving the old ciphertext behind', async () => {
    await seed();
    await updateUserDemographics(testUserId, { bodyWeightKg: 80 });
    await updateUserDemographics(testUserId, { bodyWeightKg: null });

    expect(await rawWeight(testUserId)).toBeNull();
    expect((await getUserDemographics(testUserId))?.bodyWeightKg).toBeNull();
  });

  it('leaves the value alone when the field is not part of the update', async () => {
    await seed();
    await updateUserDemographics(testUserId, { bodyWeightKg: 65 });
    await updateUserDemographics(testUserId, { biologicalSex: 'FEMALE' });
    expect((await getUserDemographics(testUserId))?.bodyWeightKg).toBe(65);
  });

  it('ignores a stored value that does not decrypt to a positive number', async () => {
    const dek = await seed();
    // Not reachable through the API, but a NaN here would silently make every per-kg value NaN, so the
    // read path drops it instead of propagating it.
    await db.update(userProfiles)
      .set({ bodyWeightKgEncrypted: await encryptPHI('not a number', dek) })
      .where(eq(userProfiles.userId, testUserId));
    expect((await getUserDemographics(testUserId))?.bodyWeightKg).toBeNull();
  });

  it('goes when the profile goes — the erasure path deletes the row it lives on', async () => {
    await seed();
    await updateUserDemographics(testUserId, { bodyWeightKg: 90 });
    expect(await rawWeight(testUserId)).toBeTruthy();

    // The same delete /api/user/delete-account runs against user_profiles.
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));

    const rows = await db.execute(sql`SELECT 1 FROM user_profiles WHERE user_id = ${testUserId}`);
    expect((rows as unknown as unknown[]).length).toBe(0);
  });
});
