# Requirements Document

## Introduction

The Human-in-the-Loop Job Search & Application Agent is a system that automates job discovery, scoring, and application submission while maintaining human oversight at critical decision points. The system scrapes job postings from LinkedIn and Indeed, scores them against a user profile, presents high-scoring opportunities to the user, and assists with form filling while requiring manual confirmation before final submission.

## Glossary

- **System**: The Human-in-the-Loop Job Search & Application Agent
- **Background_Worker**: The component that scrapes job postings from external sources
- **Scoring_Engine**: The component that evaluates job matches using GPT-4o-mini
- **Dashboard**: The web interface where users review and manage job opportunities
- **Automation_Engine**: The component that uses Playwright and AgentQL to fill application forms
- **User_Profile**: The stored user information including resume, contact details, and links
- **Job_Record**: A database entry representing a discovered job opportunity
- **Canonical_ID**: A unique identifier derived from company name and job title to prevent duplicates
- **Match_Score**: A numerical value (0-100) indicating how well a job matches the user profile
- **Kill_Switch**: An emergency control to immediately terminate browser automation

## Requirements

### Requirement 1: Job Discovery and Deduplication

**User Story:** As a job seeker, I want the system to automatically discover relevant job postings, so that I don't have to manually search multiple job boards.

#### Acceptance Criteria

1. THE Background_Worker SHALL scrape job postings from LinkedIn and Indeed for "Full Stack Developer" roles
2. WHEN a job posting is discovered, THE Background_Worker SHALL extract the job URL, company name, job title, and description
3. WHEN processing a discovered job, THE System SHALL generate a Canonical_ID by creating a slug from the company name and job title
4. WHEN a job with an existing Canonical_ID is encountered, THE System SHALL skip insertion and prevent duplicate entries
5. WHEN a new unique job is identified, THE System SHALL insert it into the jobs table with status 'new'
6. THE Background_Worker SHALL implement a 30-second delay between scrape requests to avoid IP bans

### Requirement 2: Job Scoring and Matching

**User Story:** As a job seeker, I want jobs to be automatically scored based on how well they match my profile, so that I can focus on the most relevant opportunities.

#### Acceptance Criteria

1. WHEN a new Job_Record is created, THE Scoring_Engine SHALL retrieve the user's resume text from the User_Profile table
2. WHEN scoring a job, THE Scoring_Engine SHALL send the job description and resume text to GPT-4o-mini
3. WHEN GPT-4o-mini returns a response, THE Scoring_Engine SHALL extract a Match_Score value between 0 and 100
4. WHEN a Match_Score is obtained, THE System SHALL store it in the match_score field of the Job_Record
5. IF the scoring request fails, THEN THE System SHALL log the error and set match_score to null

### Requirement 3: User Profile Management

**User Story:** As a job seeker, I want to store my profile information once, so that it can be reused across all job applications.

#### Acceptance Criteria

1. THE System SHALL store user profile data in the user_profile table with fields: id, full_name, email, phone, github_url, resume_text, and bio
2. WHEN the user updates their profile, THE System SHALL validate that email is in valid email format
3. WHEN the user updates their profile, THE System SHALL persist all changes to the database immediately
4. THE System SHALL support storing resume text up to 50,000 characters

### Requirement 4: Dashboard and Job Review

**User Story:** As a job seeker, I want to see a list of high-scoring jobs with the ability to approve or dismiss them, so that I can quickly triage opportunities.

#### Acceptance Criteria

1. WHEN the user accesses the Dashboard, THE System SHALL display all Job_Records with status 'new' ordered by match_score descending
2. WHEN displaying a job card, THE System SHALL show the company name, job title, match_score, and a preview of the description
3. WHEN the user clicks "Proceed" on a job card, THE System SHALL update the job status to 'approved' and trigger the Automation_Engine
4. WHEN the user clicks "Dismiss" on a job card, THE System SHALL update the job status to 'rejected'
5. THE Dashboard SHALL refresh the job list after status changes to reflect current state

### Requirement 5: Automated Form Filling

**User Story:** As a job seeker, I want the system to automatically fill out application forms using my profile data, so that I can save time on repetitive data entry.

#### Acceptance Criteria

