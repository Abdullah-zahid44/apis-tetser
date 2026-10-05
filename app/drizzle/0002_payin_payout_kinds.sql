ALTER TABLE "request_history" ADD COLUMN "kind" text NOT NULL DEFAULT 'other';
--> statement-breakpoint
UPDATE "request_history" rh SET "kind" = CASE WHEN e."category" = 'Payin' THEN 'payin' WHEN e."category" = 'Payout' THEN 'payout' ELSE 'other' END FROM "api_endpoints" e WHERE rh."endpoint_id" = e."id";
--> statement-breakpoint
CREATE INDEX "request_history_kind_idx" ON "request_history" USING btree ("kind");
--> statement-breakpoint
UPDATE "request_history" SET "kind" = 'payout' WHERE "kind" = 'other' AND "url" ILIKE '%payout%';
--> statement-breakpoint
UPDATE "request_history" SET "kind" = 'payin' WHERE "kind" = 'other' AND "url" ILIKE '%payin%';
