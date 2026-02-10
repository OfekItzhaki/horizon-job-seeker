# Implementation Plan: Human-in-the-Loop Job Search & Application Agent

## Overview

This implementation plan breaks down the job search agent into incremental coding tasks. The approach follows this sequence:

1. Set up project structure and database schema
2. Implement core data models and utilities
3. Build the background worker for job scraping and scoring
4. Create the API server with endpoints
5. Implement the automation engine
6. Build the Next.js dashboard frontend
7. Wire everything together with real-time updates

Each task builds on previous work, with property-based tests integrated close to implementation to catch errors early.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create Next.js project with TypeScript, Tailwind CSS, and ShadcnUI
  - Set up Node.js backend workspace with TypeScript
  - Install dependencies: Drizzle ORM, Playwright, fast-check, LangChain
  - Configure PostgreSQL connection to Supabase
  - Set up testing frameworks (Jest/Vitest, fast-check)
  - _Requirements: 8.6_

- [ ] 2. Define database schema and migrations
  - [ ] 2.1 Create Drizzle schema for jobs table
    - Define jobs table with all columns: id, job_url (unique), company, title, description, match_score, status (ENUM), created_at
    - Add unique constraint on job_url
    - Add ENUM constraint on status field
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 2.2 Create Drizzle schema for user_profile table
    - Define user_profile table with columns: id, full_name, email, phone, github_url, resume_text, bio
    - Add email validation constraint
    - _Requirements: 3.1, 8.4_
  
  - [ ] 2.3 Generate and run database migrations
    - Create migration files from schema
    - Run migrations against Supabase PostgreSQL
    - _Requirements: 8.1, 8.4_
  
  - [ ] 2.4 Write property test for database constraints
    - **Property 16: Database Unique Constraint Enforcement**
    - **Property 17: Status ENUM Constraint Enforcement**
    - **Validates: Requirements 8.2, 8.3**

- [ ] 3. Implement canonical ID generation and deduplication
  - [ ] 3.1 Create canonical ID generator utility
    - Write generateCanonicalId function that slugifies company + title
    - Handle special characters, spaces, and case normalization
    - _Requirements: 1.3_
  
  - [ ] 3.2 Write property tests for canonical ID
    - **Property 1: Canonical ID Determinism**
    - **Validates: Requirements 1.3**
  
  - [ ] 3.3 Implement duplicate detection logic
    - Write checkDuplicate function that queries database by canonical ID
    - Return boolean indicating if job already exists
    - _Requirements: 1.4_
  
  - [ ] 3.4 Write property test for duplicate prevention
    - **Property 2: Duplicate Prevention**
    - **Validates: Requirements 1.4**

- [ ] 4. Build job scraper for LinkedIn and Indeed
  - [ ] 4.1 Create base scraper class with Playwright
    - Set up Playwright browser instance
    - Implement navigation and HTML extraction
    - Add User-Agent header to all requests
    - _Requirements: 1.1, 9.2_
  
  - [ ] 4.2 Implement LinkedIn job scraper
    - Parse LinkedIn job listing pages for "Full Stack Developer"
    - Extract job URL, company, title, description
    - _Requirements: 1.1, 1.2_
  
  - [ ] 4.3 Implement Indeed job scraper
    - Parse Indeed job listing pages for "Full Stack Developer"
    - Extract job URL, company, title, description
    - _Requirements: 1.1, 1.2_
  
  - [ ] 4.4 Add rate limiting with 30-second delays
    - Implement delay mechanism between scrape requests
    - Track last request time per domain
    - _Requirements: 1.6, 9.1_
  
  - [ ] 4.5 Implement robots.txt compliance
    - Parse and respect robots.txt from target sites
    - Skip disallowed URLs
    - _Requirements: 9.3_
  
  - [ ] 4.6 Write property tests for scraper
    - **Property 4: Scrape Rate Limiting**
    - **Property 5: Job Data Extraction Completeness**
    - **Property 18: User-Agent Header Presence**
    - **Property 19: Robots.txt Compliance**
    - **Validates: Requirements 1.2, 1.6, 9.1, 9.2, 9.3**

