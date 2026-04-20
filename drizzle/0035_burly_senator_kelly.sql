CREATE TYPE "public"."origin_type_enum" AS ENUM('animal', 'plant', 'fungi', 'composite', 'supplement', 'other');--> statement-breakpoint
CREATE TABLE "food_portions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"description" text NOT NULL,
	"gram_weight" numeric(10, 2) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gram_weight_positive" CHECK ("food_portions"."gram_weight" > 0)
);
--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "food_family" text;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "variety" text;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "part" text;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "preparation" text;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "qualifiers" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "origin_type" "origin_type_enum";--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "is_composite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "scientific_name" text;--> statement-breakpoint
ALTER TABLE "food_portions" ADD CONSTRAINT "food_portions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_food_portions_food" ON "food_portions" USING btree ("food_id");