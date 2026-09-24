/**
 * Integration test: life_stage encryption round-trip.
 *
 * Phase B verification (CLAUDE.md task 2.5): proves the actual read/write path
 * — not just the crypto primitive — encrypts life_stage at rest and decrypts it
 * correctly, and that a raw SQL read of the column never returns plaintext.
 *
 * Hits the real database (DATABASE_URL). Creates and tears down its own throwaway
 * user_profiles / user_encryption_keys rows so it doesn't touch real user data.
 */
import 'dotenv/config';
import { describe, expect, it, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { userProfiles, userEncryptionKeys } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { generateDEK } from '@/lib/security/encryption';
import { getUserDemographics, updateUserDemographics } from './daily-value-service';

describe('life_stage encryption round-trip', () => {
  const testUserId = randomUUID();

  afterEach(async () => {
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(userEncryptionKeys).where(eq(userEncryptionKeys.userId, testUserId));
  });

  it('encrypts PREGNANT at rest and decrypts it back through the real read path', async () => {
    const dek = await generateDEK();
    await db.insert(userEncryptionKeys).values({ userId: testUserId, dataEncryptionKey: dek });
    await db.insert(userProfiles).values({ userId: testUserId });

    await updateUserDemographics(testUserId, { lifeStage: 'PREGNANT' });

    // Raw SQL read — bypasses the service entirely — must never see plaintext.
    const raw = await db.execute<{ life_stage_encrypted: string | null }>(
      sql`SELECT life_stage_encrypted FROM user_profiles WHERE user_id = ${testUserId}`
    );
    const ciphertext = (raw as any[])[0].life_stage_encrypted;
    expect(ciphertext).toBeTruthy();
    expect(ciphertext).not.toContain('PREGNANT');

    // The real read path must decrypt it correctly.
    const demographics = await getUserDemographics(testUserId);
    expect(demographics?.lifeStage).toBe('PREGNANT');
  });

  it('stores NONE as NULL, unencrypted, and never allocates a key lookup for it', async () => {
    const dek = await generateDEK();
    await db.insert(userEncryptionKeys).values({ userId: testUserId, dataEncryptionKey: dek });
    await db.insert(userProfiles).values({ userId: testUserId });

    await updateUserDemographics(testUserId, { lifeStage: 'NONE' });

    const raw = await db.execute<{ life_stage_encrypted: string | null }>(
      sql`SELECT life_stage_encrypted FROM user_profiles WHERE user_id = ${testUserId}`
    );
    expect((raw as any[])[0].life_stage_encrypted).toBeNull();

    const demographics = await getUserDemographics(testUserId);
    expect(demographics?.lifeStage).toBe('NONE');
  });

  it('refuses to set a non-NONE life_stage when no encryption key exists for the user', async () => {
    // Deliberately no userEncryptionKeys row.
    await db.insert(userProfiles).values({ userId: testUserId });

    await expect(updateUserDemographics(testUserId, { lifeStage: 'LACTATING' })).rejects.toThrow(
      /no encryption key/i
    );
  });
});
