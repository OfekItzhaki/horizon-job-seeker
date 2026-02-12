# Horizon Job Seeker - User Workflow

## Overview
This app automates job searching and application submission while keeping you in control. You review, approve, and submit - the app handles the tedious parts.

---

## Complete Workflow

### 1. Setup (One-Time)
**What you do:**
- Go to Profile page
- Upload your resume (PDF/DOCX)
- Fill in your details:
  - Full name, email, phone
  - Bio, skills, experience
  - Desired job titles
  - Location preferences

**What happens:**
- Resume is parsed and stored
- Profile is saved to database
- System is ready to score jobs against your profile

---

### 2. Automated Job Discovery (Daily)
**What happens automatically:**
- Cron job runs once daily at 11 AM
- System scrapes jobs from:
  - RSS feeds (most reliable)
  - LinkedIn (optional)
  - Indeed (optional)
- Each job is scored against your profile (0-100)
- High-scoring jobs appear in your dashboard

**You do nothing** - this runs in the background!

---

### 3. Review Jobs (Your Dashboard)
**What you see:**
- List of jobs sorted by match score
- Job details: title, company, description, salary
- Match score (how well it fits your profile)
- Status: New, Approved, Applied, Rejected

**What you do:**
- Review job listings
- Read job descriptions
- Check if it's a good fit
- Click "Apply to this job" for jobs you want

---

### 4. Pre-Fill Application (Automated)
**What you do:**
- Click "Apply to this job" button

**What happens:**
- System opens the job application page
- Automatically fills in:
  - Your name, email, phone
  - Resume upload
  - Cover letter (if needed)
  - Work experience
  - Skills and qualifications
- Stops at the submit button
- Shows you a preview of the filled form

---

### 5. Review & Submit (Your Control)
**What you see:**
- Pre-filled application form
- All your information populated
- Submit button highlighted in red

**What you do:**
- Review the filled information
- Make any manual adjustments if needed
- Click "Confirm Submission" in the app

**What happens:**
- System clicks the submit button
- Application is submitted
- Job status changes to "Applied"
- You get a confirmation

---

## Key Features

### You Stay in Control
- ✅ You approve which jobs to apply to
- ✅ You review pre-filled forms before submission
- ✅ You click the final submit button
- ✅ No applications sent without your approval

### Automation Saves Time
- ⚡ Daily job discovery (no manual searching)
- ⚡ Automatic job scoring (best matches first)
- ⚡ Auto-fill applications (no repetitive typing)
- ⚡ One-click submission (after your review)

### Safety Features
- 🛡️ Kill switch - stop all automation instantly
- 🛡️ Manual mode - trigger searches when you want
- 🛡️ Status tracking - see what's been applied to
- 🛡️ No auto-apply - you always confirm first

---

## API Endpoints

### For Users (via UI)
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job
- `PATCH /api/jobs/:id/status` - Update job status
- `GET /api/profile` - Get your profile
- `PUT /api/profile` - Update your profile
- `POST /api/profile/resume` - Upload resume

### For Automation
- `POST /api/automation/start` - Start application for a job
- `POST /api/automation/confirm` - Confirm and submit
- `POST /api/automation/cancel` - Cancel automation
- `POST /api/automation/kill` - Emergency stop all sessions

### For Cron Jobs
- `POST /api/automation/scrape` - Trigger job scraping (called daily)

---

## Status Flow

```
NEW → APPROVED → APPLIED
  ↓       ↓
REJECTED  REJECTED
```

- **NEW**: Just discovered, not reviewed yet
- **APPROVED**: You clicked "Apply", automation started
- **APPLIED**: Application submitted successfully
- **REJECTED**: You decided not to apply

---

## Example User Journey

### Day 1: Setup
1. Sign up and create profile
2. Upload resume
3. Set job preferences

### Day 2: First Jobs
1. Cron runs at 11 AM
2. 10 new jobs appear in dashboard
3. You review them after work
4. Approve 3 jobs to apply to

### Day 3: Apply
1. Click "Apply" on Job #1
2. System fills the application
3. You review the form
4. Click "Confirm" - application submitted!
5. Repeat for Jobs #2 and #3

### Day 4: More Jobs
1. Cron finds 5 more jobs
2. You review and approve 2
3. Apply to both
4. Reject 3 that don't fit

### Ongoing
- Daily job discovery continues
- You review and apply as you like
- Build up a pipeline of applications
- Track what you've applied to

---

## Tips for Best Results

### Profile Setup
- Upload a well-formatted resume
- Fill in all profile fields completely
- Be specific about desired job titles
- Update skills regularly

### Job Review
- Check match scores (80+ are great fits)
- Read full job descriptions
- Verify company and location
- Only approve jobs you'd actually want

### Application Review
- Always review pre-filled forms
- Check for any missing fields
- Verify contact information
- Make manual edits if needed

### Automation Settings
- Start with manual triggers
- Test a few applications first
- Once comfortable, rely on daily cron
- Use kill switch if anything goes wrong

---

## Troubleshooting

**No jobs appearing?**
- Check if cron job is running (Render dashboard)
- Verify backend is deployed and healthy
- Check backend logs for scraping errors

**Jobs not scored correctly?**
- Update your profile with more details
- Add more skills and experience
- Verify resume is uploaded

**Application not submitting?**
- Check if form fields are filled correctly
- Try manual submission on the job site
- Report the issue (some sites have bot detection)

**Want to stop everything?**
- Click "Kill Switch" button
- All active sessions terminate immediately
- Review what happened before restarting

---

## Future Enhancements

- Email notifications for high-scoring jobs
- Application tracking and follow-ups
- Interview scheduling integration
- Success rate analytics
- Multiple resume versions
- Custom cover letters per job
- LinkedIn profile integration
- Salary negotiation tips

---

**Remember**: This app is your assistant, not your replacement. You're always in control of what gets submitted!
