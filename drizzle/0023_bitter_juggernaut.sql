ALTER TYPE "public"."api_source_enum" ADD VALUE 'CIQUAL' BEFORE 'NUTRITIONIX';--> statement-breakpoint
CREATE TABLE "source_ciqual_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" integer NOT NULL,
	"nutrient_code" text NOT NULL,
	"value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_ciqual_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"food_group" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_ciqual_foods_food_id_unique" UNIQUE("food_id")
);
--> statement-breakpoint
CREATE TABLE "source_ciqual_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_code" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_ciqual_nutrients_nutrient_code_unique" UNIQUE("nutrient_code")
);
