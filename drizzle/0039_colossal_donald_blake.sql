CREATE TYPE "public"."dietary_context_enum" AS ENUM('PHYTATE_LOW', 'PHYTATE_MED_LOW', 'PHYTATE_MED_HIGH', 'PHYTATE_HIGH');--> statement-breakpoint
DROP INDEX "idx_ref_dv_compound_demo_source";--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "dietary_context" "dietary_context_enum";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ref_dv_compound_demo_source" ON "reference_daily_values" USING btree ("compound_id","source_region","age_min_months","age_max_months","sex","life_stage","value_type","activity_level","dietary_context") NULLS NOT DISTINCT;
