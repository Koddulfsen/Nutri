CREATE TYPE "public"."symptom_category_enum" AS ENUM('ENERGY_MENTAL', 'DIGESTIVE', 'PHYSICAL');--> statement-breakpoint
CREATE TABLE "symptom_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "symptom_category_enum" NOT NULL,
	"description" text,
	"icon" text,
	"user_id" uuid,
	"is_system_defined" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptom_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symptom_definition_id" uuid NOT NULL,
	"date" date NOT NULL,
	"intensity" integer NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "symptom_definitions" ADD CONSTRAINT "symptom_definitions_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_symptom_definition_id_symptom_definitions_id_fk" FOREIGN KEY ("symptom_definition_id") REFERENCES "public"."symptom_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_symptom_definitions_slug_user" ON "symptom_definitions" USING btree ("slug","user_id");--> statement-breakpoint
CREATE INDEX "idx_symptom_definitions_category" ON "symptom_definitions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_symptom_definitions_user" ON "symptom_definitions" USING btree ("user_id") WHERE "symptom_definitions"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_symptom_definitions_active" ON "symptom_definitions" USING btree ("is_active") WHERE "symptom_definitions"."is_active" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_symptom_definitions_system" ON "symptom_definitions" USING btree ("is_system_defined") WHERE "symptom_definitions"."is_system_defined" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_symptom_logs_user_date" ON "symptom_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_symptom_logs_symptom" ON "symptom_logs" USING btree ("symptom_definition_id");--> statement-breakpoint
CREATE INDEX "idx_symptom_logs_user_logged" ON "symptom_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "idx_symptom_logs_active" ON "symptom_logs" USING btree ("user_id","is_active") WHERE "symptom_logs"."is_active" = TRUE;