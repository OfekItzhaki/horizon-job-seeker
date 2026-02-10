ALTER TABLE "user_profile" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "structured_data" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "desired_job_titles" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "desired_locations" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;