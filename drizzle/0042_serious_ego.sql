ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'SINGAPORE';--> statement-breakpoint
ALTER TYPE "public"."dv_source_preference_enum" ADD VALUE 'SPAIN';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'SINGAPORE';--> statement-breakpoint
ALTER TYPE "public"."source_region_enum" ADD VALUE 'SPAIN';--> statement-breakpoint
CREATE TABLE "compound_food_sanity_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"verdict" text NOT NULL,
	"confidence" text NOT NULL,
	"expected_low" numeric,
	"expected_high" numeric,
	"typical_value" numeric,
	"unit" text NOT NULL,
	"our_value_at_check" numeric NOT NULL,
	"sources" jsonb NOT NULL,
	"note" text,
	"checked_by" uuid,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compound_food_sanity_checks" ADD CONSTRAINT "compound_food_sanity_checks_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compound_food_sanity_checks" ADD CONSTRAINT "compound_food_sanity_checks_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cfsc_compound_food_uniq" ON "compound_food_sanity_checks" USING btree ("compound_id","food_id");--> statement-breakpoint
CREATE INDEX "idx_cfsc_verdict" ON "compound_food_sanity_checks" USING btree ("verdict");