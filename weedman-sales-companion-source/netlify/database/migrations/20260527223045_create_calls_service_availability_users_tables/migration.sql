CREATE TABLE "calls" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"outcome" text DEFAULT 'unknown' NOT NULL,
	"stage" text DEFAULT 'unknown' NOT NULL,
	"objection" text DEFAULT 'none' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"called_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_availability" (
	"id" serial PRIMARY KEY,
	"service_id" text NOT NULL,
	"service_name" text NOT NULL,
	"season" text DEFAULT '2026' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"max_slots" integer,
	"used_slots" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"identity_id" text NOT NULL UNIQUE,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'advisor' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");