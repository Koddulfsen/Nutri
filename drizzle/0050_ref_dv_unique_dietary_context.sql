-- Restore dietary_context to the reference_daily_values unique key.
--
-- The journal's 0039 (0039_colossal_donald_blake) creates this index over 9 columns
-- including dietary_context, and the schema declares the same. The live database had
-- the 8-column version from the unjournaled 0039_nulls_not_distinct_ref_dv.sql instead,
-- so every DV seed's ON CONFLICT (... activity_level, dietary_context) failed with
-- 42P10 "no unique or exclusion constraint matching the ON CONFLICT specification".
--
-- Widening the key cannot conflict with existing rows: anything unique over 8 columns
-- is unique over 9.
DROP INDEX IF EXISTS "idx_ref_dv_compound_demo_source";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ref_dv_compound_demo_source"
  ON "reference_daily_values" (
    "compound_id", "source_region", "age_min_months", "age_max_months",
    "sex", "life_stage", "value_type", "activity_level", "dietary_context"
  )
  NULLS NOT DISTINCT;
