ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "arrival_time" text;
--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "departure_time" text;
--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN IF NOT EXISTS "paid_by" text;
