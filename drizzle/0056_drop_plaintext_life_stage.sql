-- Hand-written (drizzle-kit generate produced no diff here since the schema
-- already excluded `life_stage` as of migration 0055's snapshot). This is the
-- second half of that migration, deliberately split out: it only runs after
-- scripts/backfill-life-stage-encryption.ts has copied every row's value into
-- life_stage_encrypted. Verified via psql before this file was written — all 3
-- existing rows had life_stage = 'NONE' and life_stage_encrypted left NULL,
-- which is correct (NONE is never encrypted).
ALTER TABLE "user_profiles" DROP COLUMN "life_stage";
