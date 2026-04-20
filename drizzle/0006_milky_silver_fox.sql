ALTER TABLE "food_sources" DROP CONSTRAINT "food_sources_verified_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "food_sources" ADD CONSTRAINT "food_sources_verified_by_user_profiles_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE set null ON UPDATE no action;