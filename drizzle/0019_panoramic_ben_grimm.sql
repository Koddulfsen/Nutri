CREATE TYPE "public"."compound_tier_enum" AS ENUM('core', 'advanced');--> statement-breakpoint
ALTER TYPE "public"."api_source_enum" ADD VALUE 'AFCD' BEFORE 'NUTRITIONIX';--> statement-breakpoint
ALTER TABLE "compounds" ADD COLUMN "tier" "compound_tier_enum" DEFAULT 'advanced' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_compounds_tier" ON "compounds" USING btree ("tier");