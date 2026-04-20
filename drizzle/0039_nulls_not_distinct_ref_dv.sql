-- Recreate the reference_daily_values unique index with NULLS NOT DISTINCT.
-- Without this, two rows with activity_level=NULL or age_max_months=NULL are
-- treated as unique, which breaks ON CONFLICT DO UPDATE during seeds.

DROP INDEX IF EXISTS "idx_ref_dv_compound_demo_source";--> statement-breakpoint

CREATE UNIQUE INDEX "idx_ref_dv_compound_demo_source"
  ON "reference_daily_values" (
    "compound_id",
    "source_region",
    "age_min_months",
    "age_max_months",
    "sex",
    "life_stage",
    "value_type",
    "activity_level"
  )
  NULLS NOT DISTINCT;
