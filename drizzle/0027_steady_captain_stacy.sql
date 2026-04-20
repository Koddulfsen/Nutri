ALTER TYPE "public"."api_source_enum" ADD VALUE 'MATVARETABELLEN' BEFORE 'NUTRITIONIX';--> statement-breakpoint
CREATE TABLE "source_matvaretabellen_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" text NOT NULL,
	"nutrient_id" text NOT NULL,
	"value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_matvaretabellen_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" text NOT NULL,
	"name" text NOT NULL,
	"food_group_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_matvaretabellen_foods_food_id_unique" UNIQUE("food_id")
);
--> statement-breakpoint
CREATE TABLE "source_matvaretabellen_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_id" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"eurofir_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_matvaretabellen_nutrients_nutrient_id_unique" UNIQUE("nutrient_id")
);
