ALTER TYPE "public"."api_source_enum" ADD VALUE 'FRIDA' BEFORE 'NUTRITIONIX';--> statement-breakpoint
CREATE TABLE "source_frida_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" integer NOT NULL,
	"nutrient_id" integer NOT NULL,
	"value" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_frida_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_dk" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_frida_foods_food_id_unique" UNIQUE("food_id")
);
--> statement-breakpoint
CREATE TABLE "source_frida_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"eurofir_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_frida_nutrients_nutrient_id_unique" UNIQUE("nutrient_id")
);
