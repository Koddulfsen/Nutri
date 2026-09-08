CREATE TYPE "public"."food_visibility_enum" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"composite_food_id" uuid NOT NULL,
	"component_food_id" uuid NOT NULL,
	"grams" numeric(10, 2) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_components_grams_positive" CHECK ("food_components"."grams" > 0),
	CONSTRAINT "food_components_no_self_reference" CHECK ("food_components"."composite_food_id" <> "food_components"."component_food_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_cnf_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"symbol" text,
	"tagname" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_cnf_nutrients_nutrient_id_unique" UNIQUE("nutrient_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_fdc_nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nutrient_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"nutrient_nbr" text,
	"rank" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_fdc_nutrients_nutrient_id_unique" UNIQUE("nutrient_id")
);--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "visibility" "food_visibility_enum" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "food_components" ADD CONSTRAINT "food_components_composite_food_id_foods_id_fk" FOREIGN KEY ("composite_food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_components" ADD CONSTRAINT "food_components_component_food_id_foods_id_fk" FOREIGN KEY ("component_food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_food_components_composite" ON "food_components" USING btree ("composite_food_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_food_components_component" ON "food_components" USING btree ("component_food_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_food_components_composite_position" ON "food_components" USING btree ("composite_food_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_foods_visibility" ON "foods" USING btree ("visibility");
