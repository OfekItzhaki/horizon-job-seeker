# Job Search Agent - Testing Guide

## ✅ Backend Setup Complete!

All backend components are implemented and tested. Here's how to use the system:

## 🚀 Quick Start

### 1. Start the API Server
```bash
cd backend
npm run dev
```
Server will run on: http://localhost:3001

### 2. Test the API
```bash
# Windows PowerShell
.\test-api.ps1

# Linux/Mac
./test-api.sh
```

### 3. Run the Background Worker (Optional)
```bash
cd backend
npm run worker
```

This will:
- Scrape jobs from LinkedIn and Indeed
- Score them against your profile
- Store them in the database

## 📡 API Endpoints

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Create/update profile

### Job Management
- `GET /api/jobs` - List all jobs
- `GET /api/jobs?status=new` - Filter by status
- `GET /api/jobs?minScore=70` - Filter by minimum score
- `PATCH /api/jobs/:id/status` - Update job status

### Automation
- `POST /api/automation/start` - Start automation for a job
- `POST /api/automation/confirm` - Confirm submission
- `POST /api/automation/cancel` - Cancel automation
- `POST /api/automation/kill` - Emergency kill switch
- `GET /api/automation/sessions` - List active sessions

## 🧪 Manual Testing Workflow

### Step 1: Create Your Profile
```powershell
$profileData = @{
    fullName = "Your Name"
    email = "your.email@example.com"
    phone = "+1234567890"
    githubUrl = "https://github.com/yourusername"
    resumeText = "Your resume text here..."
    bio = "Your bio"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/profile" `
    -Method Put `
    -Body $profileData `
    -ContentType "application/json"
```

### Step 2: Manually Add a Test Job
Since the scrapers need real websites, you can manually insert a test job:

```sql
-- In Supabase SQL Editor
INSERT INTO jobs (job_url, company, title, description, match_score, status)
VALUES (
    'https://example.com/job/test',
    'Test Company',
    'Senior Full Stack Developer',
    'Looking for an experienced developer with React and Node.js skills.',
    85,
    'new'
);
```

### Step 3: Get Jobs
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/jobs?status=new"
```

### Step 4: Approve a Job
```powershell
$jobId = 1  # Replace with actual job ID
Invoke-RestMethod -Uri "http://localhost:3001/api/jobs/$jobId/status" `
    -Method Patch `
    -Body '{"status":"approved"}' `
    -ContentType "application/json"
```

### Step 5: Test Automation (Manual)
```powershell
# Start automation
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/automation/start" `
    -Method Post `
    -Body '{"jobId":1}' `
    -ContentType "application/json"

$automationId = $response.automationId

# Browser will open and fill the form
# Review the filled form

# Confirm submission
Invoke-RestMethod -Uri "http://localhost:3001/api/automation/confirm" `
    -Method Post `
    -Body "{\"automationId\":\"$automationId\"}" `
    -ContentType "application/json"
```

## 🔧 Environment Variables

Make sure your `backend/.env` file has:

```env
DATABASE_URL=your_supabase_connection_string_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
```

## 🐛 Troubleshooting

### Database Connection Issues
If you see "password authentication failed":
```bash
# Set environment variable explicitly
$env:DATABASE_URL='your_supabase_connection_string_here'
npm run dev
```

### OpenAI API Errors
Make sure your API key is valid and has credits.

### Browser Automation Issues
- Make sure Playwright browsers are installed: `npx playwright install`
- Check that the job URL is accessible
- Verify the form structure matches what the LLM expects

## 📊 Database Schema

### Jobs Table
- `id` - Primary key
- `job_url` - Unique job URL
- `company` - Company name
- `title` - Job title
- `description` - Job description
- `match_score` - Score (0-100)
- `status` - ENUM: 'new', 'rejected', 'approved', 'applied'
- `created_at` - Timestamp

### User Profile Table
- `id` - Primary key
- `full_name` - User's full name
- `email` - Email address
- `phone` - Phone number (optional)
- `github_url` - GitHub profile (optional)
- `resume_text` - Resume content
- `bio` - Short bio (optional)

## 🎯 Next Steps

1. ✅ Backend is complete and tested
2. ⏳ Build the Next.js frontend dashboard
3. ⏳ Add real-time WebSocket updates
4. ⏳ Deploy to production

## 🔐 Security Notes

- Never commit `.env` files to git
- Rotate API keys regularly
- Use environment-specific credentials
- Enable Supabase Row Level Security (RLS) for production
