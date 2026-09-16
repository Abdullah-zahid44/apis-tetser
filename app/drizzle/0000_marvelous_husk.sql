CREATE TABLE "api_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"default_query" jsonb DEFAULT '{}'::jsonb,
	"default_headers" jsonb DEFAULT '{}'::jsonb,
	"default_body" text DEFAULT '' NOT NULL,
	"requires_signature" boolean DEFAULT true NOT NULL,
	"signature_strategy" text DEFAULT 'assanpay-v1' NOT NULL,
	"is_money_movement" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"flag_emoji" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code"),
	CONSTRAINT "countries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "environment_variables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid,
	"environment" text DEFAULT 'all' NOT NULL,
	"key" text NOT NULL,
	"encrypted_value" text DEFAULT '' NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"country_id" uuid,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"endpoint_id" uuid,
	"request_name" text NOT NULL,
	"method" text NOT NULL,
	"url" text NOT NULL,
	"request_headers" jsonb DEFAULT '{}'::jsonb,
	"request_body" text DEFAULT '' NOT NULL,
	"response_status" integer NOT NULL,
	"response_status_text" text DEFAULT '' NOT NULL,
	"response_headers" jsonb DEFAULT '{}'::jsonb,
	"response_body" text DEFAULT '' NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"payload_size" integer DEFAULT 0 NOT NULL,
	"request_id" text DEFAULT '' NOT NULL,
	"signing_status" text DEFAULT 'signed' NOT NULL,
	"error_type" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"country_id" uuid,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"endpoint_id" uuid,
	"name" text NOT NULL,
	"method" text NOT NULL,
	"relative_url" text NOT NULL,
	"query_params" jsonb DEFAULT '{}'::jsonb,
	"headers" jsonb DEFAULT '{}'::jsonb,
	"request_body" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text,
	"role" text DEFAULT 'support' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"country_id" uuid,
	"environment" text DEFAULT 'production' NOT NULL,
	"signature" text DEFAULT '' NOT NULL,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"verification_message" text DEFAULT '' NOT NULL,
	"event_timestamp" text DEFAULT '' NOT NULL,
	"request_headers" jsonb DEFAULT '{}'::jsonb,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"raw_body" text DEFAULT '' NOT NULL,
	"source_ip" text,
	"duplicate" boolean DEFAULT false NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD CONSTRAINT "api_endpoints_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_variables" ADD CONSTRAINT "environment_variables_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_variables" ADD CONSTRAINT "environment_variables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_history" ADD CONSTRAINT "request_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_history" ADD CONSTRAINT "request_history_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_history" ADD CONSTRAINT "request_history_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_requests" ADD CONSTRAINT "saved_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_requests" ADD CONSTRAINT "saved_requests_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_requests" ADD CONSTRAINT "saved_requests_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "endpoints_country_idx" ON "api_endpoints" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "endpoints_category_idx" ON "api_endpoints" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_slug_idx" ON "countries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_code_idx" ON "countries" USING btree ("code");--> statement-breakpoint
CREATE INDEX "env_vars_key_idx" ON "environment_variables" USING btree ("key");--> statement-breakpoint
CREATE INDEX "env_vars_country_idx" ON "environment_variables" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "request_history_user_idx" ON "request_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "request_history_country_idx" ON "request_history" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "request_history_created_idx" ON "request_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "saved_requests_user_idx" ON "saved_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_requests_country_idx" ON "saved_requests" USING btree ("country_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_event_id_idx" ON "webhook_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_country_idx" ON "webhook_events" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "webhook_events_created_idx" ON "webhook_events" USING btree ("created_at");