1. WHEN a job is approved, THE Automation_Engine SHALL launch a Playwright browser instance in non-headless mode (headless: false)
2. WHEN the browser launches, THE Automation_Engine SHALL navigate to the job_url from the Job_Record
3. WHEN the page loads, THE Automation_Engine SHALL use an LLM to identify form fields for Name, Email, Phone, GitHub URL, and Resume Upload
4. WHEN form fields are identified, THE Automation_Engine SHALL fill the Name field with user_profile.full_name
5. WHEN form fields are identified, THE Automation_Engine SHALL fill the Email field with user_profile.email
6. WHEN form fields are identified, THE Automation_Engine SHALL fill the Phone field with user_profile.phone
7. WHERE a GitHub URL field exists, THE Automation_Engine SHALL fill it with user_profile.github_url
8. WHERE a Resume Upload field exists, THE Automation_Engine SHALL generate a PDF from user_profile.resume_text and upload it
9. WHEN all identified fields are filled, THE Automation_Engine SHALL locate the Submit button but SHALL NOT click it
10. WHEN the Submit button is located, THE Automation_Engine SHALL pause execution and notify the user via the Dashboard

### Requirement 6: Human-in-the-Loop Submission Control

**User Story:** As a job seeker, I want to manually review and confirm each application before it's submitted, so that I maintain control over what gets sent to employers.

#### Acceptance Criteria

1. WHEN the Automation_Engine pauses at the Submit button, THE Dashboard SHALL display a notification with "Confirm Submission" and "Cancel" options
2. WHEN the user clicks "Confirm Submission", THE System SHALL signal the Automation_Engine to click the Submit button
3. WHEN the Submit button is clicked, THE System SHALL update the Job_Record status to 'applied'
4. WHEN the user clicks "Cancel", THE System SHALL close the browser instance and keep the Job_Record status as 'approved'
5. THE System SHALL NOT automatically click any Submit buttons without explicit user confirmation

### Requirement 7: Safety Controls and Kill Switch

**User Story:** As a job seeker, I want an emergency stop button, so that I can immediately halt automation if something goes wrong.

#### Acceptance Criteria

1. THE Dashboard SHALL display a prominent "Kill Switch" button whenever the Automation_Engine is active
2. WHEN the user clicks the Kill Switch, THE System SHALL immediately close all active Playwright browser instances
3. WHEN the Kill Switch is activated, THE System SHALL terminate all pending automation tasks
4. WHEN the Kill Switch is activated, THE System SHALL log the termination event with timestamp
5. WHEN the Kill Switch is activated, THE Dashboard SHALL display a confirmation message that automation has been stopped

### Requirement 8: Database Schema and Data Integrity

**User Story:** As a system administrator, I want a well-structured database schema, so that data is stored consistently and reliably.

#### Acceptance Criteria

1. THE System SHALL maintain a jobs table with columns: id, job_url (unique), company, title, description, match_score, status, created_at
2. THE System SHALL enforce a unique constraint on the job_url column to prevent duplicate URLs
3. THE System SHALL enforce an ENUM constraint on status with allowed values: 'new', 'rejected', 'approved', 'applied'
4. THE System SHALL maintain a user_profile table with columns: id, full_name, email, phone, github_url, resume_text, bio
5. WHEN a Job_Record is created, THE System SHALL automatically set created_at to the current timestamp
6. THE System SHALL use PostgreSQL as the database engine hosted on Supabase

### Requirement 9: Rate Limiting and Ethical Scraping

**User Story:** As a system operator, I want the scraper to respect rate limits, so that we avoid being blocked by job boards and act as a responsible web citizen.

#### Acceptance Criteria

1. THE Background_Worker SHALL implement a minimum 30-second delay between consecutive scrape requests to the same domain
2. THE Background_Worker SHALL include a User-Agent header identifying the scraper
3. THE Background_Worker SHALL respect robots.txt directives from target websites
4. IF a target website returns a 429 (Too Many Requests) response, THEN THE Background_Worker SHALL exponentially back off with delays of 60, 120, and 240 seconds
5. THE Background_Worker SHALL log all rate limit encounters for monitoring

### Requirement 10: Error Handling and Resilience

**User Story:** As a job seeker, I want the system to handle errors gracefully, so that one failure doesn't break the entire workflow.

#### Acceptance Criteria

1. IF the Background_Worker fails to scrape a job board, THEN THE System SHALL log the error and continue with the next scheduled scrape
2. IF the Scoring_Engine fails to score a job, THEN THE System SHALL set match_score to null and mark the job for manual review
3. IF the Automation_Engine fails to identify form fields, THEN THE System SHALL notify the user and allow manual application
4. IF the browser crashes during automation, THEN THE System SHALL log the error and reset the Job_Record status to 'approved'
5. WHEN any error occurs, THE System SHALL provide user-friendly error messages in the Dashboard
