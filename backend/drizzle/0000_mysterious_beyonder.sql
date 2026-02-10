DO $$ BEGIN
 CREATE TYPE "job_status" AS ENUM('new', 'rejected', 'approved', 'applied');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_url" text NOT NULL,
	"company" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"match_score" integer,
	"status" "job_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_job_url_unique" UNIQUE("job_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"github_url" text,
	"resume_text" text NOT NULL,
	"bio" text
);
