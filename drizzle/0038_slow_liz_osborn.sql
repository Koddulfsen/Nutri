CREATE TYPE "public"."activity_level_enum" AS ENUM('SEDENTARY', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');--> statement-breakpoint
CREATE TYPE "public"."regulatory_authority_enum" AS ENUM('FDA_DV', 'EU_NRV', 'CODEX_NRV', 'MEX_NOM051', 'BRA_IDR', 'UK_RI', 'CAN_DV');--> statement-breakpoint
CREATE TYPE "public"."source_type_enum" AS ENUM('SCIENTIFIC_DRI', 'REGULATORY_LABEL');--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'NORDIC';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'DACH';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'ITALY';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'INDIA';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'KOREA';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'TAIWAN';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'RUSSIA';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'WHO_FAO';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'CDRR';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'SDT';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'NRV_R';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'NRV_NCD';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'DV';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'RI';--> statement-breakpoint
ALTER TYPE "public"."life_stage_enum" ADD VALUE 'PREGNANT_T1' BEFORE 'LACTATING';--> statement-breakpoint
ALTER TYPE "public"."life_stage_enum" ADD VALUE 'PREGNANT_T2' BEFORE 'LACTATING';--> statement-breakpoint
ALTER TYPE "public"."life_stage_enum" ADD VALUE 'PREGNANT_T3' BEFORE 'LACTATING';--> statement-breakpoint
ALTER TYPE "public"."life_stage_enum" ADD VALUE 'LACTATING_0_6M';--> statement-breakpoint
ALTER TYPE "public"."life_stage_enum" ADD VALUE 'LACTATING_7_12M';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'NORDIC';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'DACH';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'ITALY';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'INDIA';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'KOREA';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'TAIWAN';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'RUSSIA';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'WHO_FAO';--> statement-breakpoint
CREATE TABLE "dv_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authority_name" text NOT NULL,
	"region_code" text NOT NULL,
	"version_year" integer NOT NULL,
	"source_type" "source_type_enum" NOT NULL,
	"url" text,
	"note" text,
	"retrieved_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatory_daily_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"authority" "regulatory_authority_enum" NOT NULL,
	"source_id" uuid,
	"value_type" "dv_type_enum" NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_ref_dv_compound_demo_source";--> statement-breakpoint
DROP INDEX "idx_ref_dv_demographic";--> statement-breakpoint
ALTER TABLE "reference_daily_values" ALTER COLUMN "age_group" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "age_min_months" integer;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "age_max_months" integer;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "activity_level" "activity_level_enum";--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "value_min" numeric(12, 4);--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "value_max" numeric(12, 4);--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "is_percent_of_energy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "is_provisional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "value_note" text;--> statement-breakpoint
ALTER TABLE "regulatory_daily_values" ADD CONSTRAINT "regulatory_daily_values_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatory_daily_values" ADD CONSTRAINT "regulatory_daily_values_source_id_dv_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."dv_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dv_sources_region_version" ON "dv_sources" USING btree ("region_code","version_year","source_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reg_dv_compound_authority" ON "regulatory_daily_values" USING btree ("compound_id","authority","value_type");--> statement-breakpoint
CREATE INDEX "idx_reg_dv_compound" ON "regulatory_daily_values" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_reg_dv_authority" ON "regulatory_daily_values" USING btree ("authority");--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD CONSTRAINT "reference_daily_values_source_id_dv_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."dv_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ref_dv_age_range" ON "reference_daily_values" USING btree ("age_min_months","age_max_months");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ref_dv_compound_demo_source" ON "reference_daily_values" USING btree ("compound_id","source_region","age_min_months","age_max_months","sex","life_stage","value_type","activity_level");--> statement-breakpoint
CREATE INDEX "idx_ref_dv_demographic" ON "reference_daily_values" USING btree ("sex","life_stage");