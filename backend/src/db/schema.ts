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
  linkedinUrl: text('linkedin_url'),
  location: text('location'),
  
  // Resume data - can be plain text or structured
  resumeText: text('resume_text').notNull(),
  
  // Structured profile data (JSON)
  // Format: { jobTitles: [{title, company, duration, responsibilities, achievements}], skills: [], education: [] }
  structuredData: text('structured_data'), // JSON string
  
  // Professional summary
  bio: text('bio'),
  
  // Search preferences
  desiredJobTitles: text('desired_job_titles'), // Comma-separated
  desiredLocations: text('desired_locations'), // Comma-separated
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Structured profile data types
export interface WorkExperience {
  title: string;
  company: string;
  duration: string; // e.g., "Jan 2020 - Present"
  responsibilities: string[];
  achievements: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface StructuredProfileData {
  workExperience: WorkExperience[];
  skills: string[];
  education: Education[];
  certifications?: string[];
  languages?: string[];
}

// Types
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
