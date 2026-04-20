ALTER TYPE "public"."api_source_enum" ADD VALUE 'INDB' BEFORE 'NUTRITIONIX';--> statement-breakpoint
CREATE TABLE "source_indb_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" text NOT NULL,
	"nutrient_code" text NOT NULL,
	"value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_indb_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" text NOT NULL,
	"name" text NOT NULL,
	"food_group" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_indb_foods_food_id_unique" UNIQUE("food_id")
);
--> statement-breakpoint
CREATE TABLE "source_indb_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_code" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_indb_nutrients_nutrient_code_unique" UNIQUE("nutrient_code")
);
