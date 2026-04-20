CREATE TABLE "compound_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_group_id" uuid,
	"level" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"icon" text,
	"path" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compound_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "compounds" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "compound_groups" ADD CONSTRAINT "compound_groups_parent_group_id_compound_groups_id_fk" FOREIGN KEY ("parent_group_id") REFERENCES "public"."compound_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_compound_groups_parent" ON "compound_groups" USING btree ("parent_group_id");--> statement-breakpoint
CREATE INDEX "idx_compound_groups_level" ON "compound_groups" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_compound_groups_path" ON "compound_groups" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_compound_groups_order" ON "compound_groups" USING btree ("parent_group_id","display_order");--> statement-breakpoint
ALTER TABLE "compounds" ADD CONSTRAINT "compounds_group_id_compound_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."compound_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_compounds_group" ON "compounds" USING btree ("group_id") WHERE "compounds"."group_id" IS NOT NULL;