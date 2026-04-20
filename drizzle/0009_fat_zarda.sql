ALTER TABLE "merged_nutrients" ALTER COLUMN "nutrient_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "merged_nutrients" ADD COLUMN "compound_id" uuid;--> statement-breakpoint
ALTER TABLE "merged_nutrients" ADD CONSTRAINT "merged_nutrients_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_merged_nutrients_compound" ON "merged_nutrients" USING btree ("compound_id");--> statement-breakpoint
CREATE INDEX "idx_merged_nutrients_food_compound" ON "merged_nutrients" USING btree ("food_id","compound_id");