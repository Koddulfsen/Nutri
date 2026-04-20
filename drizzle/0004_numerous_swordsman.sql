CREATE TYPE "public"."api_source_enum" AS ENUM('CNF', 'FDC', 'FOODB', 'NUTRITIONIX');--> statement-breakpoint
CREATE TYPE "public"."approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED');--> statement-breakpoint
CREATE TABLE "food_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"status" "approval_status_enum" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid,
	"reviewed_by" uuid,
	"review_notes" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "food_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"api_source" "api_source_enum" NOT NULL,
	"api_food_id" text NOT NULL,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merged_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"nutrient_name" text NOT NULL,
	"average_value" numeric(15, 4) NOT NULL,
	"unit" text NOT NULL,
	"source_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrient_source_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merged_nutrient_id" uuid NOT NULL,
	"api_source" "api_source_enum" NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foods" ALTER COLUMN "data_source" SET DEFAULT 'NUTRI';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "common_names" text[];--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "usage_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "food_approvals" ADD CONSTRAINT "food_approvals_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_approvals" ADD CONSTRAINT "food_approvals_requested_by_user_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_approvals" ADD CONSTRAINT "food_approvals_reviewed_by_user_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_sources" ADD CONSTRAINT "food_sources_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_sources" ADD CONSTRAINT "food_sources_verified_by_user_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merged_nutrients" ADD CONSTRAINT "merged_nutrients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrient_source_values" ADD CONSTRAINT "nutrient_source_values_merged_nutrient_id_merged_nutrients_id_fk" FOREIGN KEY ("merged_nutrient_id") REFERENCES "public"."merged_nutrients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_food_approvals_food" ON "food_approvals" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_food_approvals_status" ON "food_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_food_approvals_requester" ON "food_approvals" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "idx_food_sources_food" ON "food_sources" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_food_sources_api" ON "food_sources" USING btree ("api_source");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_food_sources_unique" ON "food_sources" USING btree ("food_id","api_source");--> statement-breakpoint
CREATE INDEX "idx_merged_nutrients_food" ON "merged_nutrients" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_merged_nutrients_nutrient" ON "merged_nutrients" USING btree ("nutrient_name");--> statement-breakpoint
CREATE INDEX "idx_merged_nutrients_food_nutrient" ON "merged_nutrients" USING btree ("food_id","nutrient_name");--> statement-breakpoint
CREATE INDEX "idx_nutrient_sources_merged" ON "nutrient_source_values" USING btree ("merged_nutrient_id");--> statement-breakpoint
CREATE INDEX "idx_nutrient_sources_api" ON "nutrient_source_values" USING btree ("api_source");--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_foods_usage" ON "foods" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "idx_foods_creator" ON "foods" USING btree ("created_by");