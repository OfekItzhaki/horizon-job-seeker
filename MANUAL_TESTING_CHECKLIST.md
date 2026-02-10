# 📋 Manual Testing Checklist

## Overview
This checklist guides you through manual end-to-end testing of the Job Search Agent.

---

## Prerequisites

- [ ] Backend server running on http://localhost:3001
- [ ] Frontend server running on http://localhost:3000
- [ ] Database connected (Supabase)
- [ ] OpenAI API key configured
- [ ] Browser DevTools open (F12) to monitor WebSocket

---

## Test 1: Profile Setup ✅

### Test 1.1: Create Profile with AI Resume Parser

1. [ ] Navigate to http://localhost:3000
2. [ ] Click "My Profile" button
3. [ ] Select "📄 Paste Resume (Quick)" option
4. [ ] Paste a sample resume in the textarea
5. [ ] Click "🤖 Parse Resume with AI" button
6. [ ] Verify parsing spinner appears
7. [ ] Wait for parsing to complete (~5-10 seconds)
8. [ ] Verify "✓ Extracted Data" section appears with:
   - [ ] Work Experience count
   - [ ] Skills count
   - [ ] Education count
   - [ ] Suggested Job Titles
9. [ ] Fill in required fields:
   - [ ] Full Name
   - [ ] Email (valid format)
   - [ ] Phone (optional)
   - [ ] Location (optional)
10. [ ] Add job preferences:
    - [ ] Desired Job Titles
    - [ ] Desired Locations
11. [ ] Click "Save Profile"
12. [ ] Verify success message appears
13. [ ] Verify redirect to jobs page after 1.5 seconds

**Expected Result**: Profile created with structured data extracted from resume

### Test 1.2: Update Profile

1. [ ] Navigate to profile page
2. [ ] Verify existing data is loaded
3. [ ] Update bio field
4. [ ] Click "Save Profile"
5. [ ] Verify success message
6. [ ] Refresh page
7. [ ] Verify changes persisted

**Expected Result**: Profile updates saved successfully

---

## Test 2: Job Discovery & Scoring 🔍

### Test 2.1: View Jobs List

1. [ ] Navigate to http://localhost:3000
2. [ ] Verify jobs are displayed (if any exist)
3. [ ] Check job cards show:
   - [ ] Company name
   - [ ] Job title
   - [ ] Match score (0-100)
   - [ ] Description preview
   - [ ] Color coding (Green 80%+, Yellow 60-79%, Gray <60%)
4. [ ] Verify jobs are sorted by match score (highest first)

**Expected Result**: Jobs displayed with match scores and proper formatting

### Test 2.2: Insert Test Job via API

**PowerShell:**
```powershell
$body = @{
    jobUrl = "https://example.com/job/test-$(Get-Random)"
    company = "Test Company"
    title = "Senior Full Stack Developer"
    description = "Looking for a Senior Full Stack Developer with React, Node.js, and TypeScript experience."
    status = "new"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method POST -Body $body -ContentType "application/json"
```

1. [ ] Run the PowerShell command
2. [ ] Refresh the jobs page
3. [ ] Verify new job appears
4. [ ] Verify match score is calculated (should be high if profile matches)

**Expected Result**: New job appears with calculated match score

---

## Test 3: Job Approval/Rejection 👍👎

### Test 3.1: Approve a Job

1. [ ] Find a job with high match score (80%+)
2. [ ] Click "Proceed" button
3. [ ] Verify button shows loading state
4. [ ] Verify job disappears from "new" list
5. [ ] Check browser console for API call success

**Expected Result**: Job status changes to "approved"

### Test 3.2: Reject a Job

1. [ ] Find a job with low match score
2. [ ] Click "Dismiss" button
3. [ ] Verify button shows loading state
4. [ ] Verify job disappears from list
5. [ ] Check browser console for API call success

**Expected Result**: Job status changes to "rejected"

---

## Test 4: Automation Flow 🤖

### Test 4.1: Start Automation

**PowerShell (replace jobId with an approved job):**
```powershell
$body = @{ jobId = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/automation/start" -Method POST -Body $body -ContentType "application/json"
```

1. [ ] Ensure you have an approved job (status = "approved")
2. [ ] Run the PowerShell command
3. [ ] Verify automation modal opens automatically
4. [ ] Verify modal shows:
   - [ ] Spinner animation
   - [ ] "Starting automation..." message
   - [ ] Job title
   - [ ] Kill Switch button (red)
