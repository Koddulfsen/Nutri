/**
 * One-off backfill: encrypt existing user_profiles.life_stage values into the
 * new life_stage_encrypted column before the plaintext column is dropped.
 *
 * NONE is stored as NULL (unencrypted) — it discloses nothing. Only PREGNANT/
 * LACTATING values are actually encrypted, using each user's own DEK from
 * user_encryption_keys.
 *
 * Idempotent: skips any row that already has life_stage_encrypted set.
 * Run with: npx tsx scripts/backfill-life-stage-encryption.ts
 */
import 'dotenv/config';
import { db } from '@/db';
import { userProfiles, userEncryptionKeys } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { encryptPHI } from '@/lib/security/encryption';

async function main() {
  const rows = await db.execute<{ user_id: string; life_stage: string | null; life_stage_encrypted: string | null }>(
    sql`SELECT user_id, life_stage, life_stage_encrypted FROM user_profiles`
  );

  let skipped = 0;
  let setNull = 0;
  let encrypted = 0;
  let missingDek = 0;

  for (const row of rows as any[]) {
    if (row.life_stage_encrypted !== null) {
      skipped++;
      continue;
    }

    if (!row.life_stage || row.life_stage === 'NONE') {
      // Nothing to encrypt; leave the column NULL (already NULL by default, but
      // set explicitly so the row is unambiguously "handled" for idempotence).
      await db.execute(sql`UPDATE user_profiles SET life_stage_encrypted = NULL WHERE user_id = ${row.user_id}`);
      setNull++;
      continue;
    }

    const keyRow = await db.query.userEncryptionKeys.findFirst({
      where: eq(userEncryptionKeys.userId, row.user_id),
    });

    if (!keyRow) {
      console.error(`No encryption key for user ${row.user_id} — cannot encrypt life_stage, skipping`);
      missingDek++;
      continue;
    }

    const ciphertext = await encryptPHI(row.life_stage, keyRow.dataEncryptionKey);
    await db.execute(sql`UPDATE user_profiles SET life_stage_encrypted = ${ciphertext} WHERE user_id = ${row.user_id}`);
    encrypted++;
  }

  console.log(`Backfill complete: ${encrypted} encrypted, ${setNull} set to NULL (NONE), ${skipped} already done, ${missingDek} missing a DEK.`);
  if (missingDek > 0) {
    throw new Error(`${missingDek} row(s) have no encryption key — resolve before dropping the plaintext column.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
