CREATE TABLE "compound_source_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_source_id" uuid NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compound_source_verifications" ADD CONSTRAINT "compound_source_verifications_compound_source_id_compound_sources_id_fk" FOREIGN KEY ("compound_source_id") REFERENCES "public"."compound_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_csv_compound_source_uniq" ON "compound_source_verifications" USING btree ("compound_source_id");--> statement-breakpoint
CREATE INDEX "idx_csv_status" ON "compound_source_verifications" USING btree ("status");