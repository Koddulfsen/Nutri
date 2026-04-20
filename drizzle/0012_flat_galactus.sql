ALTER TABLE "compound_groups" ADD COLUMN "has_dv" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "compounds" ADD COLUMN "has_dv" boolean DEFAULT false NOT NULL;