5. [ ] Verify browser window opens (non-headless)
6. [ ] Watch automation navigate to job URL

**Expected Result**: Modal opens, browser launches, navigates to job page

### Test 4.2: Form Filling

1. [ ] Watch the automation fill form fields
2. [ ] Verify modal updates to "Form fields filled successfully"
3. [ ] Check browser window shows filled fields:
   - [ ] Name
   - [ ] Email
   - [ ] Phone
   - [ ] GitHub URL (if field exists)
4. [ ] Verify resume PDF uploaded (if file field exists)

**Expected Result**: Form fields filled with profile data

### Test 4.3: Pause Before Submit

1. [ ] Wait for automation to locate submit button
2. [ ] Verify modal changes to "paused" state:
   - [ ] Yellow pause icon
   - [ ] "Ready to submit - waiting for confirmation" message
   - [ ] "Confirm Submission" button (green)
   - [ ] "Cancel" button (gray)
   - [ ] Kill Switch button (red)
   - [ ] Safety warning message
3. [ ] Verify submit button is highlighted in browser (red border)
4. [ ] **CRITICAL**: Verify submit button is NOT clicked automatically

**Expected Result**: Automation pauses, waiting for user confirmation

### Test 4.4: Confirm Submission

1. [ ] Review filled form in browser window
2. [ ] Click "Confirm Submission" button in modal
3. [ ] Verify submit button is clicked in browser
4. [ ] Verify modal shows success state:
   - [ ] Green checkmark
   - [ ] "Application submitted successfully" message
5. [ ] Verify modal auto-closes after 3 seconds
6. [ ] Verify browser window closes
7. [ ] Verify jobs list refreshes
8. [ ] Verify job no longer appears in list (status = "applied")

**Expected Result**: Application submitted, job status updated to "applied"

### Test 4.5: Cancel Automation

1. [ ] Start a new automation session
2. [ ] Wait for "paused" state
3. [ ] Click "Cancel" button
4. [ ] Verify modal closes immediately
5. [ ] Verify browser window closes
6. [ ] Verify job status remains "approved" (not changed to "applied")

**Expected Result**: Automation cancelled, job status unchanged

---

## Test 5: Kill Switch 🔴

### Test 5.1: Emergency Stop

1. [ ] Start an automation session
2. [ ] While automation is running (any state), click "Kill Switch" button
3. [ ] Verify confirmation dialog appears
4. [ ] Click "OK" to confirm
5. [ ] Verify all browser windows close immediately
6. [ ] Verify modal closes
7. [ ] Verify alert shows "Kill switch activated"
8. [ ] Check backend console for kill switch log

**Expected Result**: All automation sessions terminated immediately

---

## Test 6: WebSocket Real-Time Updates 🔄

### Test 6.1: WebSocket Connection

1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Navigate to http://localhost:3000
4. [ ] Verify console shows:
   - [ ] "WebSocket connected"
   - [ ] "WebSocket connection confirmed"
5. [ ] Check Network tab → WS filter
6. [ ] Verify WebSocket connection to ws://localhost:3001/ws

**Expected Result**: WebSocket connected successfully

### Test 6.2: Real-Time Status Updates

1. [ ] Start an automation session
2. [ ] Watch console for WebSocket messages:
   - [ ] `automation_started`
   - [ ] `automation_filling`
   - [ ] `automation_paused`
   - [ ] `automation_submitted` or `automation_cancelled`
3. [ ] Verify modal updates in real-time with each message
4. [ ] Verify no page refresh needed

**Expected Result**: Modal updates automatically via WebSocket

### Test 6.3: WebSocket Reconnection

1. [ ] Stop backend server (Ctrl+C)
2. [ ] Verify console shows "WebSocket disconnected"
3. [ ] Restart backend server
4. [ ] Wait 3 seconds
5. [ ] Verify console shows "WebSocket reconnected"

**Expected Result**: WebSocket auto-reconnects after disconnect

---

## Test 7: Error Handling 🚨

### Test 7.1: Invalid Email

1. [ ] Go to profile page
2. [ ] Enter invalid email: "invalid-email"
3. [ ] Click "Save Profile"
4. [ ] Verify error message appears
5. [ ] Verify profile not saved

**Expected Result**: Email validation prevents save

### Test 7.2: Missing Required Fields

1. [ ] Go to profile page
2. [ ] Clear "Full Name" field
3. [ ] Click "Save Profile"
4. [ ] Verify error message appears

