ALTER TABLE "food_approvals" DROP CONSTRAINT "food_approvals_requested_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "food_approvals" DROP CONSTRAINT "food_approvals_reviewed_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "food_approvals" ADD CONSTRAINT "food_approvals_requested_by_user_profiles_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_approvals" ADD CONSTRAINT "food_approvals_reviewed_by_user_profiles_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;