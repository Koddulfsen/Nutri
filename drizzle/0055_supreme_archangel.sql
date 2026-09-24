ALTER TABLE "user_profiles" ADD COLUMN "life_stage_encrypted" text;
-- The DROP COLUMN "life_stage" step is deliberately NOT in this migration.
-- Encrypting each existing row's plaintext value requires the app's AES-256-GCM
-- code (Web Crypto), which can't run inside a SQL migration. Between this
-- migration and the next one, scripts/backfill-life-stage-encryption.ts must run
-- to populate life_stage_encrypted from the still-present life_stage column for
-- every existing row. Only after that backfill is verified does the follow-up
-- migration drop the old plaintext column.