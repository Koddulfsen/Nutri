-- Note: PHENOL and DUKE were already added to api_source_enum manually
CREATE TABLE "source_afcd_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"afcd_food_key" text NOT NULL,
	"nutrient_index" integer NOT NULL,
	"value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_afcd_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"afcd_food_key" text NOT NULL,
	"classification" text,
	"derivation" text,
	"name" text NOT NULL,
	"description" text,
	"sampling_details" text,
	"nitrogen_factor" real,
	"fat_factor" real,
	"specific_gravity" real,
	"analysed_portion" text,
	"unanalysed_portion" text,
	"raw_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_afcd_foods_afcd_food_key_unique" UNIQUE("afcd_food_key")
);
--> statement-breakpoint
CREATE TABLE "source_afcd_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_index" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"infoods_tagname" text,
	"eurofir_name" text,
	"category" text,
	"is_core" boolean DEFAULT false,
	"description" text,
	"equation" text,
	"reporting_limit" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_afcd_nutrients_nutrient_index_unique" UNIQUE("nutrient_index")
);
