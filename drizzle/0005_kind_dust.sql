ALTER TABLE "foods" DROP CONSTRAINT "foods_created_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_user_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;