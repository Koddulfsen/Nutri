CREATE TYPE "public"."audit_action_enum" AS ENUM('LOGIN', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'CONSENT_CHANGE');--> statement-breakpoint
CREATE TYPE "public"."compound_type_enum" AS ENUM('VITAMIN', 'MINERAL', 'AMINO_ACID', 'FATTY_ACID', 'POLYPHENOL', 'CAROTENOID', 'GLUCOSINOLATE', 'ANTI_NUTRIENT', 'PROCESSING_COMPOUND', 'SYNTHETIC_ADDITIVE', 'PERFORMANCE_COMPOUND', 'NICHE_HEALTH');--> statement-breakpoint
CREATE TYPE "public"."evidence_level_enum" AS ENUM('TIER_1_RCT', 'TIER_2_OBSERVATIONAL', 'TIER_3_FDA_LABEL', 'TIER_4_THEORETICAL');--> statement-breakpoint
CREATE TYPE "public"."severity_level_enum" AS ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "audit_action_enum" NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_category_id" uuid,
	"level" integer NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_check" CHECK ("food_categories"."level" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "compound_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"external_source" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_type" "compound_type_enum" NOT NULL,
	"name" text NOT NULL,
	"alternate_names" text[] DEFAULT ARRAY[]::text[],
	"unit" text NOT NULL,
	"parent_compound_id" uuid,
	"description" text,
	"health_concern_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"formation_conditions" jsonb,
	"iarc_group" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compound_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"citation_id" uuid NOT NULL,
	"citable_type" text NOT NULL,
	"citable_id" uuid NOT NULL,
	"context" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pmid" integer NOT NULL,
	"study_design" text NOT NULL,
	"sample_size" integer,
	"quality_score_total" integer NOT NULL,
	"year" integer NOT NULL,
	"authors" text NOT NULL,
	"title" text NOT NULL,
	"journal" text NOT NULL,
	"abstract" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "research_citations_pmid_unique" UNIQUE("pmid"),
	CONSTRAINT "sample_size_check" CHECK ("research_citations"."sample_size" >= 0 OR "research_citations"."sample_size" IS NULL),
	CONSTRAINT "quality_check" CHECK ("research_citations"."quality_score_total" BETWEEN 0 AND 18),
	CONSTRAINT "year_check" CHECK ("research_citations"."year" BETWEEN 1900 AND 2100)
);
--> statement-breakpoint
CREATE TABLE "medication_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"medication_name" text NOT NULL,
	"interaction_description" text NOT NULL,
	"severity" "severity_level_enum" NOT NULL,
	"evidence_level" "evidence_level_enum" NOT NULL,
	"clinical_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compound_validation_ranges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"min_value" numeric(12, 6),
	"max_value" numeric(12, 6),
	"warn_threshold" numeric(12, 6),
	"reject_threshold" numeric(12, 6),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compound_validation_ranges_compound_id_unique" UNIQUE("compound_id")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"name" text,
	"rate_limit" integer DEFAULT 500 NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"newsletter" boolean DEFAULT false NOT NULL,
	"push_notifications" boolean DEFAULT false NOT NULL,
	"research" boolean DEFAULT false NOT NULL,
	"analytics" boolean DEFAULT false NOT NULL,
	"third_party" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_consent_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"data_encryption_key" text NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"dashboard_widgets" jsonb DEFAULT '{"staple": ["rda_snapshot", "recent_meals", "compound_trends"], "custom": []}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_parent_category_id_food_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."food_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compound_sources" ADD CONSTRAINT "compound_sources_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compounds" ADD CONSTRAINT "compounds_parent_compound_id_compounds_id_fk" FOREIGN KEY ("parent_compound_id") REFERENCES "public"."compounds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compound_citations" ADD CONSTRAINT "compound_citations_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compound_citations" ADD CONSTRAINT "compound_citations_citation_id_research_citations_id_fk" FOREIGN KEY ("citation_id") REFERENCES "public"."research_citations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_interactions" ADD CONSTRAINT "medication_interactions_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compound_validation_ranges" ADD CONSTRAINT "compound_validation_ranges_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_time" ON "audit_log" USING btree ("user_id","created_at" DESC NULLS LAST) WHERE "audit_log"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_resource" ON "audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_created" ON "audit_log" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_log_metadata" ON "audit_log" USING gin ("metadata") WHERE jsonb_typeof("audit_log"."metadata") = 'object';--> statement-breakpoint
CREATE INDEX "idx_food_categories_parent" ON "food_categories" USING btree ("parent_category_id") WHERE "food_categories"."parent_category_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_food_categories_level" ON "food_categories" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_compound_sources_compound" ON "compound_sources" USING btree ("compound_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_compound_sources_external" ON "compound_sources" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "idx_compounds_type" ON "compounds" USING btree ("compound_type");--> statement-breakpoint
CREATE INDEX "idx_compounds_parent" ON "compounds" USING btree ("parent_compound_id") WHERE "compounds"."parent_compound_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_compounds_health_flags" ON "compounds" USING gin ("health_concern_flags") WHERE jsonb_typeof("compounds"."health_concern_flags") = 'object';--> statement-breakpoint
CREATE INDEX "idx_compound_citations_compound" ON "compound_citations" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_compound_citations_citation" ON "compound_citations" USING btree ("citation_id");--> statement-breakpoint
CREATE INDEX "idx_compound_citations_polymorphic" ON "compound_citations" USING btree ("citable_type","citable_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_research_citations_pmid" ON "research_citations" USING btree ("pmid");--> statement-breakpoint
CREATE INDEX "idx_research_citations_quality" ON "research_citations" USING btree ("quality_score_total" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_research_citations_year" ON "research_citations" USING btree ("year" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_medication_interactions_compound" ON "medication_interactions" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_medication_interactions_severity" ON "medication_interactions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_medication_interactions_medication" ON "medication_interactions" USING btree ("medication_name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_compound_validation_compound" ON "compound_validation_ranges" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_user" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "idx_api_keys_active" ON "api_keys" USING btree ("user_id") WHERE "api_keys"."is_revoked" = FALSE AND ("api_keys"."expires_at" IS NULL OR "api_keys"."expires_at" > NOW());--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_consent_user" ON "user_consent" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_profiles_user" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_widgets" ON "user_profiles" USING gin ("dashboard_widgets") WHERE jsonb_typeof("user_profiles"."dashboard_widgets") = 'object';