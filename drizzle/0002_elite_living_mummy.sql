CREATE TABLE "food_nutrient_values" (
	"food_id" uuid NOT NULL,
	"compound_id" uuid NOT NULL,
	"source" text NOT NULL,
	"value" numeric(12, 6) NOT NULL,
	"unit" text NOT NULL,
	"confidence_l1" integer NOT NULL,
	"confidence_l2" integer,
	"confidence_l3" integer,
	"confidence_l4" integer,
	"confidence_final" integer NOT NULL,
	"cv_percentage" numeric(5, 2),
	"validation_warnings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_nutrient_values_food_id_compound_id_source_pk" PRIMARY KEY("food_id","compound_id","source")
);
--> statement-breakpoint
CREATE TABLE "food_compound_value_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"compound_id" uuid NOT NULL,
	"source" text NOT NULL,
	"value_before" numeric(12, 6),
	"value_after" numeric(12, 6) NOT NULL,
	"confidence_before" integer,
	"confidence_after" integer NOT NULL,
	"change_reason" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fdc_id" integer,
	"name" text NOT NULL,
	"description" text,
	"food_category_id" uuid,
	"default_portion_type" text,
	"default_portion_size" numeric(10, 2),
	"is_estimated" boolean DEFAULT false NOT NULL,
	"data_source" text NOT NULL,
	"search_vector" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"meal_type" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_log_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"portion_size" numeric(10, 2) NOT NULL,
	"portion_type" text NOT NULL,
	"context_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ag_ui_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"raw_input" text NOT NULL,
	"parsed_output" jsonb,
	"model_used" text NOT NULL,
	"confidence" integer,
	"parse_success" boolean NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooking_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" text NOT NULL,
	"intensity" text,
	"temperature_range" text,
	"duration_range" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cooking_contexts_method_unique" UNIQUE("method")
);
--> statement-breakpoint
CREATE TABLE "daily_totals" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"compounds" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"cache_key" text,
	CONSTRAINT "daily_totals_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "favorite_foods" (
	"user_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_foods_user_id_food_id_pk" PRIMARY KEY("user_id","food_id")
);
--> statement-breakpoint
CREATE TABLE "manual_review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_type" text NOT NULL,
	"item_id" uuid NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_attempts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" uuid,
	"curator_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quarantine_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid,
	"food_data" jsonb NOT NULL,
	"validation_errors" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"severity" text NOT NULL,
	"reviewer_id" uuid,
	"reviewer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saved_meal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"foods" jsonb NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_nutrient_values" ADD CONSTRAINT "food_nutrient_values_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrient_values" ADD CONSTRAINT "food_nutrient_values_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_compound_value_versions" ADD CONSTRAINT "food_compound_value_versions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_compound_value_versions" ADD CONSTRAINT "food_compound_value_versions_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_compound_value_versions" ADD CONSTRAINT "food_compound_value_versions_changed_by_user_profiles_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_food_category_id_food_categories_id_fk" FOREIGN KEY ("food_category_id") REFERENCES "public"."food_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_log_id_meal_logs_id_fk" FOREIGN KEY ("meal_log_id") REFERENCES "public"."meal_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ag_ui_logs" ADD CONSTRAINT "ag_ui_logs_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_totals" ADD CONSTRAINT "daily_totals_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_foods" ADD CONSTRAINT "favorite_foods_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_foods" ADD CONSTRAINT "favorite_foods_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_review_queue" ADD CONSTRAINT "manual_review_queue_assigned_to_user_profiles_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantine_imports" ADD CONSTRAINT "quarantine_imports_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarantine_imports" ADD CONSTRAINT "quarantine_imports_reviewer_id_user_profiles_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_meal_templates" ADD CONSTRAINT "saved_meal_templates_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_food_nutrient_values_compound" ON "food_nutrient_values" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_food_nutrient_values_confidence" ON "food_nutrient_values" USING btree ("confidence_final");--> statement-breakpoint
CREATE INDEX "idx_food_nutrient_values_source" ON "food_nutrient_values" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_food_nutrient_values_warnings" ON "food_nutrient_values" USING gin ("validation_warnings");--> statement-breakpoint
CREATE INDEX "idx_food_versions_food_compound" ON "food_compound_value_versions" USING btree ("food_id","compound_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_food_versions_created" ON "food_compound_value_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_food_versions_changed_by" ON "food_compound_value_versions" USING btree ("changed_by") WHERE "food_compound_value_versions"."changed_by" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_foods_fdc" ON "foods" USING btree ("fdc_id") WHERE "foods"."fdc_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_foods_category" ON "foods" USING btree ("food_category_id") WHERE "foods"."food_category_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_foods_source" ON "foods" USING btree ("data_source");--> statement-breakpoint
CREATE INDEX "idx_foods_name_btree" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_foods_name_gin_trgm" ON "foods" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_foods_fts" ON "foods" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "idx_meal_logs_user_date" ON "meal_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_meal_logs_user_logged" ON "meal_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "idx_meal_logs_active" ON "meal_logs" USING btree ("user_id","is_active") WHERE "meal_logs"."is_active" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_meal_logs_type" ON "meal_logs" USING btree ("meal_type") WHERE "meal_logs"."meal_type" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_meal_items_meal_log" ON "meal_items" USING btree ("meal_log_id");--> statement-breakpoint
CREATE INDEX "idx_meal_items_food" ON "meal_items" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_meal_items_context" ON "meal_items" USING btree ("context_id") WHERE "meal_items"."context_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_ag_ui_logs_user" ON "ag_ui_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ag_ui_logs_created" ON "ag_ui_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ag_ui_logs_success" ON "ag_ui_logs" USING btree ("parse_success");--> statement-breakpoint
CREATE INDEX "idx_cooking_contexts_method" ON "cooking_contexts" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_daily_totals_user_date_desc" ON "daily_totals" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_daily_totals_compounds" ON "daily_totals" USING gin ("compounds");--> statement-breakpoint
CREATE INDEX "idx_favorite_foods_food" ON "favorite_foods" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_manual_review_queue" ON "manual_review_queue" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "idx_manual_review_item" ON "manual_review_queue" USING btree ("item_type","item_id");--> statement-breakpoint
CREATE INDEX "idx_manual_review_assigned" ON "manual_review_queue" USING btree ("assigned_to") WHERE "manual_review_queue"."assigned_to" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_quarantine_status" ON "quarantine_imports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_quarantine_severity" ON "quarantine_imports" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_quarantine_food" ON "quarantine_imports" USING btree ("food_id") WHERE "quarantine_imports"."food_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_quarantine_reviewer" ON "quarantine_imports" USING btree ("reviewer_id") WHERE "quarantine_imports"."reviewer_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_saved_templates_user_active" ON "saved_meal_templates" USING btree ("user_id","is_active") WHERE "saved_meal_templates"."is_active" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_saved_templates_user_usage" ON "saved_meal_templates" USING btree ("user_id","use_count");--> statement-breakpoint
CREATE INDEX "idx_saved_templates_foods" ON "saved_meal_templates" USING gin ("foods");