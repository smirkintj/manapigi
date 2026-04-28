ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "start_date" text;
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "end_date" text;
--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN IF NOT EXISTS "shared_with" text;
