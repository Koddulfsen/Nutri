CREATE TYPE "public"."age_group_enum" AS ENUM('INFANT_0_6M', 'INFANT_7_12M', 'CHILD_1_3Y', 'CHILD_4_8Y', 'CHILD_9_13Y', 'TEEN_14_18Y', 'ADULT_19_30Y', 'ADULT_31_50Y', 'ADULT_51_70Y', 'ADULT_71_PLUS');--> statement-breakpoint
CREATE TYPE "public"."biological_sex_enum" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."dv_source_preference_enum" AS ENUM('AVERAGE', 'USA_CANADA', 'EU', 'UK', 'JAPAN', 'CHINA', 'AU_NZ');--> statement-breakpoint
CREATE TYPE "public"."dv_type_enum" AS ENUM('RDA', 'AI', 'UL', 'EAR', 'AMDR');--> statement-breakpoint
CREATE TYPE "public"."life_stage_enum" AS ENUM('NONE', 'PREGNANT', 'LACTATING');--> statement-breakpoint
CREATE TYPE "public"."source_region_enum" AS ENUM('USA_CANADA', 'EU', 'UK', 'JAPAN', 'CHINA', 'AU_NZ');--> statement-breakpoint
CREATE TABLE "compound_display_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid,
	"group_id" uuid,
	"show_progress_bar" boolean DEFAULT false NOT NULL,
	"display_priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_daily_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"source_region" "source_region_enum" NOT NULL,
	"age_group" "age_group_enum" NOT NULL,
	"sex" "biological_sex_enum" NOT NULL,
	"life_stage" "life_stage_enum" DEFAULT 'NONE' NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"unit" text NOT NULL,
	"value_type" "dv_type_enum" DEFAULT 'RDA' NOT NULL,
	"source_url" text,
	"source_note" text,
	"last_updated" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_custom_daily_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"compound_id" uuid NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"unit" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "biological_sex" "biological_sex_enum";--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "life_stage" "life_stage_enum" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "manual_age_group" "age_group_enum";--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "dv_source_preference" "dv_source_preference_enum" DEFAULT 'AVERAGE' NOT NULL;--> statement-breakpoint
ALTER TABLE "compound_display_settings" ADD CONSTRAINT "compound_display_settings_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compound_display_settings" ADD CONSTRAINT "compound_display_settings_group_id_compound_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."compound_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD CONSTRAINT "reference_daily_values_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_daily_values" ADD CONSTRAINT "user_custom_daily_values_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_daily_values" ADD CONSTRAINT "user_custom_daily_values_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_display_settings_compound" ON "compound_display_settings" USING btree ("compound_id") WHERE "compound_display_settings"."compound_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_display_settings_group" ON "compound_display_settings" USING btree ("group_id") WHERE "compound_display_settings"."group_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_display_settings_priority" ON "compound_display_settings" USING btree ("display_priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ref_dv_compound_demo_source" ON "reference_daily_values" USING btree ("compound_id","source_region","age_group","sex","life_stage");--> statement-breakpoint
CREATE INDEX "idx_ref_dv_compound" ON "reference_daily_values" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_ref_dv_source" ON "reference_daily_values" USING btree ("source_region");--> statement-breakpoint
CREATE INDEX "idx_ref_dv_demographic" ON "reference_daily_values" USING btree ("age_group","sex","life_stage");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_custom_dv_unique" ON "user_custom_daily_values" USING btree ("user_id","compound_id");--> statement-breakpoint
CREATE INDEX "idx_user_custom_dv_user" ON "user_custom_daily_values" USING btree ("user_id");