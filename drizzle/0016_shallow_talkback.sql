ALTER TYPE "public"."compound_type_enum" ADD VALUE 'STEROL' BEFORE 'MYCOTOXIN';--> statement-breakpoint
ALTER TYPE "public"."compound_type_enum" ADD VALUE 'ORGANIC_ACID' BEFORE 'MYCOTOXIN';--> statement-breakpoint
ALTER TABLE "compound_sources" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "compound_sources" ADD COLUMN "source_unit" text;--> statement-breakpoint
ALTER TABLE "compound_sources" ADD COLUMN "conversion_factor" text DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "compound_sources" ADD COLUMN "is_canonical" boolean DEFAULT false;