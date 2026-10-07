/**
 * A user's data-encryption key (DEK), for encrypting their free text and
 * Article 9 fields with encryptPHI/decryptPHI.
 *
 * New users get a key in ensureUserProfile(). An older profile without one gets
 * it here, on first need — safe, since nothing can have been encrypted under a
 * key that didn't exist.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userEncryptionKeys } from '@/db/schema';
import { generateDEK } from '@/lib/security/encryption';

export async function getUserDek(userId: string): Promise<string> {
  const existing = await db.query.userEncryptionKeys.findFirst({
    where: eq(userEncryptionKeys.userId, userId),
  });
  if (existing) return existing.dataEncryptionKey;

  await db
    .insert(userEncryptionKeys)
    .values({ userId, dataEncryptionKey: await generateDEK() })
    .onConflictDoNothing();
  // Read back rather than trust our own insert: a parallel request may have won.
  const row = await db.query.userEncryptionKeys.findFirst({
    where: eq(userEncryptionKeys.userId, userId),
  });
  if (!row) throw new Error('Could not create an encryption key for this user.');
  return row.dataEncryptionKey;
}
