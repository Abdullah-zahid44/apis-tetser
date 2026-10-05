ALTER TABLE "environment_variables" ADD COLUMN "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "environment_variables" SET "user_id" = "created_by" WHERE "created_by" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "env_vars_user_idx" ON "environment_variables" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "user_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
