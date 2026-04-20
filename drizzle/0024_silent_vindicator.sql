ALTER TYPE "public"."api_source_enum" ADD VALUE 'BLS' BEFORE 'NUTRITIONIX';--> statement-breakpoint
CREATE TABLE "source_bls_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_code" text NOT NULL,
	"nutrient_code" text NOT NULL,
	"value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_bls_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_code" text NOT NULL,
	"name" text NOT NULL,
	"name_de" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_bls_foods_food_code_unique" UNIQUE("food_code")
);
--> statement-breakpoint
CREATE TABLE "source_bls_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_code" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_bls_nutrients_nutrient_code_unique" UNIQUE("nutrient_code")
);