- [ ] 5. Implement job scoring with GPT-4o-mini
  - [ ] 5.1 Create scoring engine module
    - Set up OpenAI API client for GPT-4o-mini
    - Write scoreJob function that sends job description + resume to LLM
    - Parse LLM response to extract match score (0-100)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 5.2 Add error handling for scoring failures
    - Catch API errors and set match_score to null
    - Log errors for monitoring
    - Implement retry logic with exponential backoff
    - _Requirements: 2.5, 10.2_
  
  - [ ] 5.3 Write property tests for scoring
    - **Property 6: Match Score Range Validation**
    - **Validates: Requirements 2.3**
  
  - [ ] 5.4 Write unit tests for scoring error handling
    - Test API timeout scenarios
    - Test invalid response handling
    - Test null match_score on failure
    - _Requirements: 2.5, 10.2_

- [ ] 6. Implement background worker orchestration
  - [ ] 6.1 Create background worker main loop
    - Schedule periodic job scraping (e.g., every hour)
    - Scrape jobs from LinkedIn and Indeed
    - Generate canonical IDs and check for duplicates
    - Store new jobs with status 'new'
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  
  - [ ] 6.2 Integrate scoring into worker pipeline
    - Fetch user profile from database
    - Score each new job against user resume
    - Store match_score in database
    - _Requirements: 2.1, 2.4_
  
  - [ ] 6.3 Add exponential backoff for 429 responses
    - Detect 429 rate limit responses
    - Implement backoff delays: 60s, 120s, 240s
    - Log rate limit encounters
    - _Requirements: 9.4, 9.5_
  
  - [ ] 6.4 Write property tests for worker
    - **Property 3: New Job Insertion**
    - **Property 20: Exponential Backoff on Rate Limiting**
    - **Property 22: Event Logging Completeness**
    - **Validates: Requirements 1.5, 8.5, 9.4, 9.5, 7.4**

- [ ] 7. Checkpoint - Ensure background worker tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build user profile management API
  - [ ] 8.1 Create profile endpoints
    - GET /api/profile - retrieve user profile
    - PUT /api/profile - update user profile
    - Add email format validation
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 8.2 Write property tests for profile management
    - **Property 7: Profile Update Round Trip**
    - **Property 8: Email Validation**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ] 8.3 Write unit tests for profile edge cases
    - Test resume text at 50,000 characters
    - Test invalid email formats
    - _Requirements: 3.2, 3.4_

- [ ] 9. Build job management API endpoints
  - [ ] 9.1 Create job listing endpoint
    - GET /api/jobs?status=new&minScore=70
    - Filter by status and minimum match score
    - Order by match_score descending
    - _Requirements: 4.1_
  
  - [ ] 9.2 Create job status update endpoint
    - PATCH /api/jobs/:id/status
    - Update job status (new → approved/rejected)
    - Validate status transitions
    - _Requirements: 4.3, 4.4_
  
  - [ ] 9.3 Write property tests for job API
    - **Property 9: Dashboard Job Filtering and Sorting**
    - **Property 11: Job Status State Machine**
    - **Validates: Requirements 4.1, 4.3, 4.4, 6.3, 6.4**

- [ ] 10. Implement automation engine with Playwright
  - [ ] 10.1 Create automation session manager
    - Define AutomationSession interface
    - Implement startSession to launch browser (headless: false)
    - Navigate to job URL
    - Track active sessions
    - _Requirements: 5.1, 5.2_
  
  - [ ] 10.2 Implement LLM-based form field detection
    - Extract page HTML
    - Send to LLM with field detection prompt
    - Parse LLM response for field selectors
    - _Requirements: 5.3_
  
  - [ ] 10.3 Implement form filling logic
    - Fill name, email, phone fields with profile data
    - Conditionally fill GitHub URL if field exists
    - Generate PDF from resume text and upload
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [ ] 10.4 Implement pause-before-submit logic
    - Locate Submit button without clicking
    - Set session status to 'paused'
    - Notify user via API/WebSocket
    - _Requirements: 5.9, 5.10, 6.1_
  
  - [ ] 10.5 Write property tests for automation
    - **Property 12: Form Field Filling Correctness**
    - **Property 13: Resume PDF Round Trip**
    - **Property 14: Automation Pause Before Submission**
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.5**

- [ ] 11. Implement human-in-the-loop submission control
  - [ ] 11.1 Create automation control endpoints
    - POST /api/jobs/:id/apply - start automation
    - POST /api/automation/confirm - confirm submission
    - POST /api/automation/cancel - cancel automation
    - _Requirements: 6.2, 6.4_
  
  - [ ] 11.2 Implement submission confirmation flow
    - On confirm: click Submit button, update status to 'applied'
    - On cancel: close browser, keep status 'approved'
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ] 11.3 Add safety check to prevent auto-submission
    - Ensure Submit button is never clicked without user confirmation
    - Add assertion/guard in code
    - _Requirements: 6.5_
  
  - [ ] 11.4 Write property test for submission safety
    - **Property 14: Automation Pause Before Submission** (already covered in 10.5)
    - **Validates: Requirements 6.5**

