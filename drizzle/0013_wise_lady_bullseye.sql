DROP TABLE "compound_display_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "compound_groups" ADD COLUMN "compound_types" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "compound_groups" ADD COLUMN "compound_names" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "compound_groups" ADD COLUMN "representative_compound" text;