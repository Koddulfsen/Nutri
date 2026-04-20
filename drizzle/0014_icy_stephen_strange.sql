CREATE TYPE "public"."external_source" AS ENUM('foodb', 'duke', 'phenol_explorer', 'usda', 'cnf');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'auto_matched', 'ai_matched', 'verified', 'no_match');--> statement-breakpoint
CREATE TABLE "source_duke_chemicals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chem_id" text NOT NULL,
	"name" text NOT NULL,
	"cas_number" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_duke_chemicals_chem_id_unique" UNIQUE("chem_id")
);
--> statement-breakpoint
CREATE TABLE "source_duke_farmacy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fnf_num" text NOT NULL,
	"chem_id" text NOT NULL,
	"plant_part" text,
	"amount_low" real,
	"amount_high" real,
	"unit" text,
	"reference" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_duke_plants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fnf_num" text NOT NULL,
	"latin_name" text NOT NULL,
	"common_name" text,
	"family" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_duke_plants_fnf_num_unique" UNIQUE("fnf_num")
);
--> statement-breakpoint
CREATE TABLE "external_compound_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid,
	"external_source" "external_source" NOT NULL,
	"external_id" text NOT NULL,
	"external_name" text NOT NULL,
	"match_status" "match_status" DEFAULT 'pending' NOT NULL,
	"match_confidence" real,
	"match_method" text,
	"matched_at" timestamp with time zone,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_data_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "external_source" NOT NULL,
	"import_type" text NOT NULL,
	"status" text NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_imported" integer DEFAULT 0,
	"records_skipped" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_log" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "external_food_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid,
	"external_source" "external_source" NOT NULL,
	"external_id" text NOT NULL,
	"external_name" text NOT NULL,
	"match_status" "match_status" DEFAULT 'pending' NOT NULL,
	"match_confidence" real,
	"match_method" text,
	"matched_at" timestamp with time zone,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_foodb_compounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foodb_id" integer NOT NULL,
	"public_id" text,
	"name" text NOT NULL,
	"cas_number" text,
	"moldb_inchikey" text,
	"moldb_smiles" text,
	"kingdom" text,
	"superclass" text,
	"klass" text,
	"subclass" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_foodb_compounds_foodb_id_unique" UNIQUE("foodb_id")
);
--> statement-breakpoint
CREATE TABLE "source_foodb_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foodb_id" integer NOT NULL,
	"foodb_food_id" integer NOT NULL,
	"foodb_compound_id" integer NOT NULL,
	"source_type" text,
	"orig_food_name" text,
	"orig_content" real,
	"orig_unit" text,
	"standard_content" real,
	"preparation_type" text,
	"citation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_foodb_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foodb_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_scientific" text,
	"description" text,
	"food_group" text,
	"food_subgroup" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_foodb_foods_foodb_id_unique" UNIQUE("foodb_id")
);
--> statement-breakpoint
CREATE TABLE "source_phenol_compounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phenol_id" integer NOT NULL,
	"name" text NOT NULL,
	"compound_class" text,
	"compound_subclass" text,
	"molecular_weight" real,
	"cas_number" text,
	"chebi_id" text,
	"pubchem_id" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_phenol_compounds_phenol_id_unique" UNIQUE("phenol_id")
);
--> statement-breakpoint
CREATE TABLE "source_phenol_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phenol_food_id" integer NOT NULL,
	"phenol_compound_id" integer NOT NULL,
	"content_mean" real,
	"content_min" real,
	"content_max" real,
	"unit" text,
	"publication_count" integer,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_phenol_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phenol_id" integer NOT NULL,
	"name" text NOT NULL,
	"food_group" text,
	"food_subgroup" text,
	"scientific_name" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_phenol_foods_phenol_id_unique" UNIQUE("phenol_id")
);
--> statement-breakpoint
CREATE INDEX "idx_duke_chemicals_name" ON "source_duke_chemicals" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_duke_chemicals_cas" ON "source_duke_chemicals" USING btree ("cas_number") WHERE "source_duke_chemicals"."cas_number" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_duke_chemicals_name_trgm" ON "source_duke_chemicals" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_duke_farmacy_plant" ON "source_duke_farmacy" USING btree ("fnf_num");--> statement-breakpoint
CREATE INDEX "idx_duke_farmacy_chem" ON "source_duke_farmacy" USING btree ("chem_id");--> statement-breakpoint
CREATE INDEX "idx_duke_farmacy_plant_chem" ON "source_duke_farmacy" USING btree ("fnf_num","chem_id");--> statement-breakpoint
CREATE INDEX "idx_duke_plants_latin" ON "source_duke_plants" USING btree ("latin_name");--> statement-breakpoint
CREATE INDEX "idx_duke_plants_common" ON "source_duke_plants" USING btree ("common_name") WHERE "source_duke_plants"."common_name" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_duke_plants_latin_trgm" ON "source_duke_plants" USING gin ("latin_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_ext_compound_map_compound" ON "external_compound_mappings" USING btree ("compound_id") WHERE "external_compound_mappings"."compound_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ext_compound_map_external" ON "external_compound_mappings" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "idx_ext_compound_map_status" ON "external_compound_mappings" USING btree ("match_status");--> statement-breakpoint
CREATE INDEX "idx_ext_compound_map_name_trgm" ON "external_compound_mappings" USING gin ("external_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_imports_source" ON "external_data_imports" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_imports_status" ON "external_data_imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ext_food_map_food" ON "external_food_mappings" USING btree ("food_id") WHERE "external_food_mappings"."food_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ext_food_map_external" ON "external_food_mappings" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "idx_ext_food_map_status" ON "external_food_mappings" USING btree ("match_status");--> statement-breakpoint
CREATE INDEX "idx_ext_food_map_name_trgm" ON "external_food_mappings" USING gin ("external_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_foodb_compounds_name" ON "source_foodb_compounds" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_foodb_compounds_cas" ON "source_foodb_compounds" USING btree ("cas_number") WHERE "source_foodb_compounds"."cas_number" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_foodb_compounds_inchikey" ON "source_foodb_compounds" USING btree ("moldb_inchikey") WHERE "source_foodb_compounds"."moldb_inchikey" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_foodb_compounds_name_trgm" ON "source_foodb_compounds" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_foodb_content_food" ON "source_foodb_content" USING btree ("foodb_food_id");--> statement-breakpoint
CREATE INDEX "idx_foodb_content_compound" ON "source_foodb_content" USING btree ("foodb_compound_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_foodb_content_food_compound" ON "source_foodb_content" USING btree ("foodb_food_id","foodb_compound_id","preparation_type");--> statement-breakpoint
CREATE INDEX "idx_foodb_foods_name" ON "source_foodb_foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_foodb_foods_name_trgm" ON "source_foodb_foods" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_foodb_foods_group" ON "source_foodb_foods" USING btree ("food_group");--> statement-breakpoint
CREATE INDEX "idx_phenol_compounds_name" ON "source_phenol_compounds" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_phenol_compounds_class" ON "source_phenol_compounds" USING btree ("compound_class");--> statement-breakpoint
CREATE INDEX "idx_phenol_compounds_cas" ON "source_phenol_compounds" USING btree ("cas_number") WHERE "source_phenol_compounds"."cas_number" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_phenol_compounds_name_trgm" ON "source_phenol_compounds" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_phenol_content_food" ON "source_phenol_content" USING btree ("phenol_food_id");--> statement-breakpoint
CREATE INDEX "idx_phenol_content_compound" ON "source_phenol_content" USING btree ("phenol_compound_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_phenol_content_food_compound" ON "source_phenol_content" USING btree ("phenol_food_id","phenol_compound_id");--> statement-breakpoint
CREATE INDEX "idx_phenol_foods_name" ON "source_phenol_foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_phenol_foods_group" ON "source_phenol_foods" USING btree ("food_group");--> statement-breakpoint
CREATE INDEX "idx_phenol_foods_name_trgm" ON "source_phenol_foods" USING gin ("name" gin_trgm_ops);