- [ ] 12. Implement kill switch functionality
  - [ ] 12.1 Create kill switch endpoint
    - POST /api/automation/kill
    - Close all active browser instances
    - Terminate all automation sessions
    - Log kill switch activation with timestamp
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [ ] 12.2 Write property test for kill switch
    - **Property 15: Kill Switch Termination**
    - **Property 22: Event Logging Completeness** (already covered in 6.4)
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 13. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Build Next.js dashboard UI
  - [ ] 14.1 Create job listing page
    - Display jobs with status 'new'
    - Show job cards with company, title, match_score, description preview
    - Order by match_score descending
    - _Requirements: 4.1, 4.2_
  
  - [ ] 14.2 Add Proceed and Dismiss buttons
    - Wire Proceed button to PATCH /api/jobs/:id/status {approved}
    - Wire Dismiss button to PATCH /api/jobs/:id/status {rejected}
    - Refresh job list after status change
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ] 14.3 Create user profile page
    - Form for editing full_name, email, phone, github_url, resume_text, bio
    - Wire to GET /api/profile and PUT /api/profile
    - Add email validation feedback
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 14.4 Write property test for job card rendering
    - **Property 10: Job Card Rendering Completeness**
    - **Validates: Requirements 4.2**

- [ ] 15. Implement real-time automation status UI
  - [ ] 15.1 Add WebSocket or SSE for real-time updates
    - Set up WebSocket connection from frontend to backend
    - Send automation status updates (filling, paused, submitted, error)
    - _Requirements: 5.10, 6.1_
  
  - [ ] 15.2 Create automation status modal
    - Show "Automation in progress..." when filling forms
    - Show "Confirm Submission" and "Cancel" buttons when paused
    - Wire buttons to /api/automation/confirm and /api/automation/cancel
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ] 15.3 Add kill switch button to UI
    - Display prominent "Kill Switch" button when automation is active
    - Wire to POST /api/automation/kill
    - Show confirmation message after activation
    - _Requirements: 7.1, 7.5_
  
  - [ ] 15.4 Write property test for kill switch UI
    - **Property 15: Kill Switch Termination** (already covered in 12.2)
    - **Validates: Requirements 7.1, 7.5**

- [ ] 16. Implement comprehensive error handling
  - [ ] 16.1 Add error handling to scraper
    - Catch network errors, log and continue
    - Handle timeouts with retry logic
    - _Requirements: 10.1_
  
  - [ ] 16.2 Add error handling to automation engine
    - Catch browser crashes, reset job status to 'approved'
    - Handle field detection failures, notify user
    - _Requirements: 10.3, 10.4_
  
  - [ ] 16.3 Add user-friendly error messages to UI
    - Display error notifications in dashboard
    - Show actionable error messages
    - _Requirements: 10.5_
  
  - [ ] 16.4 Write property test for error resilience
    - **Property 21: Error Resilience and Continuation**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 17. Wire everything together and test end-to-end
  - [ ] 17.1 Set up environment variables and configuration
    - Configure Supabase connection string
    - Add OpenAI API key for GPT-4o-mini
    - Set up LangChain/CrewAI configuration
    - _Requirements: All_
  
  - [ ] 17.2 Create startup script for background worker
    - Run background worker as separate process
    - Schedule periodic scraping
    - _Requirements: 1.1_
  
  - [ ] 17.3 Test complete workflow manually
    - Start background worker, verify jobs are scraped and scored
    - Open dashboard, verify jobs appear with scores
    - Click Proceed, verify automation launches
    - Verify form filling and pause at Submit
    - Confirm submission, verify status updates to 'applied'
    - Test kill switch functionality
    - _Requirements: All_
  
  - [ ] 17.4 Write integration tests for critical flows
    - Test job discovery → scoring → dashboard display flow
    - Test dashboard → automation → submission flow
    - Test kill switch interruption flow
    - _Requirements: All_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Run all unit tests, property tests, and integration tests
  - Verify test coverage meets goals (80%+ unit, all 22 properties)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests are placed close to implementation to catch errors early
- Checkpoints ensure incremental validation at major milestones
- The implementation uses TypeScript throughout (Node.js backend, Next.js frontend)
- All property tests should run with minimum 100 iterations using fast-check
- Each property test must include a comment tag: `// Feature: job-search-agent, Property {number}: {property_text}`
