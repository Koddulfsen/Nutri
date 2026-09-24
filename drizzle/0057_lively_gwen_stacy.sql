ALTER TYPE "public"."dv_type_enum" ADD VALUE 'TWI';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'TDI';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'PTMI';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'RfD';--> statement-breakpoint
ALTER TYPE "public"."dv_type_enum" ADD VALUE 'BMDL';--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "per_kg_body_weight" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reference_daily_values" ADD COLUMN "averaging_days" integer DEFAULT 1 NOT NULL;