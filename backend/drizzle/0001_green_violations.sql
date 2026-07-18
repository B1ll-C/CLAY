-- `auth.users` is owned by Supabase Auth and already exists — drizzle-kit
-- has no "existing table" flag, so the CREATE TABLE it generated here for
-- `auth.users` (modeled only so `public.users` can FK against it) has been
-- removed by hand. Only the ALTER TABLEs below actually need to run.
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";