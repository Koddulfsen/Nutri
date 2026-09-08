-- Replace full date of birth with birth year + month.
--
-- calculateAgeGroup() reads only year and month (it never called getDate()), so
-- the day was stored while being provably unused — verified against 809 cases
-- spanning every age-band boundary, where day-of-month changed the result zero
-- times. Full DOB is a strong quasi-identifier which, combined with
-- biological_sex and life_stage, re-identifies most people and would also
-- disclose a pregnancy. GDPR Art. 5(1)(c) data minimisation.
--
-- The backfill deliberately discards the day. This is a ONE-WAY migration: the
-- day of birth is destroyed, not archived. That is the point.
ALTER TABLE "user_profiles" ADD COLUMN "birth_year" smallint;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "birth_month" smallint;--> statement-breakpoint
UPDATE "user_profiles"
   SET "birth_year"  = EXTRACT(YEAR  FROM "birth_date")::smallint,
       "birth_month" = EXTRACT(MONTH FROM "birth_date")::smallint
 WHERE "birth_date" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "birth_date";
