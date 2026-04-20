-- Remove regulatory infrastructure — flat single-value sources offered no
-- demographic granularity and duplicated what scientific sources already cover
-- at the adult demographic. Keeping regulatory-related dv_sources rows cleaned
-- up here.

DELETE FROM "dv_sources" WHERE "source_type" = 'REGULATORY_LABEL';--> statement-breakpoint
DROP TABLE "regulatory_daily_values" CASCADE;--> statement-breakpoint
DROP TYPE "public"."regulatory_authority_enum";