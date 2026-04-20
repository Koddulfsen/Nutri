CREATE TYPE "public"."deletion_status_enum" AS ENUM('pending', 'cancelled', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."export_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"status" "deletion_status_enum" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scheduled_deletion_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"status" "export_status_enum" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"download_url" text,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_deletion_requests_status" ON "deletion_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deletion_requests_scheduled" ON "deletion_requests" USING btree ("scheduled_deletion_at");--> statement-breakpoint
CREATE INDEX "idx_deletion_requests_user_id" ON "deletion_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_export_requests_status" ON "export_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_export_requests_user_id" ON "export_requests" USING btree ("user_id");