**Expected Result**: Required field validation works

### Test 7.3: Network Error Handling

1. [ ] Stop backend server
2. [ ] Try to load jobs page
3. [ ] Verify error handling (no crash)
4. [ ] Restart backend
5. [ ] Refresh page
6. [ ] Verify jobs load successfully

**Expected Result**: Graceful error handling

---

## Test 8: Resume Parser 📄

### Test 8.1: Parse Simple Resume

**Sample Resume:**
```
John Doe
Senior Full Stack Developer

WORK EXPERIENCE

Senior Full Stack Developer at TechCorp
Jan 2020 - Present

Responsibilities:
- Led development of microservices architecture
- Mentored junior developers

Achievements:
- Reduced API response time by 40%
- Implemented CI/CD pipeline

SKILLS

React, Node.js, TypeScript, PostgreSQL, Docker, AWS

EDUCATION

Bachelor of Science in Computer Science
University of Technology, 2016
GPA: 3.8/4.0
```

1. [ ] Go to profile page
2. [ ] Paste the sample resume
3. [ ] Click "Parse Resume with AI"
4. [ ] Verify extracted data shows:
   - [ ] 1 work experience position
   - [ ] 6+ skills
   - [ ] 1 education entry
5. [ ] Verify suggested job titles include "Senior Full Stack Developer"

**Expected Result**: Resume parsed correctly with structured data

### Test 8.2: Parse Complex Resume

1. [ ] Use a real resume with multiple jobs, skills, certifications
2. [ ] Parse the resume
3. [ ] Verify all sections extracted:
   - [ ] Multiple work experiences
   - [ ] All skills listed
   - [ ] Education entries
   - [ ] Certifications (if present)
   - [ ] Languages (if present)

**Expected Result**: Complex resume parsed with all details

### Test 8.3: Parse Resume with Special Characters

1. [ ] Use resume with special characters (é, ñ, ü, etc.)
2. [ ] Parse the resume
3. [ ] Verify special characters preserved

**Expected Result**: Special characters handled correctly

---

## Test 9: Background Worker (Optional) 🔄

### Test 9.1: Start Background Worker

1. [ ] Open new terminal
2. [ ] Run: `cd backend && npm run worker`
3. [ ] Verify worker starts
4. [ ] Verify console shows scraping activity
5. [ ] Wait for scraping cycle to complete
6. [ ] Check database for new jobs
7. [ ] Verify new jobs have match scores

**Expected Result**: Worker scrapes jobs and scores them

---

## Test 10: Performance ⚡

### Test 10.1: Profile Setup Speed

1. [ ] Time profile creation with AI parsing
2. [ ] Verify completes in < 30 seconds

**Expected Result**: Fast profile setup

### Test 10.2: Job Scoring Speed

1. [ ] Insert test job
2. [ ] Time how long scoring takes
3. [ ] Verify completes in < 5 seconds

**Expected Result**: Fast job scoring

### Test 10.3: WebSocket Latency

1. [ ] Start automation
2. [ ] Observe time between backend log and modal update
3. [ ] Verify latency < 500ms

**Expected Result**: Real-time updates feel instant

---

## Test 11: Browser Compatibility 🌐

### Test 11.1: Chrome/Edge

1. [ ] Test all flows in Chrome or Edge
2. [ ] Verify everything works

**Expected Result**: Full compatibility

### Test 11.2: Firefox

1. [ ] Test all flows in Firefox
2. [ ] Verify everything works

**Expected Result**: Full compatibility

---

## Summary Checklist

After completing all tests, verify:

- [ ] Profile creation works (with AI parsing)
- [ ] Jobs display with match scores
- [ ] Job approval/rejection works
- [ ] Automation fills forms correctly
- [ ] Automation pauses before submit (NEVER auto-submits)
- [ ] User can confirm or cancel submission
- [ ] Kill switch terminates all sessions
- [ ] WebSocket provides real-time updates
- [ ] Error handling is graceful
- [ ] Resume parser extracts structured data
- [ ] Performance is acceptable
- [ ] No console errors (except expected ones)

---

## Issues Found

Document any issues discovered during testing:

| Test | Issue | Severity | Status |
|------|-------|----------|--------|
|      |       |          |        |

---

## Sign-Off

- **Tester Name**: _______________
- **Date**: _______________
- **Overall Status**: ⬜ Pass ⬜ Fail ⬜ Pass with Issues
- **Notes**: _______________

---

**Last Updated**: February 10, 2026
