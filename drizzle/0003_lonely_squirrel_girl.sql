CREATE TYPE "public"."risk_level_enum" AS ENUM('MINIMAL', 'LOW', 'MODERATE', 'HIGH');--> statement-breakpoint
CREATE TABLE "food_compound_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"compound_id" uuid NOT NULL,
	"risk_level" "risk_level_enum" NOT NULL,
	"detection_frequency" real,
	"source" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_compound_flags" ADD CONSTRAINT "food_compound_flags_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_compound_flags" ADD CONSTRAINT "food_compound_flags_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_food_compound_flags_food" ON "food_compound_flags" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "idx_food_compound_flags_compound" ON "food_compound_flags" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_food_compound_flags_risk" ON "food_compound_flags" USING btree ("risk_level");--> statement-breakpoint
ALTER TABLE "public"."compounds" ALTER COLUMN "compound_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."compound_type_enum";--> statement-breakpoint
CREATE TYPE "public"."compound_type_enum" AS ENUM('VITAMIN', 'MINERAL', 'AMINO_ACID', 'NUCLEOTIDE', 'FATTY_ACID', 'CARBOHYDRATE', 'POLYPHENOL', 'CAROTENOID', 'ALKALOID', 'GLUCOSINOLATE', 'TERPENOID', 'MYCOTOXIN', 'PESTICIDE_RESIDUE', 'PLASTICIZER', 'PROCESSING_COMPOUND', 'SYNTHETIC_ADDITIVE', 'ANTI_NUTRIENT');--> statement-breakpoint
ALTER TABLE "public"."compounds" ALTER COLUMN "compound_type" SET DATA TYPE "public"."compound_type_enum" USING "compound_type"::"public"."compound_type_enum";