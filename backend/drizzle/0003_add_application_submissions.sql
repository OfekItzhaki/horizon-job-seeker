-- Create application_submissions table
CREATE TABLE IF NOT EXISTS "application_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"github_url" text,
	"linkedin_url" text,
	"location" text,
	"resume_text" text NOT NULL,
	"bio" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"automation_id" text
);

-- Add foreign key constraint
ALTER TABLE "application_submissions" ADD CONSTRAINT "application_submissions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE no action ON UPDATE no action;
