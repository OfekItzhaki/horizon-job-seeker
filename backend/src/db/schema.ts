import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Job status enum
export const jobStatusEnum = pgEnum('job_status', ['new', 'rejected', 'approved', 'applied']);

// Jobs table
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  jobUrl: text('job_url').notNull().unique(),
  company: text('company').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  matchScore: integer('match_score'),
  status: jobStatusEnum('status').notNull().default('new'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User profile table
export const userProfile = pgTable('user_profile', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  githubUrl: text('github_url'),
  resumeText: text('resume_text').notNull(),
  bio: text('bio'),
});

// Types
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
